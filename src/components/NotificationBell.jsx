import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import NotificationItem from "./NotificationItem.jsx";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function NotificationBell() {
  const { userId } = useUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch("/api/notifications", {
        headers: s?.access_token ? { Authorization: `Bearer ${s.access_token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setLoading(true);
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .in("id", unreadIds);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
    setLoading(false);
  }

  async function markOneRead(id) {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 11,
          color: open ? "#2962ff" : "var(--text-secondary)",
          background: open ? "var(--border-light)" : "none",
          border: "1px solid var(--border)",
          borderRadius: 3,
          padding: "4px 10px",
          cursor: "pointer",
          fontFamily: "inherit",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
        title="Notifikationer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#f44336",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            minWidth: 320,
            maxWidth: 380,
            maxHeight: 420,
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Notifikationer
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                style={{
                  fontSize: 11,
                  color: "#2962ff",
                  background: "none",
                  border: "none",
                  cursor: loading ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading ? 0.5 : 1,
                  padding: 0,
                }}
              >
                Markera alla som lästa
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ overflow: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                }}
              >
                Inga notifikationer ännu
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markOneRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
