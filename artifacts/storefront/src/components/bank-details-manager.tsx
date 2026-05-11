import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, X } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

type BankDetails = { bankName: string; accountName: string; accountNumber: string; bankLogo?: string };

export function BankDetailsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankDetails>({ bankName: "", accountName: "", accountNumber: "", bankLogo: "" });
  const { upload, isUploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/bank")
      .then((r) => r.json())
      .then((d) => { setForm(d as BankDetails); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(field: keyof BankDetails, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const { servingUrl } = await upload(file);
      setForm(prev => ({ ...prev, bankLogo: servingUrl }));
      toast({ title: "Logo uploaded!" });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
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

      {/* Logo */}
      <div className="space-y-2">
        <Label>Bank logo <span className="text-muted-foreground font-normal">(optional, shown as round icon)</span></Label>
        <div className="flex items-center gap-4">
          {form.bankLogo ? (
            <div className="relative">
              <img src={form.bankLogo} alt="Bank logo" className="h-16 w-16 rounded-full object-cover border-2 border-border/60 shadow-sm" />
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, bankLogo: "" }))}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground">
              <Upload className="h-5 w-5" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Uploading…" : form.bankLogo ? "Change logo" : "Upload logo"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank name</Label>
          <Input id="bankName" placeholder="e.g. First Bank" value={form.bankName}
            onChange={(e) => handleChange("bankName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountName">Account name</Label>
          <Input id="accountName" placeholder="e.g. NowBuy Marketplace Ltd" value={form.accountName}
            onChange={(e) => handleChange("accountName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" placeholder="e.g. 0123456789" value={form.accountNumber}
            onChange={(e) => handleChange("accountNumber", e.target.value)} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : "Save details"}
      </Button>
    </Card>
  );
}
