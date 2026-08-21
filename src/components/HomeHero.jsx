import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext.jsx";
import NetWorthViewToggle from "./NetWorthViewToggle.jsx";

// Hem-sidans hero (DESIGN.md): nettoförmögenheten som stor siffra med
// dagsförändring och breakdown-chips — Finarys dashboard-mönster.
// Data kommer från useNetWorth i Overview; ingen egen hämtning här.
// Med familjemedlemmar och delade rader (FAMILY.md) växlar Min del/Hushållet
// mellan användarens andel och hushållets fulla värden.

export default function HomeHero({ data, isMobile, onNavigate, period }) {
  const { t, i18n } = useTranslation();
  const { preferences, updatePreferences } = useUser();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";

  if (!data.portfolioLoaded || !data.hasAnything) return null;

  const { netWorth, dailyChangeSek, portfolioSek, pensionValue, assetSum, debtSum } = data;
  const showToggle = !!data.hasHouseholdView;
  const view = showToggle && preferences.netWorthView === "household" ? "household" : "mine";
  const householdView = view === "household";
  const shownNetWorth = householdView ? data.householdNetWorth : netWorth;
  const shownAssetSum = householdView ? data.householdAssetSum : assetSum;
  const shownDebtSum = householdView ? data.householdDebtSum : debtSum;
  const mono = { fontFamily: "var(--font-mono)" };
  const fmt = v => `${v.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK`;

  const chips = [
    portfolioSek != null && portfolioSek > 0 ? { label: t("myFinances.portfolio"), value: portfolioSek, tab: "portfolio" } : null,
    pensionValue != null ? { label: t("myFinances.pension"), value: pensionValue, tab: "investment", detail: { subTab: "pension" } } : null,
    shownAssetSum > 0 ? { label: t("myFinances.assets"), value: shownAssetSum } : null,
    shownDebtSum > 0 ? { label: t("myFinances.debts"), value: -shownDebtSum, negative: true } : null,
  ].filter(Boolean);

  const dateLabel = new Date().toLocaleDateString(numberLocale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)",
      padding: isMobile ? "16px 16px" : "22px 24px", marginBottom: isMobile ? 12 : 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{dateLabel}</span>
        {showToggle && (
          <NetWorthViewToggle value={view} onChange={(v) => updatePreferences({ netWorthView: v })} />
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums", fontSize: isMobile ? 34 : 44, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.08 }}>
          {fmt(shownNetWorth)}
        </span>
        {period ? (
          // Periodens förändring för valt tidsspann (global RangeBar, Finary-mönstret)
          <span style={{ ...mono, fontSize: 13, fontWeight: 500, color: period.returnSek >= 0 ? "var(--pos)" : "var(--neg)" }}>
            {period.returnSek >= 0 ? "+" : ""}{period.returnSek.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK
            <span style={{ fontWeight: 400, marginLeft: 6, padding: "1px 7px", borderRadius: 999, background: period.returnSek >= 0 ? "rgba(15,154,108,0.12)" : "rgba(205,74,64,0.12)" }}>
              {period.returnPct >= 0 ? "+" : ""}{period.returnPct.toFixed(2)}%
            </span>
            <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 8, fontFamily: "inherit" }}>{t(`range.labels.${period.range}`)}</span>
          </span>
        ) : dailyChangeSek != null && (
          <span style={{ ...mono, fontSize: 13, fontWeight: 500, color: dailyChangeSek >= 0 ? "var(--pos)" : "var(--neg)" }}>
            {dailyChangeSek >= 0 ? "+" : ""}{dailyChangeSek.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK {t("myFinances.todayPortfolio")}
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
        {t("myFinances.netWorth")}
        {showToggle && <> · {householdView ? t("myFinances.viewHousehold") : t("myFinances.viewMine")}</>}
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
              <span style={{ ...mono, color: c.negative ? "var(--neg)" : "var(--text)", fontWeight: 500 }}>
                {c.negative ? "−" : ""}{fmt(Math.abs(c.value))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
