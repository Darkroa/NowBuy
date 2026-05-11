import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Plus, Tag, Copy } from "lucide-react";

type CashbackCode = {
  id: number; code: string; amount: number;
  maxUses: number; usedCount: number; isActive: boolean; createdAt: string;
};

export function AdminCashbackManager() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<CashbackCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", amount: "", maxUses: "1" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cashback", { credentials: "include" })
      .then(r => r.json()).then(d => { setCodes(d as CashbackCode[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.amount || Number(form.amount) < 1) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/cashback", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.trim(), amount: Number(form.amount), maxUses: Number(form.maxUses) }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast({ title: "Error", description: err.error ?? "Failed to create", variant: "destructive" });
        return;
      }
      const created = await res.json() as CashbackCode;
      setCodes(prev => [created, ...prev]);
      setForm({ code: "", amount: "", maxUses: "1" });
      toast({ title: "Code created!", description: `${created.code} — ₦${created.amount.toLocaleString()}` });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setCreating(false); }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Delete code "${code}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/cashback/${id}`, { method: "DELETE", credentials: "include" });
      setCodes(prev => prev.filter(c => c.id !== id));
      toast({ title: "Code deleted" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeleting(null); }
  }

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold">Create cashback code</h3>
            <p className="text-xs text-muted-foreground">Customers apply this at checkout to get a discount.</p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input
              placeholder="e.g. SAVE500"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="uppercase font-mono"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Discount amount (₦)</Label>
            <Input
              type="number" min="1"
              placeholder="500"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max uses</Label>
            <Input
              type="number" min="1"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Creating…" : "Create code"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-base">Active codes</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No cashback codes yet.</p>
        ) : (
          codes.map(c => (
            <Card key={c.id} className="flex items-center gap-4 p-4 border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-base">{c.code}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied!" }); }}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {!c.isActive && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {fmt(c.amount)} discount · {c.usedCount}/{c.maxUses} uses
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => handleDelete(c.id, c.code)}
                disabled={deleting === c.id}
              >
                {deleting === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
