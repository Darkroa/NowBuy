import { Router, type IRouter, type Request, type Response } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { AddCartItemBody } from "@workspace/api-zod";
import { serializeProduct } from "../lib/serializers";

const router: IRouter = Router();

export async function buildCart(sessionId: string) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  if (items.length === 0) {
    return { items: [], subtotal: 0, currency: "NGN" };
  }

  const productIds = items.map((i) => i.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));

  const byId = new Map(products.map((p) => [p.id, p]));
  const cartItems = items
    .map((i) => {
      const p = byId.get(i.productId);
      if (!p) return null;
      return {
        productId: i.productId,
        quantity: i.quantity,
        product: serializeProduct(p),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = cartItems.reduce(
    (sum, ci) => sum + ci.quantity * ci.product.price,
    0,
  );

  return {
    items: cartItems,
    subtotal: Math.round(subtotal * 100) / 100,
    currency: "NGN",
  };
}

router.get("/cart", async (req: Request, res: Response) => {
  res.json(await buildCart(req.sessionId));
});

router.delete("/cart", async (req: Request, res: Response) => {
  await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, req.sessionId));
  res.status(204).end();
});

router.post("/cart/items", async (req: Request, res: Response) => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { productId, quantity } = parsed.data;

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.sessionId, req.sessionId),
        eq(cartItemsTable.productId, productId),
      ),
    );

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(
        and(
          eq(cartItemsTable.sessionId, req.sessionId),
          eq(cartItemsTable.productId, productId),
        ),
      );
  } else {
    await db
      .insert(cartItemsTable)
      .values({ sessionId: req.sessionId, productId, quantity });
  }

  res.json(await buildCart(req.sessionId));
});

router.delete("/cart/items/:productId", async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  await db
    .delete(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.sessionId, req.sessionId),
        eq(cartItemsTable.productId, productId),
      ),
    );
  res.json(await buildCart(req.sessionId));
});

export default router;
