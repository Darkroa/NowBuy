import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type BankDetails = { bankName: string; accountName: string; accountNumber: string };

export function BankDetailsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankDetails>({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  useEffect(() => {
    fetch("/api/settings/bank")
      .then((r) => r.json())
      .then((d) => {
        setForm(d as BankDetails);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(field: keyof BankDetails, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/bank", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ title: "Error", description: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Saved", description: "Bank details updated successfully." });
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border/50 shadow-sm space-y-5">
      <div>
        <h3 className="font-semibold text-base mb-1">Bank transfer details</h3>
        <p className="text-sm text-muted-foreground">
          These details are shown to customers who choose manual bank transfer at checkout.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank name</Label>
          <Input
            id="bankName"
            placeholder="e.g. First Bank"
            value={form.bankName}
            onChange={(e) => handleChange("bankName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountName">Account name</Label>
          <Input
            id="accountName"
            placeholder="e.g. NowBuy Marketplace Ltd"
            value={form.accountName}
            onChange={(e) => handleChange("accountName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountNumber">Account number</Label>
          <Input
            id="accountNumber"
            placeholder="e.g. 0123456789"
            value={form.accountNumber}
            onChange={(e) => handleChange("accountNumber", e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : "Save details"}
      </Button>
    </Card>
  );
}
