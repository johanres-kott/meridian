import { useTranslation } from "react-i18next";

// Hem-sidans hero (DESIGN.md): nettoförmögenheten som stor siffra med
// dagsförändring och breakdown-chips — Finarys dashboard-mönster.
// Data kommer från useNetWorth i Overview; ingen egen hämtning här.

export default function HomeHero({ data, isMobile, onNavigate }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";

  if (!data.portfolioLoaded || !data.hasAnything) return null;

  const { netWorth, dailyChangeSek, portfolioSek, pensionValue, assetSum, debtSum } = data;
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const fmt = v => `${v.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK`;

  const chips = [
    portfolioSek != null && portfolioSek > 0 ? { label: t("myFinances.portfolio"), value: portfolioSek, tab: "portfolio" } : null,
    pensionValue != null ? { label: t("myFinances.pension"), value: pensionValue, tab: "investment", detail: { subTab: "pension" } } : null,
    assetSum > 0 ? { label: t("myFinances.assets"), value: assetSum } : null,
    debtSum > 0 ? { label: t("myFinances.debts"), value: -debtSum, negative: true } : null,
  ].filter(Boolean);

  const dateLabel = new Date().toLocaleDateString(numberLocale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
      padding: isMobile ? "16px 16px" : "22px 24px", marginBottom: isMobile ? 12 : 20,
    }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>{dateLabel}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <span style={{ ...mono, fontSize: isMobile ? 28 : 36, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {fmt(netWorth)}
        </span>
        {dailyChangeSek != null && (
          <span style={{ ...mono, fontSize: 13, fontWeight: 500, color: dailyChangeSek >= 0 ? "#089981" : "#f23645" }}>
            {dailyChangeSek >= 0 ? "+" : ""}{dailyChangeSek.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK {t("myFinances.todayPortfolio")}
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
        {t("myFinances.netWorth")}
      </div>

      {chips.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {chips.map(c => (
            <button
              key={c.label}
              onClick={() => c.tab && onNavigate?.(c.tab, c.detail)}
              style={{
                display: "flex", alignItems: "baseline", gap: 6,
                fontSize: 11, padding: "5px 12px", borderRadius: 999,
                border: "1px solid var(--border)", background: "var(--bg-secondary)",
                color: "var(--text-secondary)", fontFamily: "inherit",
                cursor: c.tab ? "pointer" : "default",
              }}>
              {c.label}
              <span style={{ ...mono, color: c.negative ? "#f23645" : "var(--text)", fontWeight: 500 }}>
                {c.negative ? "−" : ""}{fmt(Math.abs(c.value))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
