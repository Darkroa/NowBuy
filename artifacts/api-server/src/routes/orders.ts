import { Router, type IRouter, type Request, type Response } from "express";
import { db, ordersTable, cartItemsTable, productsTable, usersTable, notificationsTable } from "@workspace/db";
import { and, eq, desc, inArray } from "drizzle-orm";
import { PlaceOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { serializeOrder } from "../lib/serializers";
import { generateTrackingCode } from "../lib/tracking";
import { requireRole, getUserFromCookie } from "../lib/auth";
import { sendOrderEmail } from "./email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export async function placeOrderForSession(
  sessionId: string,
  shippingAddress: string,
  placedBy: "user" | "ai",
  userId?: number,
) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  if (items.length === 0) {
    return { error: "Cart is empty" as const };
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, items.map((i) => i.productId)));
  const byId = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const orderItems = items.map((i) => {
    const p = byId.get(i.productId)!;
    total += i.quantity * p.price;
    return {
      productId: p.id,
      productName: p.name,
      quantity: i.quantity,
      unitPrice: p.price,
      imageUrl: p.imageUrl,
    };
  });
  total = Math.round(total * 100) / 100;

  const [order] = await db
    .insert(ordersTable)
    .values({
      sessionId,
      userId: userId ?? null,
      status: "placed",
      total,
      currency: "NGN",
      trackingCode: generateTrackingCode(),
      shippingAddress,
      placedBy,
      items: orderItems,
    })
    .returning();

  await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

  return { order: order! };
}

export async function sendPlacedEmailAndNotification(
  order: { trackingCode: string; total: number; currency: string; shippingAddress: string },
  userId: number,
) {
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!userRow?.email) return;
  await sendOrderEmail({
    to: userRow.email,
    name: userRow.name,
    orderStatus: "placed",
    trackingCode: order.trackingCode,
    total: order.total,
    currency: order.currency,
    shippingAddress: order.shippingAddress,
  });
  await db.insert(notificationsTable).values({
    userId: userRow.id,
    title: `Order ${order.trackingCode} placed`,
    message: `Your order has been placed successfully. Total: ₦${order.total.toLocaleString()}.`,
  });
}

router.get("/orders", async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.sessionId, req.sessionId))
    .orderBy(desc(ordersTable.createdAt));
  res.json(rows.map(serializeOrder));
});

router.post("/orders", async (req: Request, res: Response) => {
  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const user = await getUserFromCookie(req);
  const placedBy = (parsed.data.placedBy as "user" | "ai" | undefined) ?? "user";
  const result = await placeOrderForSession(req.sessionId, parsed.data.shippingAddress, placedBy, user?.id);
  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  if (user?.id) {
    try { await sendPlacedEmailAndNotification(result.order, user.id); } catch (err) { logger.error({ err }, "order placed email failed"); }
  }
  res.status(201).json(serializeOrder(result.order));
});

router.patch(
  "/orders/:id/status",
  requireRole("admin", "pm"),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const [updated] = await db
      .update(ordersTable)
      .set({ status: parsed.data.status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (updated.userId) {
      try {
        const [userRow] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, updated.userId));

        if (userRow?.email) {
          await sendOrderEmail({
            to: userRow.email,
            name: userRow.name,
            orderStatus: updated.status,
            trackingCode: updated.trackingCode,
            total: updated.total,
            currency: updated.currency,
            shippingAddress: updated.shippingAddress,
          });
          await db.insert(notificationsTable).values({
            userId: userRow.id,
            title: `Order ${updated.trackingCode}`,
            message: `Your order status has been updated to: ${updated.status}.`,
          });
        }
      } catch (err) { logger.error({ err }, "order status email failed"); }
    }

    res.json(serializeOrder(updated));
  },
);

router.get("/orders/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.sessionId, req.sessionId)));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeOrder(row));
});

export default router;
