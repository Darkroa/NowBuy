import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Loader2, Upload, X, Plus, Save } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

type Product = {
  id: number; name: string; description: string; category: string;
  price: number; originalPrice: number | null; currency: string; imageUrl: string; images: string[];
  colors: string[]; productType: string; stock: number;
  sellerName: string; tags: string[]; rating: number;
};

export function AdminProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { upload, isUploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/products", { credentials: "include" })
      .then(r => r.json()).then(d => { setProducts(d as Product[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function startEdit(p: Product) {
    setEditing({ ...p, images: p.images ?? [], colors: p.colors ?? [], tags: p.tags ?? [], originalPrice: p.originalPrice ?? null });
  }

  async function handleMainImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !editing) return;
    try {
      const { servingUrl } = await upload(file);
      setEditing(prev => prev ? { ...prev, imageUrl: servingUrl } : prev);
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
  }

  async function handleExtraImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); e.target.value = "";
    if (!editing) return;
    for (const file of files) {
      try {
        const { servingUrl } = await upload(file);
        setEditing(prev => prev ? { ...prev, images: [...prev.images, servingUrl] } : prev);
      } catch { /* skip */ }
    }
  }

  function removeExtraImage(url: string) {
    setEditing(prev => prev ? { ...prev, images: prev.images.filter(i => i !== url) } : prev);
  }

  async function handleSave() {
    if (!editing) return;
    if (editing.originalPrice !== null && editing.originalPrice <= editing.price) {
      toast({ title: "Original price must be greater than the sale price.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name, description: editing.description,
          category: editing.category, price: editing.price,
          originalPrice: editing.originalPrice,
          stock: editing.stock, imageUrl: editing.imageUrl,
          images: editing.images, colors: editing.colors,
          productType: editing.productType, tags: editing.tags,
          rating: editing.rating,
        }),
      });
      const updated = await res.json() as Product;
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditing(null);
      toast({ title: "Product updated!" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editing?.id === id) setEditing(null);
      toast({ title: "Product deleted" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeleting(null); }
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="text-sm text-muted-foreground py-6 text-center">Loading products…</div>;

  return (
    <div className="space-y-6">
      {editing && (
        <Card className="p-6 border-primary/20 bg-primary/5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Editing: {editing.name}</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editing.name} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : p)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={editing.category} onChange={e => setEditing(p => p ? { ...p, category: e.target.value } : p)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Sale price (₦)</Label>
              <Input type="number" value={editing.price} onChange={e => setEditing(p => p ? { ...p, price: Number(e.target.value) } : p)} />
            </div>
            <div className="space-y-1.5">
              <Label>Original / slash price (₦)</Label>
              <Input
                type="number"
                value={editing.originalPrice ?? ""}
                placeholder="Leave blank to remove"
                onChange={e => setEditing(p => p ? { ...p, originalPrice: e.target.value ? Number(e.target.value) : null } : p)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={editing.stock} onChange={e => setEditing(p => p ? { ...p, stock: Number(e.target.value) } : p)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rating (1–5)</Label>
              <Input type="number" min="1" max="5" step="0.1" value={editing.rating} onChange={e => setEditing(p => p ? { ...p, rating: Number(e.target.value) } : p)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={editing.description} onChange={e => setEditing(p => p ? { ...p, description: e.target.value } : p)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Product type</Label>
              <Input value={editing.productType} onChange={e => setEditing(p => p ? { ...p, productType: e.target.value } : p)} placeholder="e.g. Sneakers" />
            </div>
            <div className="space-y-1.5">
              <Label>Colors (comma separated)</Label>
              <Input value={editing.colors.join(", ")} onChange={e => setEditing(p => p ? { ...p, colors: e.target.value.split(",").map(c => c.trim()).filter(Boolean) } : p)} placeholder="Red, Blue, Black" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={editing.tags.join(", ")} onChange={e => setEditing(p => p ? { ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } : p)} />
          </div>

          <div className="space-y-2">
            <Label>Main image</Label>
            <div className="flex items-center gap-3">
              {editing.imageUrl && <img src={editing.imageUrl} alt="" className="h-16 w-16 rounded-md object-cover border" />}
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={isUploading}>
                <Upload className="h-3.5 w-3.5" /> {isUploading ? "Uploading…" : "Change"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleMainImage} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional images</Label>
            <div className="flex flex-wrap gap-2">
              {editing.images.map(img => (
                <div key={img} className="relative h-16 w-16">
                  <img src={img} alt="" className="h-full w-full rounded-md object-cover border" />
                  <button type="button" onClick={() => removeExtraImage(img)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => extraFileRef.current?.click()}
                className="h-16 w-16 rounded-md border-2 border-dashed border-border/60 hover:border-primary/40 flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
              <input ref={extraFileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleExtraImage} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </Card>
      )}

      <div className="grid gap-3">
        {products.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No products yet.</p>}
        {products.map(p => (
          <Card key={p.id} className="flex items-center gap-4 p-4 border-border/50">
            <img src={p.imageUrl} alt={p.name} className="h-14 w-14 rounded-md object-cover border border-border/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.category} · {fmt(p.price)}
                {p.originalPrice ? <span className="line-through text-muted-foreground ml-1">{fmt(p.originalPrice)}</span> : ""}
                {" · "}Stock: {p.stock} · ★{p.rating.toFixed(1)}
              </p>
              {p.colors.length > 0 && <div className="flex gap-1 mt-1">{p.colors.map(c => <Badge key={c} variant="outline" className="text-[10px] py-0">{c}</Badge>)}</div>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => startEdit(p)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
