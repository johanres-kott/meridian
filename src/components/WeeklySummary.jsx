import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Chg } from "./SharedComponents.jsx";
import { useUser } from "../contexts/UserContext.jsx";

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function calcWeeklyChange(points, currentPrice) {
  if (!points || points.length === 0 || !currentPrice) return null;
  const weekAgo = getDateDaysAgo(7);
  // Find closest point to 7 days ago
  const ref = [...points].reverse().find(p => p.date <= weekAgo);
  if (!ref || !ref.close) return null;
  return ((currentPrice - ref.close) / ref.close) * 100;
}

export default function WeeklySummary({ isMobile, onNavigate }) {
  const { userId, preferences } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [indicesRes, commoditiesRes, watchlistRes] = await Promise.all([
          fetch("/api/indices").then(r => r.json()).catch(() => []),
          fetch("/api/commodities").then(r => r.json()).catch(() => []),
          userId
            ? supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at")
            : Promise.resolve({ data: [] }),
        ]);

        const allIndices = (indicesRes || []).filter(i => i.price > 0);
        const allCommodities = (commoditiesRes || []).filter(c => c.price > 0);
        const watchlist = watchlistRes.data || [];

        // Pick which indices/commodities to show
        const pinnedIndices = preferences.pinned_indices || [];
        const pinnedCommodities = preferences.pinned_commodities || [];

        const selectedIndices = pinnedIndices.length > 0
          ? pinnedIndices.map(sym => allIndices.find(i => i.symbol === sym)).filter(Boolean)
          : [...allIndices].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);

        const selectedCommodities = pinnedCommodities.length > 0
          ? pinnedCommodities.map(sym => allCommodities.find(c => (c.display || c.symbol) === sym)).filter(Boolean)
          : [...allCommodities].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);

        // Fetch weekly chart data for indices (use Yahoo tickers)
        const indexTickers = {
          OMXS30: "^OMX", SPX: "^GSPC", IXIC: "^IXIC", DJI: "^DJI",
          SX5E: "^STOXX50E", DAX: "^GDAXI", FTSE: "^FTSE", CAC: "^FCHI",
          N225: "^N225", HSI: "^HSI", SENSEX: "^BSESN", KOSPI: "^KS11",
          OMXHPI: "^OMXHPI", OMXC25: "^OMXC25",
        };

        const indicesWithWeekly = await Promise.all(
          selectedIndices.map(async (idx) => {
            const yahooTicker = indexTickers[idx.symbol];
            if (!yahooTicker) return { ...idx, weeklyChange: null };
            try {
              const res = await fetch(`/api/chart?ticker=${encodeURIComponent(yahooTicker)}&range=1m`);
              const chart = await res.json();
              const weeklyChange = calcWeeklyChange(chart.points, idx.price);
              return { ...idx, weeklyChange };
            } catch {
              return { ...idx, weeklyChange: null };
            }
          })
        );

        // Fetch weekly data for portfolio companies
        const portfolioWithWeekly = await Promise.all(
          watchlist.slice(0, 10).map(async (item) => {
            try {
              const [companyRes, chartRes] = await Promise.all([
                fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`).then(r => r.json()),
                fetch(`/api/chart?ticker=${encodeURIComponent(item.ticker)}&range=1m`).then(r => r.json()),
              ]);
              const weeklyChange = calcWeeklyChange(chartRes.points, companyRes.price);
              return {
                ticker: item.ticker,
                name: item.name || companyRes.name || item.ticker,
                price: companyRes.price,
                weeklyChange,
              };
            } catch {
              return null;
            }
          })
        );

        const validPortfolio = portfolioWithWeekly
          .filter(p => p && p.weeklyChange !== null)
          .sort((a, b) => Math.abs(b.weeklyChange) - Math.abs(a.weeklyChange))
          .slice(0, 5);

        setData({
          indices: indicesWithWeekly,
          commodities: selectedCommodities,
          portfolio: validPortfolio,
        });
      } catch (err) {
        console.error("WeeklySummary load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, preferences.pinned_indices, preferences.pinned_commodities]);

  if (loading) {
    return (
      <div style={{ padding: "20px 24px", marginBottom: 24, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 12 }}>
        Laddar veckosammanfattning...
      </div>
    );
  }

  if (!data) return null;

  const sectionHeader = { fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: isMobile ? 6 : 10 };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "4px 0" : "5px 0", borderBottom: "1px solid var(--border-light)" };
  const tickerStyle = { fontSize: isMobile ? 11 : 12, fontWeight: 500, color: "var(--text)" };
  const subtext = { fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Senaste veckan</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (data.portfolio.length > 0 ? "1fr 1fr 1fr" : "1fr 1fr"), gap: 0 }}>
        {/* Index weekly */}
        <div style={{ padding: isMobile ? "12px 12px" : "16px 20px", borderRight: isMobile ? "none" : "1px solid var(--border-light)", borderBottom: isMobile ? "1px solid var(--border-light)" : "none" }}>
          <div style={sectionHeader}>Index</div>
          {data.indices.map(idx => (
            <div key={idx.symbol} style={{ ...listItem, cursor: "pointer" }} onClick={() => onNavigate?.("commodities", { symbol: idx.symbol })}>
              <div>
                <div style={tickerStyle}>{idx.name}</div>
                <div style={{ ...subtext, ...mono }}>{idx.symbol}</div>
              </div>
              <div style={{ textAlign: "right", ...mono }}>
                {idx.weeklyChange !== null ? (
                  <>
                    <div style={{ fontSize: 12 }}><Chg value={parseFloat(idx.weeklyChange.toFixed(2))} /></div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>vecka</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12 }}><Chg value={idx.change} /></div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>idag</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Commodities weekly */}
        <div style={{ padding: isMobile ? "12px 12px" : "16px 20px", borderRight: isMobile ? "none" : (data.portfolio.length > 0 ? "1px solid var(--border-light)" : "none"), borderBottom: isMobile ? "1px solid var(--border-light)" : "none" }}>
          <div style={sectionHeader}>Råvaror & FX</div>
          {data.commodities.map(c => (
            <div key={c.symbol} style={{ ...listItem, cursor: "pointer" }} onClick={() => onNavigate?.("commodities", { symbol: c.display || c.symbol })}>
              <div>
                <div style={tickerStyle}>{c.name}</div>
                <div style={{ ...subtext, ...mono }}>{c.display || c.symbol}</div>
              </div>
              <div style={{ textAlign: "right", ...mono }}>
                <div style={{ fontSize: 12 }}><Chg value={c.change} /></div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>idag</div>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio weekly */}
        {data.portfolio.length > 0 && (
          <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
            <div style={sectionHeader}>Din portfolj</div>
            {data.portfolio.map(item => (
              <div key={item.ticker} style={{ ...listItem, cursor: "pointer" }} onClick={() => onNavigate?.("search", { ticker: item.ticker })}>
                <div>
                  <div style={tickerStyle}>{item.name}</div>
                  <div style={{ ...subtext, ...mono }}>{item.ticker}</div>
                </div>
                <div style={{ textAlign: "right", ...mono }}>
                  <div style={{ fontSize: 12 }}><Chg value={parseFloat(item.weeklyChange.toFixed(2))} /></div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>vecka</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
