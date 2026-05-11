import { Router, type IRouter, type Request, type Response } from "express";
import { db, cashbackCodesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/cashback", requireRole("admin"), async (_req: Request, res: Response) => {
  const rows = await db.select().from(cashbackCodesTable).orderBy(desc(cashbackCodesTable.createdAt));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/admin/cashback", requireRole("admin"), async (req: Request, res: Response) => {
  const { code, amount, maxUses } = req.body as { code?: string; amount?: number; maxUses?: number };
  if (!code || !amount || !maxUses) {
    res.status(400).json({ error: "code, amount and maxUses required" });
    return;
  }
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 3) { res.status(400).json({ error: "Code too short" }); return; }
  try {
    const [row] = await db.insert(cashbackCodesTable).values({
      code: trimmed, amount: Number(amount), maxUses: Number(maxUses),
    }).returning();
    res.status(201).json({ ...row!, createdAt: row!.createdAt.toISOString() });
  } catch {
    res.status(400).json({ error: "Code already exists" });
  }
});

router.delete("/admin/cashback/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(cashbackCodesTable).where(eq(cashbackCodesTable.id, id));
  res.status(204).end();
});

router.post("/cashback/validate", async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  const [row] = await db.select().from(cashbackCodesTable)
    .where(eq(cashbackCodesTable.code, code.trim().toUpperCase()));
  if (!row || !row.isActive || row.usedCount >= row.maxUses) {
    res.json({ valid: false, message: "Invalid or expired cashback code." });
    return;
  }
  res.json({ valid: true, amount: row.amount, code: row.code, message: `₦${row.amount.toLocaleString()} cashback applied!` });
});

export default router;
