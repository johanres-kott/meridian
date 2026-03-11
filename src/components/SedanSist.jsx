import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Chg } from "./SharedComponents.jsx";

const AVAILABLE_INDICES = [
  { symbol: "OMXS30", name: "OMX Stockholm 30" },
  { symbol: "SPX", name: "S&P 500" },
  { symbol: "IXIC", name: "Nasdaq" },
  { symbol: "DJI", name: "Dow Jones" },
  { symbol: "SX5E", name: "Euro Stoxx 50" },
  { symbol: "DAX", name: "DAX" },
  { symbol: "FTSE", name: "FTSE 100" },
  { symbol: "CAC", name: "CAC 40" },
  { symbol: "N225", name: "Nikkei 225" },
  { symbol: "HSI", name: "Hang Seng" },
  { symbol: "SENSEX", name: "BSE Sensex" },
  { symbol: "KOSPI", name: "KOSPI" },
  { symbol: "OMXHPI", name: "OMX Helsinki" },
  { symbol: "OMXC25", name: "OMX Copenhagen 25" },
];

const AVAILABLE_COMMODITIES = [
  { symbol: "GC", name: "Guld" },
  { symbol: "SI", name: "Silver" },
  { symbol: "PL", name: "Platina" },
  { symbol: "PA", name: "Palladium" },
  { symbol: "BRENT", name: "Olja Brent" },
  { symbol: "WTI", name: "Olja WTI" },
  { symbol: "NG", name: "Naturgas" },
  { symbol: "CU", name: "Koppar" },
  { symbol: "AL", name: "Aluminium" },
  { symbol: "WHEAT", name: "Vete" },
  { symbol: "CORN", name: "Majs" },
  { symbol: "SOY", name: "Sojabonor" },
  { symbol: "USD/SEK", name: "Dollarn" },
  { symbol: "EUR/SEK", name: "Euron" },
  { symbol: "GBP/SEK", name: "Pundet" },
];

function Picker({ items, selected, onSave, onCancel }) {
  const [checked, setChecked] = useState(new Set(selected));

  function toggle(symbol) {
    const next = new Set(checked);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    setChecked(next);
  }

  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
        {items.map(item => (
          <label key={item.symbol} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={checked.has(item.symbol)}
              onChange={() => toggle(item.symbol)}
              style={{ accentColor: "#2962ff" }}
            />
            <span style={{ color: "#131722" }}>{item.name}</span>
            <span style={{ color: "#b2b5be", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{item.symbol}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onSave([...checked])}
          style={{ fontSize: 11, color: "#fff", background: "#2962ff", border: "none", borderRadius: 3, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Spara
        </button>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Avbryt
        </button>
        {checked.size > 0 && (
          <button
            onClick={() => onSave([])}
            style={{ fontSize: 11, color: "#787b86", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}
          >
            Aterstall
          </button>
        )}
      </div>
    </div>
  );
}

export default function SedanSist({ lastSeenAt, preferences = {}, onUpdatePreferences, userId }) {
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [data, setData] = useState(null);
  const [editingIndices, setEditingIndices] = useState(false);
  const [editingCommodities, setEditingCommodities] = useState(false);

  useEffect(() => {
    if (!lastSeenAt) { setLoading(false); return; }

    async function load() {
      try {
        const [watchlistRes, indicesRes, commoditiesRes] = await Promise.all([
          supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at"),
          fetch("/api/indices").then(r => r.json()),
          fetch("/api/commodities").then(r => r.json()),
        ]);

        const watchlist = watchlistRes.data || [];

        const companyResults = await Promise.all(
          watchlist.slice(0, 20).map(async (item) => {
            try {
              const [companyRes, chartRes] = await Promise.all([
                fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`).then(r => r.json()),
                fetch(`/api/chart?ticker=${encodeURIComponent(item.ticker)}&range=1m`).then(r => r.json()),
              ]);

              const points = chartRes?.points || [];
              const lastSeenDate = lastSeenAt.split("T")[0];
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

        const movers = validCompanies
          .filter(c => c.changeSinceLast !== null)
          .sort((a, b) => Math.abs(b.changeSinceLast) - Math.abs(a.changeSinceLast));

        // Store all data - filtering happens at render time based on preferences
        const allIndices = [...(indicesRes || [])].filter(i => i.price > 0);
        const allCommodities = [...(commoditiesRes || [])].filter(c => c.price > 0);

        const allNews = validCompanies.flatMap(c => c.news);
        const seen = new Set();
        const uniqueNews = allNews.filter(n => {
          if (seen.has(n.headline)) return false;
          seen.add(n.headline);
          return true;
        }).slice(0, 5);

        setData({ movers, allIndices, allCommodities, news: uniqueNews });
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

  const pinnedIndices = preferences.pinned_indices || [];
  const pinnedCommodities = preferences.pinned_commodities || [];

  // Filter indices: pinned or top 4 by |change|
  const displayIndices = pinnedIndices.length > 0
    ? pinnedIndices.map(sym => data.allIndices.find(i => i.symbol === sym)).filter(Boolean)
    : [...data.allIndices].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4);

  // Filter commodities: pinned or top 4 by |change|
  const displayCommodities = pinnedCommodities.length > 0
    ? pinnedCommodities.map(sym => data.allCommodities.find(c => (c.display || c.symbol) === sym)).filter(Boolean)
    : [...data.allCommodities].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4);

  const lastDate = new Date(lastSeenAt);
  const formattedDate = lastDate.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });

  const sectionHeader = { fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f0f3fa" };
  const tickerStyle = { fontSize: 12, fontWeight: 500, color: "#131722" };
  const subtext = { fontSize: 11, color: "#787b86" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const editBtn = { fontSize: 10, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "none", letterSpacing: "normal", fontWeight: 400 };

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
          <div style={sectionHeader}><span>Din portfolj</span></div>
          {data.movers.length === 0 ? (
            <div style={{ fontSize: 11, color: "#b2b5be", fontStyle: "italic" }}>Inga bolag i bevakning</div>
          ) : (
            data.movers.slice(0, 5).map(c => (
              <div key={c.ticker} style={listItem}>
                <div>
                  <div style={tickerStyle}>{c.name}</div>
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
          <div style={sectionHeader}>
            <span>Marknader{pinnedIndices.length > 0 ? "" : " (topp 4)"}</span>
            <button style={editBtn} onClick={() => { setEditingIndices(!editingIndices); setEditingCommodities(false); }}>
              {editingIndices ? "Avbryt" : "Anpassa"}
            </button>
          </div>
          {editingIndices ? (
            <Picker
              items={AVAILABLE_INDICES}
              selected={pinnedIndices}
              onSave={(syms) => { onUpdatePreferences({ pinned_indices: syms }); setEditingIndices(false); }}
              onCancel={() => setEditingIndices(false)}
            />
          ) : (
            displayIndices.map(idx => (
              <div key={idx.symbol} style={listItem}>
                <div>
                  <div style={tickerStyle}>{idx.name}</div>
                  <div style={{ ...subtext, ...mono }}>{idx.symbol}</div>
                </div>
                <div style={{ ...mono, fontSize: 12 }}>
                  <Chg value={idx.change} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Commodity highlights */}
        <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f3fa" }}>
          <div style={sectionHeader}>
            <span>Ravaror & FX{pinnedCommodities.length > 0 ? "" : " (topp 4)"}</span>
            <button style={editBtn} onClick={() => { setEditingCommodities(!editingCommodities); setEditingIndices(false); }}>
              {editingCommodities ? "Avbryt" : "Anpassa"}
            </button>
          </div>
          {editingCommodities ? (
            <Picker
              items={AVAILABLE_COMMODITIES}
              selected={pinnedCommodities}
              onSave={(syms) => { onUpdatePreferences({ pinned_commodities: syms }); setEditingCommodities(false); }}
              onCancel={() => setEditingCommodities(false)}
            />
          ) : (
            displayCommodities.map(c => (
              <div key={c.symbol} style={listItem}>
                <div>
                  <div style={tickerStyle}>{c.name}</div>
                  <div style={{ ...subtext, ...mono }}>{c.display || c.symbol}</div>
                </div>
                <div style={{ ...mono, fontSize: 12 }}>
                  <Chg value={c.change} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* News */}
        <div style={{ padding: "16px 20px" }}>
          <div style={sectionHeader}><span>Nyheter</span></div>
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
