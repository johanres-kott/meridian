import { useState, useEffect } from "react";

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!url) return;
    let dead = false;
    setLoading(true);
    setData(null);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!dead) { setData(d); setLoading(false); } })
      .catch(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [url]);
  return { data, loading };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export function Skeleton({ w = "100%", h = 13, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 3, marginBottom: mb,
      background: "linear-gradient(90deg,var(--border-light) 25%,var(--border) 50%,var(--border-light) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
    }} />
  );
}

export function Badge({ text, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
      padding: "2px 7px", borderRadius: 3,
      color: color ?? "var(--text-secondary)", background: bg ?? "var(--border-light)",
    }}>
      {text}
    </span>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
        {children}
      </span>
      {action}
    </div>
  );
}

// ─── Company logo/avatar ──────────────────────────────────────────────────────

export function CompanyAvatar({ company, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: company.color + "18",
      border: `1.5px solid ${company.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: company.color,
      flexShrink: 0, userSelect: "none",
    }}>
      {company.name[0]}
    </div>
  );
}
