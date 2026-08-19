import { useTranslation } from "react-i18next";

// Finarys "My Movers" på Hem: de innehav som rört sig mest idag. Data från
// useNetWorth.priced (redan hämtat för heron) — ingen extra fetch.

export default function HomeMovers({ data, isMobile, onNavigate }) {
  const { t } = useTranslation();
  if (!data.portfolioLoaded) return null;

  const movers = (data.priced || [])
    .filter(p => p.changePercent != null && p.changePercent !== 0 && p.price > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, isMobile ? 4 : 6);

  if (movers.length === 0) return null;
  const mono = { fontFamily: "var(--font-mono)" };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: isMobile ? "14px 16px" : "16px 22px", marginBottom: isMobile ? 12 : 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{t("homeMovers")}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
        {movers.map(m => (
          <button key={m.ticker} onClick={() => onNavigate?.("portfolio", { ticker: m.ticker })}
            style={{ textAlign: "left", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name || m.ticker}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
              <span style={{ ...mono, fontSize: 10, color: "var(--text-secondary)" }}>{m.ticker}</span>
              <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: m.changePercent >= 0 ? "var(--pos)" : "var(--neg)" }}>
                {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
