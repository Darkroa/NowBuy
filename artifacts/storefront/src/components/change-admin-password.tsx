import { useState } from "react";
import {
  createAdminSelfResetCode,
  redeemResetCode,
  type ResetCodeResponse,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Copy, Sparkles, CheckCircle2 } from "lucide-react";

export function ChangeAdminPassword({ adminEmail }: { adminEmail: string }) {
  const { toast } = useToast();
  const [issued, setIssued] = useState<ResetCodeResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const result = await createAdminSelfResetCode();
      setIssued(result);
      setCode(result.code);
    } catch {
      toast({
        title: "Couldn't generate a code",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6 || !code.trim()) return;
    setSubmitting(true);
    try {
      await redeemResetCode({
        email: adminEmail,
        code: code.trim().toUpperCase(),
        newPassword,
      });
      setDone(true);
      setNewPassword("");
      setCode("");
      setIssued(null);
      toast({
        title: "Admin password updated",
        description: "Use your new password from now on.",
      });
    } catch {
      toast({
        title: "Couldn't change password",
        description: "Code may be invalid or expired. Generate a new one and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!issued) return;
    navigator.clipboard.writeText(issued.code).then(() =>
      toast({ title: "Code copied" }),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6 border-border/60 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Step 1 — Generate a unique admin code</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This code is admin-scoped and expires in 30 minutes. Only you (signed
          in as admin) can mint one.
        </p>
        <Button onClick={generate} disabled={generating} className="gap-2 w-full">
          <KeyRound className="h-4 w-4" />
          {generating ? "Generating…" : issued ? "Generate a new code" : "Generate code"}
        </Button>
        {issued && (
          <div className="mt-5 rounded-lg border border-primary/30 bg-background p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              One-time admin code
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-2xl font-bold text-primary tracking-wider">
                {issued.code}
              </code>
              <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Expires {new Date(issued.expiresAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Step 2 — Set a new password</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the code from Step 1 and pick a new admin password.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Admin email</Label>
            <Input id="admin-email" value={adminEmail} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-code">Reset code</Label>
            <Input
              id="admin-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="font-mono uppercase tracking-wider"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-newpw">New password</Label>
            <Input
              id="admin-newpw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitting || !code || newPassword.length < 6}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {submitting ? "Updating…" : done ? "Updated · Update again" : "Update admin password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
