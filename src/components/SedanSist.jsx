import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Chg } from "./SharedComponents.jsx";

export default function SedanSist({ lastSeenAt }) {
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!lastSeenAt) { setLoading(false); return; }

    async function load() {
      try {
        const [watchlistRes, indicesRes, commoditiesRes] = await Promise.all([
          supabase.from("watchlist").select("*").order("created_at"),
          fetch("/api/indices").then(r => r.json()),
          fetch("/api/commodities").then(r => r.json()),
        ]);

        const watchlist = watchlistRes.data || [];

        // For each watchlist company: fetch chart data to compute "since last visit" change
        const companyResults = await Promise.all(
          watchlist.slice(0, 20).map(async (item) => {
            try {
              const [companyRes, chartRes] = await Promise.all([
                fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`).then(r => r.json()),
                fetch(`/api/chart?ticker=${encodeURIComponent(item.ticker)}&range=1m`).then(r => r.json()),
              ]);

              const points = chartRes?.points || [];
              const lastSeenDate = lastSeenAt.split("T")[0];
              // Find the close price on or just before last_seen_at
              const refPoint = [...points].reverse().find(p => p.date <= lastSeenDate);
              const currentPrice = companyRes?.price || 0;
              const refPrice = refPoint?.close || 0;
              const changeSinceLast = refPrice > 0
                ? ((currentPrice - refPrice) / refPrice) * 100
                : null;

              return {
                ticker: item.ticker,
                name: item.name || companyRes?.name || item.ticker,
                price: currentPrice,
                changeSinceLast,
                changeToday: companyRes?.changePercent || 0,
                news: (companyRes?.news || []).map(n => ({ ...n, ticker: item.ticker, companyName: item.name })),
              };
            } catch {
              return null;
            }
          })
        );

        const validCompanies = companyResults.filter(Boolean);

        // Portfolio movers sorted by absolute change
        const movers = validCompanies
          .filter(c => c.changeSinceLast !== null)
          .sort((a, b) => Math.abs(b.changeSinceLast) - Math.abs(a.changeSinceLast));

        // Top index movers
        const topIndices = [...(indicesRes || [])]
          .filter(i => i.price > 0)
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 4);

        // Top commodity/FX movers
        const topCommodities = [...(commoditiesRes || [])]
          .filter(c => c.price > 0)
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 4);

        // Aggregate news, deduplicate by headline
        const allNews = validCompanies.flatMap(c => c.news);
        const seen = new Set();
        const uniqueNews = allNews.filter(n => {
          if (seen.has(n.headline)) return false;
          seen.add(n.headline);
          return true;
        }).slice(0, 5);

        setData({ movers, topIndices, topCommodities, news: uniqueNews });
      } catch (err) {
        console.error("SedanSist load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lastSeenAt]);

  if (!lastSeenAt || dismissed) return null;
  if (loading) return (
    <div style={{ padding: "20px 24px", marginBottom: 24, background: "#f8f9fd", border: "1px solid #e0e3eb", borderRadius: 8, color: "#787b86", fontSize: 12 }}>
      Sammanstaller vad som hant sedan sist...
    </div>
  );
  if (!data) return null;

  const lastDate = new Date(lastSeenAt);
  const formattedDate = lastDate.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });

  const sectionHeader = { fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f0f3fa" };
  const ticker = { fontSize: 12, fontWeight: 500, color: "#131722" };
  const subtext = { fontSize: 11, color: "#787b86" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 28, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #f0f3fa", background: "#f8f9fd" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#131722" }}>Sedan sist</span>
          <span style={{ fontSize: 11, color: "#787b86" }}>sedan {formattedDate}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Stang
        </button>
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>

        {/* Portfolio movers */}
        <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
          <div style={sectionHeader}>Din portfolj</div>
          {data.movers.length === 0 ? (
            <div style={{ fontSize: 11, color: "#b2b5be", fontStyle: "italic" }}>Inga bolag i bevakning</div>
          ) : (
            data.movers.slice(0, 5).map(c => (
              <div key={c.ticker} style={listItem}>
                <div>
                  <div style={ticker}>{c.name}</div>
                  <div style={{ ...subtext, ...mono }}>{c.ticker}</div>
                </div>
                <div style={{ ...mono, fontSize: 12 }}>
                  <Chg value={parseFloat(c.changeSinceLast.toFixed(2))} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Market highlights */}
        <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
          <div style={sectionHeader}>Marknader</div>
          {data.topIndices.map(idx => (
            <div key={idx.symbol} style={listItem}>
              <div>
                <div style={ticker}>{idx.name}</div>
                <div style={{ ...subtext, ...mono }}>{idx.symbol}</div>
              </div>
              <div style={{ ...mono, fontSize: 12 }}>
                <Chg value={idx.change} />
              </div>
            </div>
          ))}
        </div>

        {/* Commodity highlights */}
        <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
          <div style={sectionHeader}>Ravaror & FX</div>
          {data.topCommodities.map(c => (
            <div key={c.symbol} style={listItem}>
              <div>
                <div style={ticker}>{c.name}</div>
                <div style={{ ...subtext, ...mono }}>{c.display || c.symbol}</div>
              </div>
              <div style={{ ...mono, fontSize: 12 }}>
                <Chg value={c.change} />
              </div>
            </div>
          ))}
        </div>

        {/* News */}
        <div style={{ padding: "16px 20px" }}>
          <div style={sectionHeader}>Nyheter</div>
          {data.news.length === 0 ? (
            <div style={{ fontSize: 11, color: "#b2b5be", fontStyle: "italic" }}>Inga nyheter</div>
          ) : (
            data.news.map((n, i) => (
              <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #f0f3fa" }}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#131722", textDecoration: "none", lineHeight: 1.4, display: "block" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#2962ff"}
                  onMouseLeave={e => e.currentTarget.style.color = "#131722"}
                >
                  {n.headline}
                </a>
                <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 2 }}>
                  {n.companyName && <span>{n.companyName}</span>}
                  {n.source && <span> · {n.source}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
