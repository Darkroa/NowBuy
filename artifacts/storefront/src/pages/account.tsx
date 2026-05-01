import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  signIn,
  signUp,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

type Mode = "signin" | "signup";

export default function Account() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res =
        mode === "signin"
          ? await signIn({ email, password })
          : await signUp({ name, email, password });
      await queryClient.invalidateQueries({
        queryKey: getGetCurrentUserQueryKey(),
      });
      const role = (res as { role?: string })?.role;
      if (role === "admin") setLocation("/admin");
      else if (role === "pm") setLocation("/pm");
      else setLocation("/");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignIn
              ? "Sign in to pick up where you left off."
              : "Save your orders and let the assistant remember you."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                isSignIn
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                !isSignIn
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 px-6 pb-6 pt-2">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nowbuy.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
                minLength={isSignIn ? 1 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignIn ? "••••••••" : "At least 6 characters"}
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={submitting}
            >
              {submitting
                ? isSignIn
                  ? "Signing in..."
                  : "Creating account..."
                : isSignIn
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our (very friendly){" "}
          <Link href="/" className="underline hover:text-primary">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
