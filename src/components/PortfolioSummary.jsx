import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Chg, StatCard } from "./SharedComponents.jsx";

const STATUS_COLORS = {
  Bevakar: "#787b86",
  Analyserar: "#e65100",
  Intressant: "#1b5e20",
  Äger: "#1565c0",
  Avstår: "#880e4f",
};

export default function PortfolioSummary({ userId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        const { data: watchlist } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userId)
          .order("created_at");

        if (!watchlist || watchlist.length === 0) {
          setData({ empty: true });
          setLoading(false);
          return;
        }

        // Fetch prices for all items (parallel, max 20)
        const priced = await Promise.all(
          watchlist.slice(0, 20).map(async (item) => {
            try {
              const res = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
              const d = await res.json();
              return { ...item, price: d.price || 0, changePercent: d.changePercent || 0, currency: d.currency };
            } catch {
              return { ...item, price: 0, changePercent: 0 };
            }
          })
        );

        // Portfolio value (only "Äger" with shares), grouped by currency
        const holdings = priced.filter(i => i.status === "Äger" && i.shares && i.price);
        const byCurrency = {};
        for (const h of holdings) {
          const cur = h.currency || "SEK";
          if (!byCurrency[cur]) byCurrency[cur] = { value: 0, dailyChange: 0 };
          byCurrency[cur].value += h.price * h.shares;
          const prevPrice = h.price / (1 + h.changePercent / 100);
          byCurrency[cur].dailyChange += (h.price - prevPrice) * h.shares;
        }
        const currencyGroups = Object.entries(byCurrency).map(([currency, { value, dailyChange }]) => ({
          currency,
          value,
          dailyChange,
          dailyChangePct: value > 0 ? (dailyChange / (value - dailyChange)) * 100 : 0,
        }));

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

        setData({
          currencyGroups,
          statusCounts,
          totalCount: watchlist.length,
          movers,
          hasHoldings: holdings.length > 0,
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
      <div style={{ padding: "20px 24px", marginBottom: 24, background: "#f8f9fd", border: "1px solid #e0e3eb", borderRadius: 8, color: "#787b86", fontSize: 12 }}>
        Laddar portfolj...
      </div>
    );
  }

  if (!data || data.empty) return null;

  const sectionHeader = { fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f0f3fa" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f3fa", background: "#f8f9fd" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#131722" }}>Din portfolj</span>
        <span style={{ fontSize: 11, color: "#787b86", marginLeft: 8 }}>{data.totalCount} bolag</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: data.hasHoldings ? "1fr 1fr 1fr" : "1fr 1fr", gap: 0 }}>
        {/* Holdings value by currency */}
        {data.hasHoldings && (
          <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
            <div style={sectionHeader}>Innehav</div>
            {data.currencyGroups.map((g, i) => (
              <div key={g.currency} style={{ marginBottom: i < data.currencyGroups.length - 1 ? 12 : 0 }}>
                <div style={{ ...mono, fontSize: data.currencyGroups.length === 1 ? 20 : 16, fontWeight: 500, color: "#131722" }}>
                  {g.value.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} {g.currency}
                </div>
                <div style={{ ...mono, fontSize: 11, marginTop: 2, color: g.dailyChange >= 0 ? "#089981" : "#f23645" }}>
                  {g.dailyChange >= 0 ? "+" : ""}{g.dailyChange.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} {g.currency} idag ({g.dailyChangePct >= 0 ? "+" : ""}{g.dailyChangePct.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status distribution */}
        <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
          <div style={sectionHeader}>Status</div>
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
              <span style={{ fontSize: 12, color: STATUS_COLORS[status] || "#787b86", fontWeight: 500 }}>{status}</span>
              <span style={{ ...mono, fontSize: 12, color: "#131722" }}>{count} st</span>
            </div>
          ))}
        </div>

        {/* Top movers today */}
        <div style={{ padding: "16px 20px" }}>
          <div style={sectionHeader}>Största rörelser idag</div>
          {data.movers.length === 0 ? (
            <div style={{ fontSize: 11, color: "#b2b5be", fontStyle: "italic" }}>Inga rörelser</div>
          ) : (
            data.movers.map(item => (
              <div key={item.ticker} style={listItem}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#131722" }}>{item.name || item.ticker}</div>
                  <div style={{ fontSize: 10, color: "#787b86", ...mono }}>{item.ticker}</div>
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
