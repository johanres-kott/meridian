import { useState, useEffect } from "react";
import { REGIONS } from "./shared.js"
import { Chg } from "./SharedComponents.jsx";
import SedanSist from "./SedanSist.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences }) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchIndices() {
    try {
      setLoading(true);
      const r = await fetch("/api/indices");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setIndices(await r.json());
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIndices();
    const t = setInterval(fetchIndices, 60000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Global Indices</h2>
          <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
            {today}
            {!loading && !error && <span style={{ marginLeft: 12, color: "#089981" }}>· Yahoo Finance</span>}
          </p>
        </div>
        {lastUpdated && (
          <button onClick={fetchIndices} style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>
            ↻ Uppdatera
          </button>
        )}
      </div>

      {loading && <div style={{ padding: "60px 0", textAlign: "center", color: "#787b86" }}>Hämtar marknadsdata...</div>}
      {error && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645" }}>Fel: {error}</div>}

      {!loading && !error && REGIONS.map(region => {
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
                  {["Symbol", "Name", "Price", "Change %", "Change", "High", "Low"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: ["Symbol","Name"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #e0e3eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(idx => (
                  <tr key={idx.symbol} style={{ cursor: "default" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, borderBottom: "1px solid #f0f3fa" }}>{idx.symbol}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f3fa" }}>{idx.name}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? <Chg value={idx.change} /> : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: idx.changeAbs >= 0 ? "#089981" : "#f23645", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.price > 0 ? `${idx.changeAbs >= 0 ? "+" : ""}${idx.changeAbs.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.high > 0 ? idx.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>
                      {idx.low > 0 ? idx.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
