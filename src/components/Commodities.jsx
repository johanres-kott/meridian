import { useState, useEffect } from "react";
import { REGIONS } from "./shared.js";
import { Chg } from "./SharedComponents.jsx";

const COMMODITY_GROUPS = ["Precious Metals", "Energy", "Industrial Metals", "Agriculture", "FX vs SEK"];

export default function Commodities() {
  const [indices, setIndices] = useState([]);
  const [idxLoading, setIdxLoading] = useState(true);
  const [idxError, setIdxError] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [comLoading, setComLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const grouped = COMMODITY_GROUPS.map(group => ({
    label: group,
    items: commodities.filter(d => d.group === group),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500 }}>Marknader</h1>
          <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
            {today}
            <span style={{ marginLeft: 12, color: "#089981" }}>· Yahoo Finance</span>
          </p>
        </div>
        {lastUpdated && (
          <button onClick={fetchAll} style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>
            ↻ Uppdatera
          </button>
        )}
      </div>

      {/* Global Indices */}
      {idxLoading && <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Hamtar index...</div>}
      {idxError && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", marginBottom: 20 }}>Fel: {idxError}</div>}

      {!idxLoading && !idxError && REGIONS.map(region => {
        const items = indices.filter(i => i.region === region);
        if (!items.length) return null;
        return (
          <div key={region} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f0f3fa" }}>
              {region}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Symbol", "Name", "Price", "Valuta", "Change %", "Change", "High", "Low"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: ["Symbol","Name","Valuta"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #e0e3eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(idx => (
                  <tr key={idx.symbol} style={{ cursor: "default" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, borderBottom: "1px solid #f0f3fa" }}>{idx.symbol}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f3fa" }}>{idx.name}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.currency || ""}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? <Chg value={idx.change} /> : "\u2014"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: idx.changeAbs >= 0 ? "#089981" : "#f23645", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? `${idx.changeAbs >= 0 ? "+" : ""}${idx.changeAbs.toFixed(2)}` : "\u2014"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.high > 0 ? idx.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.low > 0 ? idx.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Commodities & FX */}
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500 }}>Ravaror & Valutor</h2>
      </div>

      {comLoading && <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Hamtar ravarudata...</div>}

      {!comLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {grouped.map(group => (
            <div key={group.label} style={{ border: "1px solid #e0e3eb", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: "#f8f9fd", borderBottom: "1px solid #e0e3eb", fontSize: 11, fontWeight: 500, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.label}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Symbol", "Ravara", "Pris", "Forandring", "Enhet"].map(h => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: ["Symbol","Ravara","Enhet"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.display}>
                      <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #f0f3fa", color: "#2962ff" }}>{item.display}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f3fa" }}>{item.name}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>
                        {item.price > 0 ? item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "\u2014"}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                        {item.price > 0 ? <Chg value={item.change} /> : "\u2014"}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
