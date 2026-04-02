import timeAgo from "../utils/timeAgo.js";

const ICON_MAP = {
  price: "\u{1F4C9}",
  insider: "\u{1F464}",
  earnings: "\u{1F4C5}",
};

export default function NotificationItem({ notification: n, onMarkRead }) {
  return (
    <div
      onClick={() => !n.read && onMarkRead(n.id)}
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
          e.currentTarget.style.background = "var(--bg-secondary)";
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
  );
}
