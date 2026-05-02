import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetCurrentUser();
  const me = data?.user ?? null;
  const { notifications, markRead, markAllRead } = useNotifications(!!me);

  useEffect(() => {
    if (!isLoading && !me) setLocation("/account");
  }, [isLoading, me, setLocation]);

  if (isLoading) return (
    <div className="container max-w-2xl mx-auto py-12 px-6 space-y-4">
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="container max-w-2xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">{notifications.filter(n=>!n.read).length} unread</p>
          </div>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-16 text-center border-border/50">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">You're all caught up! No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer hover:border-primary/30 transition-colors border-border/50 ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start gap-3">
                {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                <div className={!n.read ? "" : "ml-5"}>
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
