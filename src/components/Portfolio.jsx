import { useState, useEffect } from "react";
import { PORTFOLIO, MiniBar, Pill, fmt } from "./shared.jsx";

export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

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
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500 }}>Activist Portfolio</h1>
          <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>Live data · Yahoo Finance + FMP + Finnhub</p>
        </div>
        {loading && <span style={{ fontSize: 12, color: "#787b86" }}>Hämtar fundamentaldata...</span>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["", "Ticker", "Bolag", "Sektor", "Pris", "Mkt Cap", "EBITDA Margin", "P/E Fwd", "ROIC", "Stake", "Uppskattad uppsida", "Status"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: ["","Ticker","Bolag","Sektor","Status"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #e0e3eb" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PORTFOLIO.map(co => {
            const live = portfolioData[co.ticker];
            const ebitda = live?.ebitdaMargin ?? 0;
            const pe = live?.peForward ?? 0;
            const roic = live?.roic ?? 0;
            const isSelected = selected === co.ticker;
            return (
              <>
                <tr key={co.ticker}
                  onClick={() => setSelected(isSelected ? null : co.ticker)}
                  style={{ cursor: "pointer", background: isSelected ? "#f0f3ff" : "transparent" }}>
                  <td style={{ padding: "10px 10px", fontSize: 16, borderBottom: "1px solid #f0f3fa" }}>{co.flag}</td>
                  <td style={{ padding: "10px 10px", fontWeight: 500, color: "#2962ff", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>{co.ticker}</td>
                  <td style={{ padding: "10px 10px", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>{co.name}</td>
                  <td style={{ padding: "10px 10px", color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{co.sector}</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                    {live?.price ? `${live.price.toFixed(2)} ${live.currency}` : "—"}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                    {live?.marketCap ? `${live.marketCap}B` : "—"}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", borderBottom: "1px solid #f0f3fa" }}>
                    <MiniBar value={ebitda} peer={co.peerMedianMargin} max={35} />
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                    {pe ? <><span>{pe.toFixed(1)}x</span><span style={{ color: "#b2b5be", margin: "0 4px" }}>/</span><span style={{ color: "#089981" }}>{co.peerPE}x</span></> : "—"}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: roic > 12 ? "#089981" : "#131722", borderBottom: "1px solid #f0f3fa" }}>
                    {roic ? `${roic}%` : "—"}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>{co.stake}%</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: co.upside > 40 ? "#089981" : "#131722", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>+{co.upside}%</td>
                  <td style={{ padding: "10px 10px", borderBottom: "1px solid #f0f3fa" }}><Pill text={co.status} green={co.status === "Active"} /></td>
                </tr>
                {isSelected && live && (
                  <tr key={`${co.ticker}-detail`}>
                    <td colSpan={12} style={{ padding: "0 10px 16px", background: "#f8f9ff", borderBottom: "1px solid #e0e3eb" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, paddingTop: 12 }}>
                        {[
                          { label: "EBITDA Margin", value: fmt(live.ebitdaMargin, "%"), sub: `Peer ${co.peerMedianMargin}%`, neg: live.ebitdaMargin < co.peerMedianMargin },
                          { label: "Operating Margin", value: fmt(live.operatingMargin, "%"), sub: "TTM" },
                          { label: "Revenue Growth", value: fmt(live.revenueGrowth, "%"), sub: "YoY", neg: live.revenueGrowth < 0 },
                          { label: "ROIC / ROE", value: fmt(live.roic, "%"), sub: "TTM" },
                          { label: "Analytikermål", value: live.targetPrice ? `${live.targetPrice.toFixed(2)} ${live.currency}` : "—", sub: live.recommendation?.toUpperCase() ?? "—" },
                        ].map(m => (
                          <div key={m.label} style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                            <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>{m.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 300, color: m.neg ? "#f23645" : "#089981", fontFamily: "'IBM Plex Mono', monospace" }}>{m.value}</div>
                            <div style={{ fontSize: 11, color: "#b2b5be", marginTop: 4 }}>{m.sub}</div>
                          </div>
                        ))}
                      </div>
                      {live.news?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, color: "#787b86", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Senaste nyheter · Finnhub</div>
                          {live.news.map((n, i) => (
                            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "block", padding: "8px 0", borderBottom: "1px solid #f0f3fa", textDecoration: "none", color: "#131722" }}>
                              <span style={{ fontSize: 12 }}>{n.headline}</span>
                              <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 12 }}>{n.source}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
