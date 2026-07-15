import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fmt } from "./shared.js";
import { StatCard, PriceChart } from "./SharedComponents.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import QuarterlyChart from "./QuarterlyChart.jsx";
import { STATUSES, STATUS_COLORS } from "../constants.js";
import { useUser } from "../contexts/UserContext.jsx";
import NotesSection from "./company/NotesSection.jsx";
import ProfileInsight from "./company/ProfileInsight.jsx";
import InsiderSection from "./company/InsiderSection.jsx";
import OwnershipChart from "./company/OwnershipChart.jsx";

// Beginner sees 4 key metrics, intermediate 6, advanced all 8-9
const BEGINNER_METRICS = ["peForward", "dividendYield", "revenueGrowth", "roic"];
const INTERMEDIATE_METRICS = ["peForward", "peTrailing", "dividendYield", "revenueGrowth", "roic", "debtEbitda"];

function getMetricOrder(investorType, experience) {
  const orders = {
    value: ["peForward", "peTrailing", "debtEbitda", "grossMargin", "roic", "operatingMargin", "dividendYield", "revenueGrowth"],
    growth: ["revenueGrowth", "roic", "operatingMargin", "peForward", "ebitdaMargin", "grossMargin", "dividendYield", "debtEbitda"],
    dividend: ["dividendYield", "peForward", "grossMargin", "debtEbitda", "roic", "operatingMargin", "ebitdaMargin", "revenueGrowth"],
  };
  const full = orders[investorType] || ["peForward", "peTrailing", "ebitdaMargin", "operatingMargin", "grossMargin", "roic", "debtEbitda", "revenueGrowth", "dividendYield"];

  if (experience === "beginner") return full.filter(k => BEGINNER_METRICS.includes(k));
  if (experience === "intermediate") return full.filter(k => INTERMEDIATE_METRICS.includes(k));
  return full;
}


const METRIC_FMT = {
  peForward: "x", peTrailing: "x", ebitdaMargin: "%", operatingMargin: "%",
  grossMargin: "%", roic: "%", debtEbitda: "x", revenueGrowth: "%", dividendYield: "%",
};

function isNeg(key, value) {
  if (key === "debtEbitda") return value > 3;
  if (key === "dividendYield") return false;
  return value < 0;
}

export default function CompanyView({ item, onBack, onUpdate }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const { preferences } = useUser();
  const investorProfile = preferences.investorProfile || null;
  const investorType = investorProfile?.investorType;
  const isMobile = useIsMobile();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  useEffect(() => {
    fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`)
      .then(r => r.json())
      .then(d => { setCompany(d); setLoading(false); })
      .catch(err => { console.error(`CompanyView: failed to load ${item.ticker}:`, err); setLoading(false); });
  }, [item.ticker]);

  const pl = (item.gav && item.shares && company?.price) ? ((company.price - item.gav) * item.shares) : null;
  const plPct = (item.gav && company?.price) ? ((company.price - item.gav) / item.gav * 100) : null;

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}>
          {t("companyView.backButton")}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "var(--text)" }}>
              {item.name || item.ticker}
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{item.ticker}</span>
            </div>
            {company && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                {company.sector}{company.industry !== "—" ? ` · ${company.industry}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value })}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                background: STATUS_COLORS[item.status]?.bg || "#f0f3fa",
                color: STATUS_COLORS[item.status]?.color || "#787b86",
              }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Price + P&L row */}
        {company && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
              {company.price?.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{company.currency}</span>
            {company.marketCap > 0 && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Mkt Cap: {company.marketCap}B {company.currency}</span>}
            {pl !== null && (
              <span style={{ fontSize: 13, fontWeight: 500, color: pl >= 0 ? "#089981" : "#f23645", marginLeft: 8 }}>
                P&L: {pl >= 0 ? "+" : ""}{pl.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} {company.currency} ({plPct >= 0 ? "+" : ""}{plPct?.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>{t("companyView.loading")}</div>
      ) : !company ? (
        <div style={{ color: "#f23645", fontSize: 13, padding: "40px 0", textAlign: "center" }}>{t("companyView.loadError", { ticker: item.ticker })}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: isMobile ? 16 : 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chart */}
            <PriceChart ticker={item.ticker} />

            {/* Key metrics */}
            {(() => {
              const exp = showAllMetrics ? "advanced" : investorProfile?.experience;
              const metrics = getMetricOrder(investorType, exp);
              const isFiltered = !showAllMetrics && (investorProfile?.experience === "beginner" || investorProfile?.experience === "intermediate");
              return (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{t("companyView.keyMetrics")}</div>
                    {isFiltered && (
                      <button onClick={() => setShowAllMetrics(true)}
                        style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        {t("companyView.showAll")}
                      </button>
                    )}
                    {showAllMetrics && investorProfile?.experience !== "advanced" && (
                      <button onClick={() => setShowAllMetrics(false)}
                        style={{ fontSize: 10, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        {t("companyView.showFewer")}
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
                    {metrics.map(key => (
                      <StatCard key={key} label={t(`companyView.metricLabels.${key}`)} value={fmt(company[key], METRIC_FMT[key])} neg={isNeg(key, company[key])} tooltip={t(`companyView.metricTips.${key}`)} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quarterly financials */}
            <QuarterlyChart ticker={item.ticker} />

            {/* Analyst targets */}
            {(company.targetPrice > 0 || company.recommendation !== "—") && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {company.targetPrice > 0 && (
                  <div style={{ flex: 1, minWidth: 160, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>{t("companyView.targetPrice")}</div>
                    <div style={{ fontSize: 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                      {company.targetPrice.toFixed(2)} {company.currency}
                    </div>
                    {company.targetLow > 0 && company.targetHigh > 0 && (
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                        {t("companyView.targetRange", { low: company.targetLow.toFixed(0), high: company.targetHigh.toFixed(0), currency: company.currency })}
                      </div>
                    )}
                    {company.price > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                        {t("companyView.upside")} <span style={{ color: company.targetPrice > company.price ? "#089981" : "#f23645" }}>
                          {(((company.targetPrice / company.price) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {company.numberOfAnalysts > 0 && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                        {t("companyView.analystSource", { n: company.numberOfAnalysts })}
                      </div>
                    )}
                  </div>
                )}
                {company.recommendation !== "—" && (
                  <div style={{ flex: 1, minWidth: 160, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>{t("companyView.recommendation")}</div>
                    <div style={{
                      fontSize: 16, fontWeight: 500, textTransform: "uppercase",
                      color: company.recommendation?.includes("buy") ? "#089981" : company.recommendation?.includes("sell") ? "#f23645" : "var(--text)",
                    }}>
                      {company.recommendation}
                    </div>
                    {company.numberOfAnalysts > 0 && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                        {t("companyView.analystConsensus", { n: company.numberOfAnalysts })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* News */}
            {company.news?.length > 0 && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 20 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>{t("companyView.latestNews")}</div>
                {company.news.map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 0",
                      borderBottom: i < company.news.length - 1 ? "1px solid var(--border-light)" : "none",
                      textDecoration: "none", color: "var(--text)",
                    }}>
                    <span style={{ fontSize: 12, lineHeight: 1.4 }}>{n.headline}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0 }}>{n.source}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Insider transactions */}
            <InsiderSection ticker={item.ticker} />
          </div>

          {/* Right column: Profile insight + Notes + GAV */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProfileInsight ticker={item.ticker} company={company} investorProfile={investorProfile} />
            <OwnershipChart ticker={item.ticker} />
            <NotesSection item={item} onUpdate={onUpdate} />
          </div>
        </div>
      )}
    </div>
  );
}
