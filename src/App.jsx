import { useState, useEffect, useCallback } from "react";

// Portfolio — mix of Cevian holdings + Swedish companies
const PORTFOLIO = [
  { ticker: "ERIC-B.ST", name: "Ericsson", sector: "Telecom Equipment", peerMedianMargin: 18.4, peerPE: 22.1, stake: 7.3, upside: 48, status: "Active", flag: "🇸🇪" },
  { ticker: "SKF-B.ST", name: "SKF", sector: "Industrial", peerMedianMargin: 18.9, peerPE: 18.4, stake: 6.2, upside: 31, status: "Active", flag: "🇸🇪" },
  { ticker: "VOLV-B.ST", name: "Volvo", sector: "Trucks & Machinery", peerMedianMargin: 16.2, peerPE: 12.8, stake: 2.1, upside: 22, status: "Monitoring", flag: "🇸🇪" },
  { ticker: "SAND.ST", name: "Sandvik", sector: "Industrial Tools", peerMedianMargin: 21.4, peerPE: 20.1, stake: 1.8, upside: 19, status: "Monitoring", flag: "🇸🇪" },
  { ticker: "UBS", name: "UBS Group", sector: "Investment Banking", peerMedianMargin: 28.7, peerPE: 13.4, stake: 3.1, upside: 37, status: "Active", flag: "🇨🇭" },
  { ticker: "PSON.L", name: "Pearson", sector: "Education", peerMedianMargin: 24.1, peerPE: 24.3, stake: 15.2, upside: 41, status: "Active", flag: "🇬🇧" },
  { ticker: "AKZA.AS", name: "Akzo Nobel", sector: "Specialty Chemicals", peerMedianMargin: 19.3, peerPE: 23.8, stake: 9.8, upside: 52, status: "Active", flag: "🇳🇱" },
];

const regions = ["Americas", "Europe", "Asia Pacific", "Nordic"];

const Chg = ({ value }) => (
  <span style={{ color: value >= 0 ? "#089981" : "#f23645" }}>
    {value >= 0 ? "+" : ""}{value.toFixed(2)}%
  </span>
);

const MiniBar = ({ value, peer, max }) => {
  if (!value) return <span style={{ color: "#b2b5be", fontSize: 11 }}>—</span>;
  const vPct = Math.min((Math.abs(value) / max) * 100, 100);
  const pPct = Math.min((peer / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 3, background: "#f0f3fa", borderRadius: 2, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: value < peer ? "#f23645" : "#089981", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: -2, left: `${pPct}%`, width: 1, height: 7, background: "#b2b5be" }} />
      </div>
      <span style={{ fontSize: 11, color: value < peer ? "#f23645" : "#089981" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

const Pill = ({ text, green }) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 3,
    background: green ? "#e8f5e9" : "#f5f5f5",
    color: green ? "#089981" : "#787b86", fontWeight: 500
  }}>{text}</span>
);

export default function App() {
  const [tab, setTab] = useState("markets");
  const [time, setTime] = useState(new Date());

  // Markets
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [indicesError, setIndicesError] = useState(null);

  // Portfolio live data
  const [portfolioData, setPortfolioData] = useState({});
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // Company search
  const [searchTicker, setSearchTicker] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch indices
  useEffect(() => {
    async function fetchIndices() {
      try {
        setIndicesLoading(true);
        const r = await fetch("/api/indices");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setIndices(await r.json());
        setIndicesError(null);
      } catch (e) {
        setIndicesError(e.message);
      } finally {
        setIndicesLoading(false);
      }
    }
    fetchIndices();
    const t = setInterval(fetchIndices, 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch portfolio data when tab opens
  useEffect(() => {
    if (tab !== "portfolio" || Object.keys(portfolioData).length > 0) return;
    setPortfolioLoading(true);
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
      setPortfolioLoading(false);
    });
  }, [tab]);

  const handleSearch = useCallback(async () => {
    if (!searchTicker.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const r = await fetch(`/api/company?ticker=${searchTicker.trim().toUpperCase()}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSearchResult(d);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearchLoading(false);
    }
  }, [searchTicker]);

  const tabs = [
    { id: "markets", label: "Global Markets" },
    { id: "portfolio", label: "Portfolio" },
    { id: "analysis", label: "Gap Analysis" },
    { id: "search", label: "Company Search" },
  ];

  const fmt = (v, suffix = "") => v && v !== 0 ? `${v}${suffix}` : "—";

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#131722", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        th { border-bottom: 1px solid #e0e3eb; }
        td { border-bottom: 1px solid #f0f3fa; }
        tbody tr:hover td { background: #f8f9fd; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 14px; font-size: 13px; font-family: inherit; color: #787b86; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .tab-btn.active { color: #131722; border-bottom-color: #2962ff; font-weight: 500; }
        .tab-btn:hover { color: #131722; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        input { font-family: inherit; }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid #e0e3eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 46, position: "sticky", top: 0, background: "#fff", zIndex: 50 }}>
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
          <span style={{ fontSize: 12, color: "#787b86" }} className="mono">{time.toLocaleTimeString("sv-SE")} CET</span>
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
              <h1 style={{ fontSize: 18, fontWeight: 500 }}>Global Indices</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
                {time.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {!indicesLoading && !indicesError && <span style={{ marginLeft: 12, color: "#089981" }}>· Yahoo Finance</span>}
              </p>
            </div>
            {indicesLoading && <div style={{ padding: "60px 0", textAlign: "center", color: "#787b86" }}>Hämtar marknadsdata...</div>}
            {indicesError && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645" }}>Fel: {indicesError}</div>}
            {!indicesLoading && !indicesError && regions.map(region => {
              const items = indices.filter(i => i.region === region);
              if (!items.length) return null;
              return (
                <div key={region} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f0f3fa" }}>{region}</div>
                  <table>
                    <thead>
                      <tr>
                        {["Symbol", "Name", "Price", "Change %", "Change", "High", "Low"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: ["Symbol","Name"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(idx => (
                        <tr key={idx.symbol}>
                          <td style={{ padding: "8px 10px", fontWeight: 500, color: "#131722" }} className="mono">{idx.symbol}</td>
                          <td style={{ padding: "8px 10px" }}>{idx.name}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }} className="mono">{idx.price > 0 ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }} className="mono">{idx.price > 0 ? <Chg value={idx.change} /> : "—"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: idx.changeAbs >= 0 ? "#089981" : "#f23645" }} className="mono">{idx.price > 0 ? `${idx.changeAbs >= 0 ? "+" : ""}${idx.changeAbs.toFixed(2)}` : "—"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "#787b86" }} className="mono">{idx.high > 0 ? idx.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "#787b86" }} className="mono">{idx.low > 0 ? idx.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
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
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 500 }}>Activist Portfolio</h1>
                <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>Live data · Yahoo Finance + FMP + Finnhub</p>
              </div>
              {portfolioLoading && <span style={{ fontSize: 12, color: "#787b86" }}>Hämtar fundamentaldata...</span>}
            </div>
            <table>
              <thead>
                <tr>
                  {["", "Ticker", "Company", "Sector", "Pris", "Mkt Cap", "EBITDA Margin", "P/E Fwd", "ROIC", "Stake", "Upside", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: ["","Ticker","Company","Sector","Status"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO.map(co => {
                  const live = portfolioData[co.ticker];
                  const ebitda = live?.ebitdaMargin ?? 0;
                  const pe = live?.peForward ?? 0;
                  const roic = live?.roic ?? 0;
                  return (
                    <>
                      <tr key={co.ticker} onClick={() => setSelected(selected === co.ticker ? null : co.ticker)}
                        style={{ cursor: "pointer", background: selected === co.ticker ? "#f0f3ff" : "transparent" }}>
                        <td style={{ padding: "10px 10px", fontSize: 16 }}>{co.flag}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 500, color: "#2962ff" }} className="mono">{co.ticker}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 500 }}>{co.name}</td>
                        <td style={{ padding: "10px 10px", color: "#787b86" }}>{co.sector}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }} className="mono">
                          {live?.price ? `${live.price.toFixed(2)} ${live.currency}` : "—"}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }} className="mono">
                          {live?.marketCap ? `${live.marketCap}B` : "—"}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }}>
                          <MiniBar value={ebitda} peer={co.peerMedianMargin} max={35} />
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }} className="mono">
                          {pe ? <><span>{pe.toFixed(1)}x</span><span style={{ color: "#b2b5be", margin: "0 4px" }}>/</span><span style={{ color: "#089981" }}>{co.peerPE}x</span></> : "—"}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", color: roic > 12 ? "#089981" : "#131722" }} className="mono">{roic ? `${roic}%` : "—"}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }} className="mono">{co.stake}%</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", color: co.upside > 40 ? "#089981" : "#131722", fontWeight: 500 }} className="mono">+{co.upside}%</td>
                        <td style={{ padding: "10px 10px" }}><Pill text={co.status} green={co.status === "Active"} /></td>
                      </tr>
                      {selected === co.ticker && live && (
                        <tr key={`${co.ticker}-detail`}>
                          <td colSpan={12} style={{ padding: "0 10px 16px", background: "#f8f9ff", borderBottom: "1px solid #e0e3eb" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, paddingTop: 12 }}>
                              {[
                                { label: "EBITDA Margin", value: fmt(live.ebitdaMargin, "%"), sub: `Peer ${co.peerMedianMargin}%`, neg: live.ebitdaMargin < co.peerMedianMargin },
                                { label: "Operating Margin", value: fmt(live.operatingMargin, "%"), sub: "TTM" },
                                { label: "Revenue Growth", value: fmt(live.revenueGrowth, "%"), sub: "YoY", neg: live.revenueGrowth < 0 },
                                { label: "ROIC / ROE", value: fmt(live.roic, "%"), sub: "TTM" },
                                { label: "Analyst Target", value: live.targetPrice ? `${live.targetPrice.toFixed(2)} ${live.currency}` : "—", sub: live.recommendation?.toUpperCase() ?? "—" },
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
                                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "8px 0", borderBottom: "1px solid #f0f3fa", textDecoration: "none", color: "#131722" }}>
                                    <span style={{ fontSize: 12 }}>{n.headline}</span>
                                    <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 12 }}>{n.source}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: "#b2b5be", marginTop: 8 }}>
                              Datakällor: {live.sources?.fundamentals} · {live.sources?.news}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* GAP ANALYSIS */}
        {tab === "analysis" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 500 }}>Gap Analysis</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>EBITDA-margingap och värderingsgap vs sektormedianer</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                { title: "EBITDA Margin vs Peer Median", dataKey: "ebitdaMargin", peerKey: "peerMedianMargin", max: 35, unit: "%" },
                { title: "P/E Forward vs Peer Median", dataKey: "peForward", peerKey: "peerPE", max: 30, unit: "x" },
              ].map(chart => (
                <div key={chart.title} style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16 }}>{chart.title}</div>
                  {PORTFOLIO.map(co => {
                    const live = portfolioData[co.ticker];
                    const val = live?.[chart.dataKey] ?? 0;
                    const peer = co[chart.peerKey];
                    const vPct = (val / chart.max) * 100;
                    const pPct = (peer / chart.max) * 100;
                    return (
                      <div key={co.ticker} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 500 }}>{co.flag} {co.name}</span>
                          <span style={{ fontSize: 11, color: "#787b86" }} className="mono">
                            {val ? <span style={{ color: val < peer ? "#f23645" : "#089981" }}>{val}{chart.unit}</span> : <span style={{ color: "#b2b5be" }}>—</span>}
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
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16 }}>Uppsiderankning · 3-årshorisont</div>
              <table>
                <thead>
                  <tr>
                    {["#", "", "Bolag", "Margingap", "PE-rabatt", "Uppskattad uppsida"].map(h => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: ["#","","Bolag"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...PORTFOLIO].sort((a, b) => b.upside - a.upside).map((co, i) => (
                    <tr key={co.ticker}>
                      <td style={{ padding: "8px 10px", color: "#b2b5be" }} className="mono">{i + 1}</td>
                      <td style={{ padding: "8px 10px" }}>{co.flag}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{co.name}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#f23645" }} className="mono">
                        {portfolioData[co.ticker]?.ebitdaMargin ? `${(portfolioData[co.ticker].ebitdaMargin - co.peerMedianMargin).toFixed(1)}pp` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#f23645" }} className="mono">
                        {portfolioData[co.ticker]?.peForward ? `${(((portfolioData[co.ticker].peForward / co.peerPE) - 1) * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                          <div style={{ width: 80, height: 4, background: "#f0f3fa", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${(co.upside / 55) * 100}%`, background: "#089981", borderRadius: 2 }} />
                          </div>
                          <span style={{ color: "#089981", fontWeight: 500, minWidth: 40, textAlign: "right" }} className="mono">+{co.upside}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPANY SEARCH */}
        {tab === "search" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 500 }}>Company Search</h1>
              <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>Sök på valfritt ticker — svenska (.ST), brittiska (.L), amerikanska (ingen suffix)</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input
                value={searchTicker}
                onChange={e => setSearchTicker(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="T.ex. ERIC-B.ST, AAPL, PSON.L, VOLV-B.ST"
                style={{ flex: 1, padding: "9px 14px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, outline: "none", fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <button onClick={handleSearch} disabled={searchLoading} style={{
                padding: "9px 20px", background: "#2962ff", color: "#fff", border: "none",
                borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit"
              }}>
                {searchLoading ? "Söker..." : "Sök"}
              </button>
            </div>

            {searchError && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", marginBottom: 16 }}>Fel: {searchError}</div>}

            {searchResult && (
              <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{searchResult.sector} · {searchResult.industry}</div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>{searchResult.name} <span style={{ fontSize: 14, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>{searchResult.ticker}</span></div>
                  <div style={{ fontSize: 20, fontWeight: 300, marginTop: 4 }} className="mono">{searchResult.price?.toFixed(2)} <span style={{ fontSize: 13, color: "#787b86" }}>{searchResult.currency}</span></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Market Cap", value: searchResult.marketCap ? `${searchResult.marketCap}B` : "—" },
                    { label: "P/E Forward", value: fmt(searchResult.peForward, "x") },
                    { label: "P/E Trailing", value: fmt(searchResult.peTrailing, "x") },
                    { label: "EBITDA Margin", value: fmt(searchResult.ebitdaMargin, "%") },
                    { label: "Operating Margin", value: fmt(searchResult.operatingMargin, "%") },
                    { label: "Gross Margin", value: fmt(searchResult.grossMargin, "%") },
                    { label: "ROIC / ROE", value: fmt(searchResult.roic, "%") },
                    { label: "Net Debt/EBITDA", value: fmt(searchResult.debtEbitda, "x") },
                    { label: "Revenue Growth", value: fmt(searchResult.revenueGrowth, "%") },
                    { label: "Analyst Target", value: searchResult.targetPrice ? `${searchResult.targetPrice.toFixed(2)} ${searchResult.currency}` : "—" },
                    { label: "Recommendation", value: searchResult.recommendation?.toUpperCase() ?? "—" },
                    { label: "Datakällor", value: searchResult.sources?.fundamentals ?? "—" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#f8f9fd", borderRadius: 4, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }} className="mono">{m.value}</div>
                    </div>
                  ))}
                </div>

                {searchResult.news?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Senaste nyheter · Finnhub</div>
                    {searchResult.news.map((n, i) => (
                      <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f3fa", textDecoration: "none", color: "#131722" }}>
                        <span style={{ fontSize: 12 }}>{n.headline}</span>
                        <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 16, whiteSpace: "nowrap" }}>{n.source}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
