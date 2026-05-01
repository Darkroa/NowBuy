import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  useListCategories,
  getListProductsQueryKey,
  getListCategoriesQueryKey,
  getGetStorefrontSummaryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackagePlus, Upload, X } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

const CURATED_CATEGORIES = [
  "shoes",
  "apparel",
  "electronics",
  "home",
  "kitchen",
  "accessories",
  "beauty",
  "outdoor",
  "books",
  "toys",
];

export function ProductForm({ sellerName }: { sellerName: string }) {
  const queryClient = useQueryClient();
  const { data: existingCategories } = useListCategories();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("25");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const { upload, isUploading, progress } = useImageUpload();

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }
    setError(null);
    try {
      const { servingUrl } = await upload(file);
      setImageUrl(servingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allCategorySlugs = Array.from(
    new Set([
      ...(existingCategories?.map((c) => c.slug) ?? []),
      ...CURATED_CATEGORIES,
    ]),
  ).sort();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const finalCategory = (category === "__custom__" ? customCategory : category).trim().toLowerCase();
    if (!finalCategory) {
      setError("Please choose or type a category.");
      return;
    }
    if (!imageUrl) {
      setError("Please upload a product image.");
      return;
    }
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setError("Stock must be a non-negative integer.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createProduct({
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        price: priceNum,
        currency: "NGN",
        imageUrl: imageUrl.trim(),
        stock: Math.floor(stockNum),
        sellerName,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSuccess(`Published "${created.name}".`);
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setTags("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getGetStorefrontSummaryQueryKey(),
        }),
      ]);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Could not create product.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <PackagePlus className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold">Add a product</h3>
          <p className="text-xs text-muted-foreground">Goes live in the catalog instantly.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cloud Runner Sneakers"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-price">Price (₦ NGN)</Label>
          <Input
            id="p-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="49.99"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What it is, who it's for, what makes it great."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-cat">Category</Label>
          <select
            id="p-cat"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a category…</option>
            {allCategorySlugs.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
            <option value="__custom__">+ New category…</option>
          </select>
          {category === "__custom__" && (
            <Input
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. wellness"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-stock">Stock</Label>
          <Input
            id="p-stock"
            type="number"
            min="0"
            step="1"
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product image</Label>
        {imageUrl ? (
          <div className="flex items-start gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border/50 bg-muted/30">
              <img
                src={imageUrl}
                alt="preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Looking good. Click ✕ to choose a different image.
            </p>
          </div>
        ) : (
          <label
            htmlFor="p-img-file"
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 px-6 py-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors ${isUploading ? "pointer-events-none opacity-70" : ""}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm font-medium">
              {isUploading ? `Uploading… ${progress}%` : "Click to upload from your device"}
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, or WebP · up to 10 MB</p>
            <input
              id="p-img-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPickImage}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-tags">Tags (comma separated)</Label>
        <Input
          id="p-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="lightweight, breathable, unisex"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          {success}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full md:w-auto">
        {submitting ? "Publishing…" : "Publish product"}
      </Button>
    </form>
  );
}
