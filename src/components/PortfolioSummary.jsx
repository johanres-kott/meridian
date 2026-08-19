import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Chg, StatCard } from "./SharedComponents.jsx";
import { STATUS_COLORS } from "../constants.js";
import { useUser } from "../contexts/UserContext.jsx";
import { getPensionTotalValue } from "../lib/pension.js";
import { getPortfolioValuation } from "../lib/portfolioValue.js";

export default function PortfolioSummary({ isMobile, onNavigate }) {
  const { userId, preferences } = useUser();
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        const { empty, watchlist, priced, holdings, currencyGroups, totalSek, dailyChangeSek } = await getPortfolioValuation(userId);

        if (empty) {
          setData({ empty: true });
          setLoading(false);
          return;
        }

        // Status counts
        const statusCounts = {};
        for (const item of watchlist) {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        }

        // Top movers today (sorted by absolute change)
        const movers = priced
          .filter(i => i.changePercent !== 0)
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 5);

        // Pension value from preferences
        const pensionValue = getPensionTotalValue(preferences?.pension);

        setData({
          currencyGroups,
          totalSek,
          dailyChangeSek,
          dailyChangeSekPct: totalSek > 0 ? (dailyChangeSek / (totalSek - dailyChangeSek)) * 100 : 0,
          statusCounts,
          totalCount: watchlist.length,
          movers,
          hasHoldings: holdings.length > 0,
          pensionValue,
        });
      } catch (err) {
        console.error("PortfolioSummary load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: "20px 24px", marginBottom: 24, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 12 }}>
        {t("portfolioSummary.loading")}
      </div>
    );
  }

  if (!data || data.empty) return null;

  const sectionHeader = { fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: isMobile ? 6 : 10 };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "4px 0" : "5px 0", borderBottom: "1px solid var(--border-light)" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{t("portfolioSummary.title")}</span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>{t("portfolioSummary.companiesCount", { count: data.totalCount })}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${(data.hasHoldings ? 1 : 0) + 1 + (data.pensionValue != null ? 1 : 0) + 1}, 1fr)`, gap: 0 }}>
        {/* Holdings value by currency */}
        {data.hasHoldings && (
          <div style={{ padding: isMobile ? "12px 12px" : "16px 20px", borderRight: isMobile ? "none" : "1px solid var(--border-light)", borderBottom: isMobile ? "1px solid var(--border-light)" : "none" }}>
            <div style={sectionHeader}>{t("portfolioSummary.holdings")}</div>
            {data.totalSek !== null && (
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>
                  {data.totalSek.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK
                </div>
                <div style={{ ...mono, fontSize: 11, marginTop: 2, color: data.dailyChangeSek >= 0 ? "#089981" : "#f23645" }}>
                  {data.dailyChangeSek >= 0 ? "+" : ""}{data.dailyChangeSek.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK {t("portfolioSummary.today")} ({data.dailyChangeSekPct >= 0 ? "+" : ""}{data.dailyChangeSekPct.toFixed(2)}%)
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{t("portfolioSummary.convertedToSek")}</div>
              </div>
            )}
            {data.currencyGroups.map((g, i) => (
              <div key={g.currency} style={{ marginBottom: i < data.currencyGroups.length - 1 ? 8 : 0 }}>
                <div style={{ ...mono, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                  {g.value.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} {g.currency}
                </div>
                <div style={{ ...mono, fontSize: 11, marginTop: 2, color: g.dailyChange >= 0 ? "#089981" : "#f23645" }}>
                  {g.dailyChange >= 0 ? "+" : ""}{g.dailyChange.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} {g.currency} {t("portfolioSummary.today")} ({g.dailyChangePct >= 0 ? "+" : ""}{g.dailyChangePct.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status distribution */}
        <div style={{ padding: isMobile ? "12px 12px" : "16px 20px", borderRight: isMobile ? "none" : "1px solid var(--border-light)", borderBottom: isMobile ? "1px solid var(--border-light)" : "none" }}>
          <div style={sectionHeader}>{t("portfolioSummary.statusSection")}</div>
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
              <span style={{ fontSize: 12, color: STATUS_COLORS[status] || "var(--text-secondary)", fontWeight: 500 }}>{status}</span>
              <span style={{ ...mono, fontSize: 12, color: "var(--text)" }}>{t("portfolioSummary.statusCount", { count })}</span>
            </div>
          ))}
        </div>

        {/* Pension */}
        {data.pensionValue != null && (
          <div style={{ padding: isMobile ? "12px 12px" : "16px 20px", borderRight: isMobile ? "none" : "1px solid var(--border-light)", borderBottom: isMobile ? "1px solid var(--border-light)" : "none" }}>
            <div style={sectionHeader}>{t("portfolioSummary.pension")}</div>
            <div style={{ ...mono, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
              {data.pensionValue.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
              {preferences?.pension?.itpType || "ITP"} — {preferences?.pension?.provider || ""}
            </div>
            {data.totalSek != null && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{t("portfolioSummary.totalInclPension")}</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 500, color: "var(--text)" }}>
                  {(data.totalSek + data.pensionValue).toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top movers today */}
        <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
          <div style={sectionHeader}>{t("portfolioSummary.topMovers")}</div>
          {data.movers.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{t("portfolioSummary.noMovers")}</div>
          ) : (
            data.movers.map(item => (
              <div key={item.ticker} style={{ ...listItem, cursor: "pointer" }} onClick={() => onNavigate?.("search", { ticker: item.ticker })}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{item.name || item.ticker}</div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", ...mono }}>{item.ticker}</div>
                </div>
                <div style={mono}>
                  <Chg value={parseFloat(item.changePercent.toFixed(2))} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
