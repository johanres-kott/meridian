import { useState, useEffect } from "react";
import { Chg } from "./SharedComponents.jsx";

const GROUP_ORDER = ["Precious Metals", "Energy", "Industrial Metals", "Agriculture", "FX vs SEK"];

export default function Commodities() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const r = await fetch("/api/commodities");
      const d = await r.json();
      setData(d);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 120000);
    return () => clearInterval(t);
  }, []);

  const grouped = GROUP_ORDER.map(group => ({
    label: group,
    items: data.filter(d => d.group === group),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500 }}>Råvaror & Valutor</h1>
          <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>Realtidspriser · Yahoo Finance</p>
        </div>
        {lastUpdated && (
          <button onClick={fetchAll} style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>
            ↻ Uppdatera
          </button>
        )}
      </div>

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Hämtar råvarudata...</div>}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {grouped.map(group => (
            <div key={group.label} style={{ border: "1px solid #e0e3eb", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: "#f8f9fd", borderBottom: "1px solid #e0e3eb", fontSize: 11, fontWeight: 500, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.label}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Symbol", "Råvara", "Pris", "Förändring", "Enhet"].map(h => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: ["Symbol","Råvara","Enhet"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.display}>
                      <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #f0f3fa", color: "#2962ff" }}>{item.display}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f3fa" }}>{item.name}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>
                        {item.price > 0 ? item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "—"}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                        {item.price > 0 ? <Chg value={item.change} /> : "—"}
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
