import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../lib/auth";
import { serializeProduct } from "../lib/serializers";

const router: IRouter = Router();

router.get("/admin/products", requireRole("admin", "pm"), async (_req: Request, res: Response) => {
  const rows = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(rows.map(serializeProduct));
});

router.patch("/admin/products/:id", requireRole("admin", "pm"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const {
    name, description, category, price, originalPrice, stock,
    imageUrl, images, colors, productType, tags, rating,
  } = req.body as {
    name?: string; description?: string; category?: string;
    price?: number; originalPrice?: number | null; stock?: number; imageUrl?: string;
    images?: string[]; colors?: string[]; productType?: string; tags?: string[];
    rating?: number;
  };

  const [updated] = await db
    .update(productsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(price !== undefined && { price }),
      ...(originalPrice !== undefined && { originalPrice: originalPrice ?? null }),
      ...(stock !== undefined && { stock }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(images !== undefined && { images }),
      ...(colors !== undefined && { colors }),
      ...(productType !== undefined && { productType }),
      ...(tags !== undefined && { tags }),
      ...(rating !== undefined && { rating }),
    })
    .where(eq(productsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeProduct(updated));
});

router.delete("/admin/products/:id", requireRole("admin", "pm"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).end();
});

export default router;
