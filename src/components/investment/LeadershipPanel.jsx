import { useFetch, Skeleton } from "./primitives.jsx";

export default function LeadershipPanel({ companyId, isMobile }) {
  const { data, loading } = useFetch(companyId ? `/api/leadership?id=${companyId}` : null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
      {["boardChair", "ceo"].map(key => (
        <div key={key} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>
            {key === "boardChair" ? "Styrelseordförande" : "Verkst. direktör"}
          </div>
          {loading
            ? <Skeleton w="70%" h={14} />
            : <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>
                {data?.[key] || "—"}
              </div>
          }
        </div>
      ))}
    </div>
  );
}
