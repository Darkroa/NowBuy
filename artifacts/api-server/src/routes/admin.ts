import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, ordersTable } from "@workspace/db";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import { UpdateUserRoleBody } from "@workspace/api-zod";
import { requireRole } from "../lib/auth";
import { serializeOrder } from "../lib/serializers";

const router: IRouter = Router();

function publicUser(u: { id: number; email: string; name: string; role: string }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

router.get("/admin/users", requireRole("admin"), async (_req: Request, res: Response) => {
  const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(rows.map(publicUser));
});

router.patch("/admin/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(publicUser(updated));
});

router.delete("/admin/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const authUser = (req as Request & { authUser: { id: number } }).authUser;
  if (authUser.id === id) {
    res.status(400).json({ error: "You can't delete your own account" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).end();
});

router.get("/admin/orders", requireRole("admin", "pm"), async (_req: Request, res: Response) => {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(rows.map(serializeOrder));
});

router.get("/admin/sales-summary", requireRole("admin", "pm"), async (_req: Request, res: Response) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const active = allOrders.filter(o => o.status !== "cancelled");

  const todayOrders = active.filter(o => o.createdAt >= todayStart);
  const monthOrders = active.filter(o => o.createdAt >= monthStart);

  const sum = (arr: typeof active) => arr.reduce((a, o) => a + o.total, 0);

  const last30Days: { date: string; total: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getTime() + 86400000);
    const dayOrders = active.filter(o => o.createdAt >= d && o.createdAt < next);
    last30Days.push({
      date: d.toISOString().slice(0, 10),
      total: sum(dayOrders),
      orders: dayOrders.length,
    });
  }

  res.json({
    todayTotal: sum(todayOrders),
    monthTotal: sum(monthOrders),
    allTimeTotal: sum(active),
    todayOrders: todayOrders.length,
    monthOrders: monthOrders.length,
    allTimeOrders: active.length,
    dailyChart: last30Days,
  });
});

export default router;
