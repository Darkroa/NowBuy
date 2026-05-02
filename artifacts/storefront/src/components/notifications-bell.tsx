import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { Link } from "wouter";

export function NotificationsBell({ enabled }: { enabled: boolean }) {
  const { notifications, unread, markRead, markAllRead } = useNotifications(enabled);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <div className={!n.read ? "" : "ml-4"}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border/30">
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="w-full text-xs h-7">View all</Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
