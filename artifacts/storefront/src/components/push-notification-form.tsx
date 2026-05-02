import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2 } from "lucide-react";

export function PushNotificationForm() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json() as { sent?: number; error?: string };
      if (!res.ok) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Notification sent!", description: `Delivered to ${data.sent} users.` });
      setTitle(""); setMessage("");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally { setSending(false); }
  }

  return (
    <Card className="p-6 border-border/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Push notification</h3>
          <p className="text-xs text-muted-foreground">Sends to all registered users instantly.</p>
        </div>
      </div>
      <form onSubmit={handleSend} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="n-title">Title</Label>
          <Input id="n-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Flash sale today!" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="n-msg">Message</Label>
          <Textarea id="n-msg" required rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Up to 50% off on selected items. Shop now!" />
        </div>
        <Button type="submit" disabled={sending} className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {sending ? "Sending…" : "Send to all users"}
        </Button>
      </form>
    </Card>
  );
}
