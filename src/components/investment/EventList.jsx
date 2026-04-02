import { useFetch, Skeleton } from "./primitives.jsx";

// ─── Event row (Quartr-style) ─────────────────────────────────────────────────

function EventRow({ item, isLast }) {
  const dateStr = item.date
    ? item.date.length === 4
      ? item.date                                    // just year
      : item.date.slice(5).replace("-", " /")        // "03 /24"
    : null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: isLast ? "none" : "1px solid var(--border-light)",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "opacity 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {/* Date chip */}
      <div style={{
        fontSize: 10, fontWeight: 500, color: "var(--text-muted)",
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.02em", lineHeight: 1.3,
      }}>
        {dateStr ?? "—"}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {item.title}
      </div>

      {/* Arrow */}
      <div style={{ fontSize: 11, color: "#c0c3cb", flexShrink: 0 }}>↗</div>
    </a>
  );
}

export default function EventList({ url, emptyMsg }) {
  const { data, loading } = useFetch(url);
  const items = data?.items ?? [];

  if (loading) {
    return (
      <div>
        {[90, 75, 85, 70, 80].map((w, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 12, padding: "11px 0", borderBottom: i < 4 ? "1px solid var(--border-light)" : "none" }}>
            <Skeleton w={36} h={10} />
            <div>
              <Skeleton w={`${w}%`} h={12} mb={5} />
              <Skeleton w={`${Math.max(40, w - 20)}%`} h={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "16px 0" }}>{emptyMsg}</div>;
  }

  return (
    <div>
      {items.map((item, i) => (
        <EventRow key={i} item={item} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}
