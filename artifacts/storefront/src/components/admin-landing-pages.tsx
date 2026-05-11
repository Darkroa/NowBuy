import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Plus, ExternalLink, Copy } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";

type LandingPage = {
  id: number; slug: string; title: string; description: string;
  productIds: number[]; createdAt: string;
};

export function AdminLandingPages() {
  const { toast } = useToast();
  const { data: allProducts } = useListProducts();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", description: "", productIds: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/landing-pages", { credentials: "include" })
      .then(r => r.json()).then(d => { setPages(d as LandingPage[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const productIds = form.productIds.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (!form.slug.trim() || !form.title.trim() || productIds.length === 0) {
      toast({ title: "Slug, title, and at least one product ID required.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/landing-pages", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(), title: form.title.trim(),
          description: form.description.trim(), productIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast({ title: "Error", description: err.error ?? "Failed to create", variant: "destructive" });
        return;
      }
      const created = await res.json() as LandingPage;
      setPages(prev => [created, ...prev]);
      setForm({ slug: "", title: "", description: "", productIds: "" });
      toast({ title: "Page created!", description: `/shop/${created.slug}` });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setCreating(false); }
  }

  async function handleDelete(id: number, slug: string) {
    if (!confirm(`Delete page "${slug}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/landing-pages/${id}`, { method: "DELETE", credentials: "include" });
      setPages(prev => prev.filter(p => p.id !== id));
      toast({ title: "Page deleted" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeleting(null); }
  }

  const productOptions = allProducts ?? [];

  function toggleProduct(id: number) {
    const current = form.productIds
      .split(",").map(s => s.trim()).filter(Boolean)
      .map(Number).filter(n => !isNaN(n));
    const updated = current.includes(id) ? current.filter(n => n !== id) : [...current, id];
    setForm(f => ({ ...f, productIds: updated.join(", ") }));
  }

  const selectedIds = new Set(
    form.productIds.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)
  );

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold">Create landing page</h3>
            <p className="text-xs text-muted-foreground">Pick products and share a unique URL with customers.</p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Slug (URL path)</Label>
              <Input
                placeholder="e.g. black-friday-deals"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                required
              />
              {form.slug && <p className="text-xs text-muted-foreground">/shop/{form.slug}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Page title</Label>
              <Input
                placeholder="e.g. Black Friday Deals"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Short description shown at the top of the page…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Select products ({selectedIds.size} selected)</Label>
            <div className="border border-border/50 rounded-xl p-3 max-h-48 overflow-y-auto grid gap-1">
              {productOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading products…</p>
              ) : productOptions.map(p => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="accent-primary"
                  />
                  <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover border border-border/30" />
                  <span className="text-sm flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.category}</span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={creating || selectedIds.size === 0} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? "Creating…" : "Create page"}
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-base">Landing pages</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No landing pages yet.</p>
        ) : (
          pages.map(page => (
            <Card key={page.id} className="flex items-center gap-4 p-4 border-border/50">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground font-mono">/shop/{page.slug}</p>
                <p className="text-xs text-muted-foreground">{page.productIds.length} products</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm" variant="outline" className="h-8 gap-1.5"
                  onClick={() => window.open(`/shop/${page.slug}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View
                </Button>
                <Button
                  size="sm" variant="outline" className="h-8 w-8 p-0"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shop/${page.slug}`); toast({ title: "Link copied!" }); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="destructive" className="h-8 w-8 p-0"
                  onClick={() => handleDelete(page.id, page.slug)}
                  disabled={deleting === page.id}
                >
                  {deleting === page.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
