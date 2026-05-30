import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { api } from "../lib/api.js";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "LEAD" | "QUOTE" | "SAMPLE" | "FOLLOW_UP";
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPayload {
  notifications: Notification[];
  unreadCount: number;
}

const POLL_MS = 60_000;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<NotificationsPayload>("/api/notifications");
      setItems(res.data.notifications ?? []);
      setUnread(res.data.unreadCount ?? 0);
    } catch {
      /* silent — bell stays at last known state */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api.patch(`/api/notifications/${id}/read`, {}); } catch { /* revert on next poll */ }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try { await api.patch("/api/notifications/read-all", {}); } catch { /* revert on next poll */ }
  };

  return (
    <div className="adm-bell" ref={wrapRef}>
      <button
        type="button"
        className="adm-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && <span className="adm-bell-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="adm-bell-panel" role="dialog" aria-label="Notifications">
          <div className="adm-bell-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="adm-bell-markall" onClick={markAll}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="adm-bell-list">
            {items.length === 0 ? (
              <div className="adm-bell-empty">You're all caught up.</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`adm-bell-item${n.isRead ? "" : " is-unread"}`}>
                  <span className={`adm-bell-dot adm-bell-dot-${n.type.toLowerCase()}`} aria-hidden="true" />
                  <div className="adm-bell-body">
                    <div className="adm-bell-title">{n.title}</div>
                    <div className="adm-bell-msg">{n.message}</div>
                    <div className="adm-bell-time">{relativeTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      className="adm-bell-read"
                      onClick={() => markRead(n.id)}
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
