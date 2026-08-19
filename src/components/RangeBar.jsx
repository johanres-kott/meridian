import { RANGES } from "../lib/portfolioChartConstants.js";

// Global tidsspann-väljare (Finarys "1D 7D 1M 3M 6M YTD 1Y ALL" överst på
// sidan). Ett state — styr hero-förändring OCH graf samtidigt.
export default function RangeBar({ value, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 2, marginBottom: isMobile ? 10 : 14, overflowX: "auto" }}>
      {RANGES.map(r => {
        const active = value === r.id;
        return (
          <button key={r.id} onClick={() => onChange(r.id)}
            style={{
              fontSize: 11, fontWeight: active ? 600 : 500, padding: "5px 10px", borderRadius: 999,
              border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              background: active ? "var(--accent-light)" : "none",
              color: active ? "var(--accent)" : "var(--text-secondary)",
            }}>
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
