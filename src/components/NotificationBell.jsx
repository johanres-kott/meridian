import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase.js";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

const ICON_MAP = {
  price: "\u{1F4C9}",
  insider: "\u{1F464}",
  earnings: "\u{1F4C5}",
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just nu";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} tim sedan`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dag${days > 1 ? "ar" : ""} sedan`;
  return date.toLocaleDateString("sv-SE");
}

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `https://thesion-scraper.vercel.app/api/notifications?user_id=${userId}`
      );
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
                Markera alla som l\u00e4sta
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
                Inga notifikationer \u00e4nnu
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markOneRead(n.id)}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-light)",
                    background: n.read
                      ? "transparent"
                      : "var(--bg-secondary, rgba(41,98,255,0.04))",
                    cursor: n.read ? "default" : "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!n.read)
                      e.currentTarget.style.background =
                        "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read
                      ? "transparent"
                      : "var(--bg-secondary, rgba(41,98,255,0.04))";
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}>
                    {ICON_MAP[n.type] || "\u{1F514}"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: n.read ? 400 : 600,
                        color: "var(--text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {n.title}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          marginTop: 2,
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        marginTop: 4,
                        opacity: 0.7,
                      }}
                    >
                      {n.created_at ? timeAgo(n.created_at) : ""}
                    </div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#2962ff",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
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
