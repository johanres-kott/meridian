import { useState, useEffect } from "react";
import { REGIONS } from "./shared.js";
import { Chg } from "./SharedComponents.jsx";
import MarketDetailView from "./MarketDetailView.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const COMMODITY_GROUPS = ["Precious Metals", "Energy", "Industrial Metals", "Agriculture", "FX vs SEK"];

export default function Commodities({ deepLink, onClearDeepLink }) {
  const isMobile = useIsMobile();
  const [indices, setIndices] = useState([]);
  const [idxLoading, setIdxLoading] = useState(true);
  const [idxError, setIdxError] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [comLoading, setComLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null);

  // Handle deep link from Översikt
  useEffect(() => {
    if (!deepLink || (idxLoading && comLoading)) return;
    const sym = deepLink.symbol;
    if (!sym) return;
    const match = [...indices, ...commodities].find(item =>
      (item.symbol === sym) || (item.display === sym) || (item.name === sym)
    );
    if (match) {
      setSelected(match);
      onClearDeepLink?.();
    }
  }, [deepLink, idxLoading, comLoading, indices, commodities]);

  async function fetchIndices() {
    try {
      setIdxLoading(true);
      const r = await fetch("/api/indices");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setIndices(await r.json());
      setIdxError(null);
    } catch (e) {
      setIdxError(e.message);
    } finally {
      setIdxLoading(false);
    }
  }

  async function fetchCommodities() {
    try {
      setComLoading(true);
      const r = await fetch("/api/commodities");
      setCommodities(await r.json());
    } catch (e) {
      console.error(e);
    } finally {
      setComLoading(false);
    }
  }

  function fetchAll() {
    fetchIndices();
    fetchCommodities();
    setLastUpdated(new Date());
  }

  useEffect(() => {
    fetchAll();
    const t1 = setInterval(fetchIndices, 60000);
    const t2 = setInterval(fetchCommodities, 120000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  if (selected) {
    return <MarketDetailView item={selected} onBack={() => setSelected(null)} isMobile={isMobile} />;
  }

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const grouped = COMMODITY_GROUPS.map(group => ({
    label: group,
    items: commodities.filter(d => d.group === group),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 12 : 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 500 }}>Marknader</h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {today}
            <span style={{ marginLeft: 12, color: "#089981" }}>· Yahoo Finance</span>
          </p>
        </div>
        {lastUpdated && (
          <button onClick={fetchAll} style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>
            ↻ Uppdatera
          </button>
        )}
      </div>

      {/* Global Indices */}
      {idxLoading && <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>Hamtar index...</div>}
      {idxError && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", marginBottom: 20 }}>Fel: {idxError}</div>}

      {!idxLoading && !idxError && REGIONS.map(region => {
        const items = indices.filter(i => i.region === region);
        if (!items.length) return null;
        return (
          <div key={region} style={{ marginBottom: isMobile ? 20 : 28 }}>
            <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border-light)" }}>
              {region}
            </div>
            <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 600 : undefined }}>
              <thead>
                <tr>
                  {(isMobile ? ["Symbol", "Price", "Change %", "Change"] : ["Symbol", "Name", "Price", "Valuta", "Change %", "Change", "High", "Low"]).map(h => (
                    <th key={h} style={{ padding: isMobile ? "4px 6px" : "6px 10px", textAlign: ["Symbol","Name","Valuta"].includes(h) ? "left" : "right", fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(idx => (
                  <tr key={idx.symbol} onClick={() => setSelected(idx)} style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: isMobile ? "6px" : "8px 10px", fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 11 : 12, borderBottom: "1px solid var(--border-light)", whiteSpace: "nowrap" }}>{idx.symbol}</td>
                    {!isMobile && <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>{idx.name}</td>}
                    <td style={{ padding: isMobile ? "6px" : "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: isMobile ? 11 : undefined, borderBottom: "1px solid var(--border-light)" }}>
                      {idx.price > 0 ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>
                    {!isMobile && <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {idx.currency || ""}
                    </td>}
                    <td style={{ padding: isMobile ? "6px" : "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 11 : undefined, borderBottom: "1px solid var(--border-light)" }}>
                      {idx.price > 0 ? <Chg value={idx.change} /> : "\u2014"}
                    </td>
                    <td style={{ padding: isMobile ? "6px" : "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 11 : undefined, color: idx.changeAbs >= 0 ? "#089981" : "#f23645", borderBottom: "1px solid var(--border-light)" }}>
                      {idx.price > 0 ? `${idx.changeAbs >= 0 ? "+" : ""}${idx.changeAbs.toFixed(2)}` : "\u2014"}
                    </td>
                    {!isMobile && <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {idx.high > 0 ? idx.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>}
                    {!isMobile && <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {idx.low > 0 ? idx.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        );
      })}

      {/* Commodities & FX */}
      <div style={{ marginTop: 8, marginBottom: isMobile ? 12 : 20 }}>
        <h2 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 500 }}>Ravaror & Valutor</h2>
      </div>

      {comLoading && <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>Hamtar ravarudata...</div>}

      {!comLoading && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16 }}>
          {grouped.map(group => (
            <div key={group.label} style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.label}
              </div>
              <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 400 : undefined }}>
                <thead>
                  <tr>
                    {(isMobile ? ["Symbol", "Pris", "Forandring"] : ["Symbol", "Ravara", "Pris", "Forandring", "Enhet"]).map(h => (
                      <th key={h} style={{ padding: isMobile ? "4px 6px" : "6px 12px", textAlign: ["Symbol","Ravara","Enhet"].includes(h) ? "left" : "right", fontSize: isMobile ? 10 : 11, fontWeight: 500, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.display} onClick={() => setSelected(item)} style={{ cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: isMobile ? "6px" : "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: isMobile ? 11 : 12, borderBottom: "1px solid var(--border-light)", color: "var(--accent)", whiteSpace: "nowrap" }}>{item.display}</td>
                      {!isMobile && <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-light)" }}>{item.name}</td>}
                      <td style={{ padding: isMobile ? "6px" : "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: isMobile ? 11 : undefined, borderBottom: "1px solid var(--border-light)" }}>
                        {item.price > 0 ? item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "\u2014"}
                      </td>
                      <td style={{ padding: isMobile ? "6px" : "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 11 : undefined, borderBottom: "1px solid var(--border-light)" }}>
                        {item.price > 0 ? <Chg value={item.change} /> : "\u2014"}
                      </td>
                      {!isMobile && <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>{item.unit}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
