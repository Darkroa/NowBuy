import { useState, useEffect, useCallback } from "react";

export type AppNotification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetch_ = useCallback(async () => {
    if (!enabled) return;
    try {
      const r = await fetch("/api/notifications", { credentials: "include" });
      if (r.ok) setNotifications(await r.json() as AppNotification[]);
    } catch { /* ignore */ }
  }, [enabled]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [fetch_]);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifications.filter((n) => !n.read).length;
  return { notifications, unread, markRead, markAllRead, refresh: fetch_ };
}
