import { useState, useEffect } from "react";

const MOCK_COMPANIES = [
  { ticker: "ERIC B", name: "Ericsson", sector: "Telecom Equipment", marketCap: 238, ev: 261, ebitdaMargin: 9.2, peerMedianMargin: 18.4, peForward: 14.2, peerPE: 22.1, roic: 8.1, debtEbitda: 1.2, stake: 7.3, upside: 48, status: "Active" },
  { ticker: "UBS", name: "UBS Group", sector: "Investment Banking", marketCap: 892, ev: 1240, ebitdaMargin: 22.1, peerMedianMargin: 28.7, peForward: 9.8, peerPE: 13.4, roic: 11.2, debtEbitda: 2.8, stake: 3.1, upside: 37, status: "Active" },
  { ticker: "ALV", name: "Autoliv", sector: "Auto Components", marketCap: 68, ev: 82, ebitdaMargin: 11.4, peerMedianMargin: 14.8, peForward: 12.1, peerPE: 16.2, roic: 14.3, debtEbitda: 1.8, stake: 12.4, upside: 28, status: "Active" },
  { ticker: "PSON", name: "Pearson", sector: "Education", marketCap: 71, ev: 79, ebitdaMargin: 17.2, peerMedianMargin: 24.1, peForward: 16.8, peerPE: 24.3, roic: 9.8, debtEbitda: 0.9, stake: 15.2, upside: 41, status: "Active" },
  { ticker: "AKZA", name: "Akzo Nobel", sector: "Specialty Chemicals", marketCap: 98, ev: 128, ebitdaMargin: 12.8, peerMedianMargin: 19.3, peForward: 17.4, peerPE: 23.8, roic: 7.2, debtEbitda: 3.1, stake: 9.8, upside: 52, status: "Active" },
  { ticker: "SKF B", name: "SKF", sector: "Industrial", marketCap: 112, ev: 134, ebitdaMargin: 14.1, peerMedianMargin: 18.9, peForward: 13.6, peerPE: 18.4, roic: 12.4, debtEbitda: 1.4, stake: 6.2, upside: 31, status: "Monitoring" },
];

const regions = ["Americas", "Europe", "Asia Pacific", "Nordic"];

const Chg = ({ value }) => (
  <span style={{ color: value >= 0 ? "#089981" : "#f23645", fontVariantNumeric: "tabular-nums" }}>
    {value >= 0 ? "+" : ""}{value.toFixed(2)}%
  </span>
);

const MiniBar = ({ value, peer, max }) => {
  const vPct = Math.min((value / max) * 100, 100);
  const pPct = Math.min((peer / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 3, background: "#f0f3fa", borderRadius: 2, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: value < peer ? "#f23645" : "#089981", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: -2, left: `${pPct}%`, width: 1, height: 7, background: "#b2b5be" }} />
      </div>
      <span style={{ fontSize: 11, color: value < peer ? "#f23645" : "#089981", fontVariantNumeric: "tabular-nums" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState("markets");
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(new Date());
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [indicesError, setIndicesError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function fetchIndices() {
      try {
        setIndicesLoading(true);
        const res = await fetch("/api/indices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setIndices(data);
      } catch (err) {
        setIndicesError(err.message);
      } finally {
        setIndicesLoading(false);
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "markets", label: "Global Markets" },
    { id: "portfolio", label: "Portfolio" },
    { id: "analysis", label: "Gap Analysis" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#131722", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        th { border-bottom: 1px solid #e0e3eb; }
        td { border-bottom: 1px solid #f0f3fa; }
        tr:hover td { background: #f8f9fd; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 14px; font-size: 13px; font-family: inherit; color: #787b86; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .tab-btn.active { color: #131722; border-bottom-color: #2962ff; font-weight: 500; }
        .tab-btn:hover { color: #131722; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid #e0e3eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 46, position: "sticky", top: 0, background: "#ffffff", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, background: "#2962ff", borderRadius: 4 }} />
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.02em" }}>Meridian</span>
          </div>
          <div style={{ display: "flex" }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>
            {time.toLocaleTimeString("sv-SE")} CET
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: indicesLoading ? "#f0a500" : indicesError ? "#f23645" : "#089981", animation: indicesLoading ? "pulse 1s infinite" : "none" }} />
            <span style={{ fontSize: 11, color: "#787b86" }}>{indicesLoading ? "Loading..." : indicesError ? "Error" : "Live"}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>

        {/* MARKETS */}
        {tab === "markets" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 500, color: "#131722" }}>Global Indices</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
                {time.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {!indicesLoading && !indicesError && <span style={{ marginLeft: 12, color: "#089981" }}>· Live data via Finnhub</span>}
              </p>
            </div>

            {indicesLoading && (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#787b86", fontSize: 13 }}>
                Hämtar marknadsdata...
              </div>
            )}

            {indicesError && (
              <div style={{ padding: "20px", background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", fontSize: 13 }}>
                Kunde inte hämta data: {indicesError}
              </div>
            )}

            {!indicesLoading && !indicesError && regions.map(region => {
              const items = indices.filter(i => i.region === region);
              if (!items.length) return null;
              return (
                <div key={region} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f0f3fa" }}>
                    {region}
                  </div>
                  <table>
                    <thead>
                      <tr>
                        {["Symbol", "Name", "Price", "Change %", "Change", "High", "Low"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: ["Symbol","Name"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(idx => (
                        <tr key={idx.symbol}>
                          <td style={{ padding: "8px 10px", fontWeight: 500, color: "#131722", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{idx.symbol}</td>
                          <td style={{ padding: "8px 10px", color: "#131722" }}>{idx.name}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>
                            {idx.price > 0 ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {idx.price > 0 ? <Chg value={idx.change} /> : "—"}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: idx.changeAbs >= 0 ? "#089981" : "#f23645" }}>
                            {idx.price > 0 ? `${idx.changeAbs >= 0 ? "+" : ""}${idx.changeAbs.toFixed(2)}` : "—"}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", fontSize: 12 }}>
                            {idx.high > 0 ? idx.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#787b86", fontSize: 12 }}>
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
        )}

        {/* PORTFOLIO */}
        {tab === "portfolio" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 500 }}>Activist Portfolio</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>6 positions · Avg upside 39.5% · Avg margin gap 5.9pp</p>
            </div>

            <table>
              <thead>
                <tr>
                  {["Ticker", "Company", "Sector", "Mkt Cap", "EBITDA Margin", "P/E Fwd", "ROIC", "ND/EBITDA", "Stake", "Upside", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: ["Ticker","Company","Sector","Status"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPANIES.map(co => (
                  <>
                    <tr key={co.ticker} onClick={() => setSelected(selected?.ticker === co.ticker ? null : co)}
                      style={{ cursor: "pointer", background: selected?.ticker === co.ticker ? "#f0f3ff" : "transparent" }}>
                      <td style={{ padding: "10px 10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: "#2962ff" }}>{co.ticker}</td>
                      <td style={{ padding: "10px 10px", fontWeight: 500 }}>{co.name}</td>
                      <td style={{ padding: "10px 10px", color: "#787b86" }}>{co.sector}</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{co.marketCap}B</td>
                      <td style={{ padding: "10px 10px", textAlign: "right" }}>
                        <MiniBar value={co.ebitdaMargin} peer={co.peerMedianMargin} max={35} />
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                        <span style={{ color: "#131722" }}>{co.peForward}x</span>
                        <span style={{ color: "#b2b5be", margin: "0 4px" }}>/</span>
                        <span style={{ color: "#089981" }}>{co.peerPE}x</span>
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: co.roic > 12 ? "#089981" : "#131722" }}>{co.roic}%</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: co.debtEbitda > 2.5 ? "#f23645" : "#131722" }}>{co.debtEbitda}x</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{co.stake}%</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: co.upside > 40 ? "#089981" : "#131722", fontWeight: 500 }}>+{co.upside}%</td>
                      <td style={{ padding: "10px 10px" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 3, background: co.status === "Active" ? "#e8f5e9" : "#f5f5f5", color: co.status === "Active" ? "#089981" : "#787b86", fontWeight: 500 }}>{co.status}</span>
                      </td>
                    </tr>
                    {selected?.ticker === co.ticker && (
                      <tr key={`${co.ticker}-detail`}>
                        <td colSpan={11} style={{ padding: "0 10px 16px", background: "#f8f9ff", borderBottom: "1px solid #e0e3eb" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingTop: 12 }}>
                            {[
                              { label: "EBITDA Margin gap", value: `${(co.ebitdaMargin - co.peerMedianMargin).toFixed(1)}pp`, sub: `${co.ebitdaMargin}% vs peer ${co.peerMedianMargin}%`, neg: true },
                              { label: "P/E discount", value: `${(((co.peForward / co.peerPE) - 1) * 100).toFixed(0)}%`, sub: `${co.peForward}x vs peer ${co.peerPE}x`, neg: true },
                              { label: "ROIC vs WACC", value: `${(co.roic - 8).toFixed(1)}pp`, sub: `ROIC ${co.roic}% / WACC ~8%`, neg: co.roic < 8 },
                              { label: "Est. upside", value: `+${co.upside}%`, sub: "3-year horizon", neg: false },
                            ].map(m => (
                              <div key={m.label} style={{ background: "#ffffff", border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                                <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>{m.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 300, color: m.neg ? "#f23645" : "#089981", fontFamily: "'IBM Plex Mono', monospace" }}>{m.value}</div>
                                <div style={{ fontSize: 11, color: "#b2b5be", marginTop: 4 }}>{m.sub}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 12, background: "#ffffff", border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px", borderLeft: "3px solid #2962ff" }}>
                            <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Value creation thesis</div>
                            <p style={{ fontSize: 13, color: "#131722", lineHeight: 1.6 }}>
                              Margin gap of <strong>{(co.peerMedianMargin - co.ebitdaMargin).toFixed(1)}pp</strong> vs sector median.
                              Trading at <strong>{co.peForward}x</strong> forward P/E vs peer group at <strong>{co.peerPE}x</strong> — a {(((co.peForward / co.peerPE) - 1) * -100).toFixed(0)}% valuation discount.
                              Estimated upside of <strong style={{ color: "#089981" }}>+{co.upside}%</strong> if margins normalize over 3 years.
                              {co.debtEbitda > 2.5 ? " Leverage is elevated — capital structure optimization likely required." : " Balance sheet is manageable, execution is the key lever."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GAP ANALYSIS */}
        {tab === "analysis" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 500 }}>Gap Analysis</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>EBITDA margin and P/E valuation gaps vs sector peers</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                { title: "EBITDA Margin — Company vs Peer Median", companyKey: "ebitdaMargin", peerKey: "peerMedianMargin", max: 35, unit: "%" },
                { title: "P/E Forward — Company vs Peer Median", companyKey: "peForward", peerKey: "peerPE", max: 30, unit: "x" },
              ].map(chart => (
                <div key={chart.title} style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#131722", marginBottom: 16 }}>{chart.title}</div>
                  {MOCK_COMPANIES.map(co => {
                    const val = co[chart.companyKey];
                    const peer = co[chart.peerKey];
                    const vPct = (val / chart.max) * 100;
                    const pPct = (peer / chart.max) * 100;
                    return (
                      <div key={co.ticker} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#131722", fontWeight: 500 }}>{co.ticker}</span>
                          <span style={{ fontSize: 11, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>
                            <span style={{ color: val < peer ? "#f23645" : "#089981" }}>{val}{chart.unit}</span>
                            <span style={{ color: "#b2b5be" }}> / peer </span>
                            <span style={{ color: "#089981" }}>{peer}{chart.unit}</span>
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#f0f3fa", borderRadius: 3, position: "relative" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: val < peer ? "#f23645" : "#089981", borderRadius: 3, opacity: 0.7 }} />
                          <div style={{ position: "absolute", top: -2, left: `calc(${pPct}% - 1px)`, width: 2, height: 9, background: "#2962ff", borderRadius: 1 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#787b86" }}>
                    <span><span style={{ display: "inline-block", width: 8, height: 3, background: "#f23645", borderRadius: 1, marginRight: 4, verticalAlign: "middle", opacity: 0.7 }} />Company</span>
                    <span><span style={{ display: "inline-block", width: 2, height: 10, background: "#2962ff", borderRadius: 1, marginRight: 4, verticalAlign: "middle" }} />Peer median</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#131722", marginBottom: 16 }}>Estimated Upside Ranking · 3-year horizon</div>
              <table>
                <thead>
                  <tr>
                    {["#", "Ticker", "Company", "Margin gap", "PE discount", "Estimated upside"].map(h => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: ["#","Ticker","Company"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...MOCK_COMPANIES].sort((a, b) => b.upside - a.upside).map((co, i) => (
                    <tr key={co.ticker}>
                      <td style={{ padding: "8px 10px", color: "#b2b5be", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: "#2962ff" }}>{co.ticker}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{co.name}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#f23645" }}>
                        {(co.ebitdaMargin - co.peerMedianMargin).toFixed(1)}pp
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#f23645" }}>
                        {(((co.peForward / co.peerPE) - 1) * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                          <div style={{ width: 80, height: 4, background: "#f0f3fa", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${(co.upside / 55) * 100}%`, background: "#089981", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: "#089981", minWidth: 40, textAlign: "right" }}>+{co.upside}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
