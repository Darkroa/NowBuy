import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  chatMessagesTable,
  productsTable,
  cartItemsTable,
} from "@workspace/db";
import { and, eq, desc, asc, ilike, or, inArray, sql } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { serializeProduct } from "../lib/serializers";
import { buildCart } from "./cart";
import { placeOrderForSession } from "./orders";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are the NowBuy shopping concierge — warm, concise, and helpful.

You help shoppers discover products and, when they're ready, place orders for them.

Tools you can use:
- search_products: find products that match a shopper's need.
- add_to_cart: add a specific product to the shopper's cart.
- place_order: finalize the current cart into an order. NEVER call this without the shopper's explicit confirmation in the most recent message.

Behavior rules:
- If the shopper greets you with no product mention, ask warmly what they're looking for today.
- The MOMENT a shopper mentions any product category, item type, or need (even a vague one like "running shoes" or "something for my desk"), CALL search_products immediately with that as the query. Do not ask for size, color, brand, or budget first — show them options first, then refine. The UI renders matched products as visual cards next to your reply.
- After the tool returns, briefly mention 2-3 of the best matches by name (do not paste image links or prices in long lists — the cards show them).
- If the tool returns nothing, only THEN ask the shopper to clarify.
- When they say "add it" / "I'll take it" / pick a specific item, call add_to_cart, then ask if they'd like to keep shopping or check out.
- When they ask to buy / checkout / "place the order": if you have NOT yet received their explicit confirmation in this turn, summarize the cart and ask "Confirm purchase of X for $Y?" — do not call place_order yet.
- Only call place_order when the user clearly confirms in the same turn (e.g. "yes confirm", "go ahead", or the system tells you confirmOrder=true). After ordering, congratulate them and mention the tracking code briefly.
- Keep responses to 1-3 short sentences.`;

async function searchProductsTool(query: string, limit = 6) {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !["the", "for", "and", "any", "with", "please", "looking", "want", "need", "find", "show", "buy"].includes(t));

  const tokensToUse = tokens.length > 0 ? tokens : [query.toLowerCase()];

  const conditions = tokensToUse.map((t) => {
    const like = `%${t}%`;
    return or(
      ilike(productsTable.name, like),
      ilike(productsTable.description, like),
      ilike(productsTable.category, like),
      sql`${productsTable.tags}::text ILIKE ${like}`,
    );
  });

  const rows = await db
    .select()
    .from(productsTable)
    .where(or(...conditions))
    .limit(limit);
  return rows;
}

const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search the catalog by free-text query (e.g., 'black running shoes size 10').",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the shopper is looking for." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a product to the shopper's cart.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "integer" },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "place_order",
      description:
        "Place an order for everything currently in the shopper's cart. ONLY call after explicit confirmation.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

router.get("/chat/messages", async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, req.sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const allSuggestionIds = Array.from(
    new Set(rows.flatMap((r) => (r.productSuggestions ?? []) as number[])),
  );
  const productMap = new Map<number, ReturnType<typeof serializeProduct>>();
  if (allSuggestionIds.length) {
    const ps = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, allSuggestionIds));
    ps.forEach((p) => productMap.set(p.id, serializeProduct(p)));
  }

  res.json(
    rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      productSuggestions: ((m.productSuggestions ?? []) as number[])
        .map((id) => productMap.get(id))
        .filter((p): p is NonNullable<typeof p> => !!p),
    })),
  );
});

router.post("/chat/reset", async (req: Request, res: Response) => {
  await db
    .delete(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, req.sessionId));
  res.status(204).end();
});

router.post("/chat/messages", async (req: Request, res: Response) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { content, confirmOrder, shippingAddress } = parsed.data;
  const sessionId = req.sessionId;

  const [userRow] = await db
    .insert(chatMessagesTable)
    .values({ sessionId, role: "user", content })
    .returning();

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt))
    .limit(40);

  const cart = await buildCart(sessionId);
  const cartSummary =
    cart.items.length === 0
      ? "(cart is empty)"
      : cart.items
          .map((i) => `${i.quantity}x ${i.product.name} ($${i.product.price})`)
          .join(", ") + ` — subtotal $${cart.subtotal}`;

  const messages: {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: unknown;
  }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Current cart: ${cartSummary}. confirmOrder=${confirmOrder ? "true" : "false"}. shippingAddress=${shippingAddress ?? "(none provided)"}`,
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const suggestedIds: number[] = [];
  const addedProductIds: number[] = [];
  let placedOrderId: number | null = null;
  let needsShippingAddress = false;
  let needsConfirmation = false;
  let assistantText = "";

  // Loop with tool calling, max 4 hops
  for (let hop = 0; hop < 4; hop++) {
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 1200,
        // @ts-expect-error tool typing differs across SDK versions
        messages,
        tools,
        tool_choice: "auto",
      });
    } catch (err) {
      req.log.error({ err }, "OpenAI chat error");
      assistantText =
        "I'm having a little trouble reaching my brain right now — could you try that again in a moment?";
      break;
    }

    const choice = completion.choices[0];
    if (!choice) break;
    const msg = choice.message;
    const toolCalls = (msg as unknown as { tool_calls?: Array<{
      id: string;
      function: { name: string; arguments: string };
    }> }).tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      assistantText = msg.content?.toString() ?? "";
      break;
    }

    // Add assistant tool call message
    messages.push({
      role: "assistant",
      content: msg.content?.toString() ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      if (call.function.name === "search_products") {
        const query = String(args["query"] ?? "");
        const found = await searchProductsTool(query);
        found.forEach((p) => {
          if (!suggestedIds.includes(p.id)) suggestedIds.push(p.id);
        });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(
            found.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              rating: p.rating,
              stock: p.stock,
            })),
          ),
        });
      } else if (call.function.name === "add_to_cart") {
        const productId = Number(args["productId"]);
        const quantity = Math.max(1, Number(args["quantity"] ?? 1));
        const [p] = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, productId));
        if (!p) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: "product not found" }),
          });
        } else {
          const [existing] = await db
            .select()
            .from(cartItemsTable)
            .where(
              and(
                eq(cartItemsTable.sessionId, sessionId),
                eq(cartItemsTable.productId, productId),
              ),
            );
          if (existing) {
            await db
              .update(cartItemsTable)
              .set({ quantity: existing.quantity + quantity })
              .where(
                and(
                  eq(cartItemsTable.sessionId, sessionId),
                  eq(cartItemsTable.productId, productId),
                ),
              );
          } else {
            await db
              .insert(cartItemsTable)
              .values({ sessionId, productId, quantity });
          }
          addedProductIds.push(productId);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ added: { id: p.id, name: p.name, quantity } }),
          });
        }
      } else if (call.function.name === "place_order") {
        if (!confirmOrder) {
          needsConfirmation = true;
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              status: "awaiting_confirmation",
              note: "Do not place the order until the shopper confirms in their next message.",
            }),
          });
        } else if (!shippingAddress) {
          needsShippingAddress = true;
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              status: "awaiting_shipping_address",
            }),
          });
        } else {
          const result = await placeOrderForSession(
            sessionId,
            shippingAddress,
            "ai",
          );
          if ("error" in result) {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({ error: result.error }),
            });
          } else {
            placedOrderId = result.order.id;
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({
                orderId: result.order.id,
                trackingCode: result.order.trackingCode,
                total: result.order.total,
              }),
            });
          }
        }
      } else {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: "unknown tool" }),
        });
      }
    }
  }

  if (!assistantText) {
    assistantText = "Got it.";
  }

  const [assistantRow] = await db
    .insert(chatMessagesTable)
    .values({
      sessionId,
      role: "assistant",
      content: assistantText,
      productSuggestions: suggestedIds,
    })
    .returning();

  // Hydrate suggested products
  const suggestedProducts = suggestedIds.length
    ? (
        await db
          .select()
          .from(productsTable)
          .where(inArray(productsTable.id, suggestedIds))
      ).map(serializeProduct)
    : [];

  // Build addedToCart payload
  const updatedCart = await buildCart(sessionId);
  const addedToCart = updatedCart.items.filter((ci) =>
    addedProductIds.includes(ci.productId),
  );

  let placedOrder: ReturnType<typeof import("../lib/serializers").serializeOrder> | undefined;
  if (placedOrderId) {
    const { ordersTable } = await import("@workspace/db");
    const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, placedOrderId));
    if (o) {
      const { serializeOrder } = await import("../lib/serializers");
      placedOrder = serializeOrder(o);
    }
  }

  res.json({
    userMessage: {
      id: userRow!.id,
      role: "user",
      content: userRow!.content,
      createdAt: userRow!.createdAt.toISOString(),
      productSuggestions: [],
    },
    assistantMessage: {
      id: assistantRow!.id,
      role: "assistant",
      content: assistantRow!.content,
      createdAt: assistantRow!.createdAt.toISOString(),
      productSuggestions: suggestedProducts,
    },
    suggestedProducts,
    addedToCart,
    placedOrder,
    needsConfirmation,
    needsShippingAddress,
  });
});

export default router;
