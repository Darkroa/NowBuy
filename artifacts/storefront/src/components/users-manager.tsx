import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  updateUserRole,
  deleteUser,
  createUserResetCode,
  getListUsersQueryKey,
  type AuthUser,
  type ResetCodeResponse,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, UserCircle2, KeyRound, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["buyer", "pm", "admin"] as const;

const roleColor: Record<string, string> = {
  buyer: "bg-muted text-muted-foreground border-border",
  pm: "bg-blue-50 text-blue-700 border-blue-200",
  admin: "bg-primary/10 text-primary border-primary/20",
};

export function UsersManager({ currentUserId }: { currentUserId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading } = useListUsers();
  const [issuingFor, setIssuingFor] = useState<number | null>(null);
  const [issuedCode, setIssuedCode] = useState<ResetCodeResponse | null>(null);

  async function changeRole(user: AuthUser, role: (typeof ROLES)[number]) {
    if (user.role === role) return;
    await updateUserRole(user.id, { role });
    await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
  }

  async function remove(user: AuthUser) {
    if (!confirm(`Delete ${user.email}? This can't be undone.`)) return;
    await deleteUser(user.id);
    await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
  }

  async function generateResetCode(user: AuthUser) {
    setIssuingFor(user.id);
    try {
      const result = await createUserResetCode(user.id);
      setIssuedCode(result);
    } catch {
      toast({
        title: "Couldn't generate code",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIssuingFor(null);
    }
  }

  function copyCode() {
    if (!issuedCode) return;
    navigator.clipboard.writeText(issuedCode.code).then(() =>
      toast({ title: "Code copied" }),
    );
  }

  function copyShareLink() {
    if (!issuedCode) return;
    const url = `${window.location.origin}/reset-password?email=${encodeURIComponent(issuedCode.userEmail)}&code=${encodeURIComponent(issuedCode.code)}`;
    navigator.clipboard.writeText(url).then(() =>
      toast({ title: "Reset link copied" }),
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="font-serif text-xl font-bold mb-1">Users</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Promote, demote, remove accounts, or issue a one-time password reset code.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="space-y-2">
          {users?.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${roleColor[user.role] ?? roleColor.buyer}`}
                      >
                        {user.role}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {ROLES.map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={r === user.role ? "default" : "outline"}
                      className="h-7 text-xs px-2"
                      disabled={isSelf && r !== "admin"}
                      onClick={() => changeRole(user, r)}
                    >
                      {r}
                    </Button>
                  ))}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    disabled={issuingFor === user.id}
                    onClick={() => generateResetCode(user)}
                    aria-label="Generate password reset code"
                    title="Generate password reset code"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    disabled={isSelf}
                    onClick={() => remove(user)}
                    aria-label="Delete user"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!issuedCode} onOpenChange={(o) => !o && setIssuedCode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Password reset code</DialogTitle>
            <DialogDescription>
              Share this code with{" "}
              <span className="font-medium text-foreground">{issuedCode?.userEmail}</span>.
              They can use it on the reset password page. The code expires in 30 minutes
              and can only be used once.
            </DialogDescription>
          </DialogHeader>
          {issuedCode && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  One-time code
                </p>
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-2xl font-bold text-primary tracking-wider">
                    {issuedCode.code}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyCode} aria-label="Copy code">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Expires {new Date(issuedCode.expiresAt).toLocaleTimeString()}
                  {issuedCode.scope === "admin" && " · admin-scoped"}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={copyShareLink}
              >
                <Copy className="h-4 w-4" />
                Copy ready-to-share reset link
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssuedCode(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
