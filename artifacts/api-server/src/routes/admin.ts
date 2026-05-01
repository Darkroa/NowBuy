import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
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

export default router;
