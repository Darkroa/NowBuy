import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  redeemResetCode,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ArrowRight } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    const c = params.get("code");
    if (e) setEmail(e);
    if (c) setCode(c.toUpperCase());
  }, []);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await redeemResetCode({
        email: email.trim().toLowerCase(),
        code: code.trim().toUpperCase(),
        newPassword,
      });
      await queryClient.invalidateQueries({
        queryKey: getGetCurrentUserQueryKey(),
      });
      toast({
        title: "Password updated",
        description: "You're now signed in.",
      });
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "pm") setLocation("/pm");
      else setLocation("/");
    } catch {
      setError(
        "We couldn't verify that code. Make sure the email and code are correct, or ask your admin for a new code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground">
              Use the code your admin gave you.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rp-email">Email</Label>
            <Input
              id="rp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-code">Reset code</Label>
            <Input
              id="rp-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="font-mono uppercase tracking-wider"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-pw">New password</Label>
            <Input
              id="rp-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-11 gap-2"
            disabled={submitting}
          >
            {submitting ? "Updating…" : "Set new password"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
