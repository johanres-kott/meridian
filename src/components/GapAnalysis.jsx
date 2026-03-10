import { useState, useEffect } from "react";
import { PORTFOLIO } from "./shared.js";

export default function GapAnalysis() {
  const [portfolioData, setPortfolioData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(portfolioData).length > 0) return;
    setLoading(true);
    Promise.all(
      PORTFOLIO.map(co =>
        fetch(`/api/company?ticker=${co.ticker}`)
          .then(r => r.json())
          .then(d => ({ ticker: co.ticker, data: d }))
          .catch(() => ({ ticker: co.ticker, data: null }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ ticker, data }) => { map[ticker] = data; });
      setPortfolioData(map);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Gap Analysis</h1>
        <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>EBITDA-margingap och värderingsgap vs sektormedianer</p>
      </div>

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Laddar data...</div>}

      {!loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { title: "EBITDA Margin vs Peer Median", dataKey: "ebitdaMargin", peerKey: "peerMedianMargin", max: 35, unit: "%" },
              { title: "P/E Forward vs Peer Median", dataKey: "peForward", peerKey: "peerPE", max: 30, unit: "x" },
            ].map(chart => (
              <div key={chart.title} style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16 }}>{chart.title}</div>
                {PORTFOLIO.map(co => {
                  const val = portfolioData[co.ticker]?.[chart.dataKey] ?? 0;
                  const peer = co[chart.peerKey];
                  const vPct = (val / chart.max) * 100;
                  const pPct = (peer / chart.max) * 100;
                  return (
                    <div key={co.ticker} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{co.flag} {co.name}</span>
                        <span style={{ fontSize: 11, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {val
                            ? <span style={{ color: val < peer ? "#f23645" : "#089981" }}>{val}{chart.unit}</span>
                            : <span style={{ color: "#b2b5be" }}>—</span>}
                          <span style={{ color: "#b2b5be" }}> / {peer}{chart.unit}</span>
                        </span>
                      </div>
                      <div style={{ height: 5, background: "#f0f3fa", borderRadius: 3, position: "relative" }}>
                        {val > 0 && <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: val < peer ? "#f23645" : "#089981", borderRadius: 3, opacity: 0.7 }} />}
                        <div style={{ position: "absolute", top: -2, left: `calc(${pPct}% - 1px)`, width: 2, height: 9, background: "#2962ff", borderRadius: 1 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#787b86" }}>
                  <span><span style={{ display: "inline-block", width: 8, height: 3, background: "#f23645", borderRadius: 1, marginRight: 4, verticalAlign: "middle", opacity: 0.7 }} />Bolag</span>
                  <span><span style={{ display: "inline-block", width: 2, height: 10, background: "#2962ff", borderRadius: 1, marginRight: 4, verticalAlign: "middle" }} />Peer median</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16 }}>Uppsiderankning · 3-årshorisont</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "", "Bolag", "Margingap", "PE-rabatt", "Uppskattad uppsida"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: ["#","","Bolag"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #e0e3eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...PORTFOLIO].sort((a, b) => b.upside - a.upside).map((co, i) => {
                  const live = portfolioData[co.ticker];
                  return (
                    <tr key={co.ticker}>
                      <td style={{ padding: "8px 10px", color: "#b2b5be", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, borderBottom: "1px solid #f0f3fa" }}>{i + 1}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f3fa" }}>{co.flag}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>{co.name}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#f23645", borderBottom: "1px solid #f0f3fa" }}>
                        {live?.ebitdaMargin ? `${(live.ebitdaMargin - co.peerMedianMargin).toFixed(1)}pp` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#f23645", borderBottom: "1px solid #f0f3fa" }}>
                        {live?.peForward ? `${(((live.peForward / co.peerPE) - 1) * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0f3fa" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                          <div style={{ width: 80, height: 4, background: "#f0f3fa", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${(co.upside / 55) * 100}%`, background: "#089981", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: "#089981", minWidth: 40, textAlign: "right" }}>+{co.upside}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
