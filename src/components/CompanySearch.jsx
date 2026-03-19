import { useState, useCallback, useRef } from "react";
import { fmt } from "./shared.js"
import { StatCard } from "./SharedComponents.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function CompanySearch() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Name search via Finnhub symbol lookup
  const searchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setSuggestLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      const results = (d.result ?? [])
        .filter(s => s.type === "Common Stock" || s.type === "EQS")
        .slice(0, 8)
        .map(s => ({ ticker: s.symbol, name: s.description, exchange: s.displaySymbol }));
      setSuggestions(results);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSuggestions(val), 300);
  };

  const fetchCompany = useCallback(async (ticker) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);
    try {
      const r = await fetch(`/api/company?ticker=${ticker}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSuggestion = (s) => {
    const normalized = s.ticker.replace(/ /g, "-");
    setQuery(normalized);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchCompany(normalized);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      fetchCompany(query.trim().toUpperCase());
    }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Company Search</h1>
        <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
          Sök på bolagsnamn eller ticker — t.ex. "Ericsson", "Volvo", "Apple"
        </p>
      </div>

      {/* Search box */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder='Sök bolag — "Ericsson B", "Volvo", "AAPL"...'
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid #e0e3eb",
                borderRadius: 4, fontSize: 13, outline: "none",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            />
            {suggestLoading && (
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#787b86" }}>
                Söker...
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowSuggestions(false); fetchCompany(query.trim().toUpperCase()); }}
            disabled={loading}
            style={{ padding: "10px 20px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}
          >
            {loading ? "Söker..." : "Sök"}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 48,
            background: "#fff", border: "1px solid #e0e3eb", borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, marginTop: 4,
          }}>
            {suggestions.map(s => (
              <div
                key={s.ticker}
                onClick={() => selectSuggestion(s)}
                style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f3fa" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8f9fd"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "#787b86", marginLeft: 8 }}>{s.exchange}</span>
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#2962ff" }}>{s.ticker}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", marginBottom: 16 }}>
          Fel: {error}
        </div>
      )}

      {result && (
        <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, padding: isMobile ? 12 : 24 }}>
          {/* Header */}
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {result.sector}{result.industry !== "—" ? ` · ${result.industry}` : ""}
              </div>
              <div style={{ fontSize: 22, fontWeight: 500 }}>
                {result.name}
                <span style={{ fontSize: 14, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{result.ticker}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 300, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                {result.price?.toFixed(2)}
                <span style={{ fontSize: 13, color: "#787b86", marginLeft: 8 }}>{result.currency}</span>
                {result.marketCap > 0 && <span style={{ fontSize: 13, color: "#787b86", marginLeft: 16 }}>Mkt Cap: {result.marketCap}B {result.currency}</span>}
              </div>
            </div>
            {result.week52High > 0 && (
              <div style={{ textAlign: "right", fontSize: 12, color: "#787b86" }}>
                <div>52v Högt: <span style={{ color: "#089981", fontFamily: "'IBM Plex Mono', monospace" }}>{result.week52High.toFixed(2)} {result.currency}</span></div>
                <div style={{ marginTop: 4 }}>52v Lågt: <span style={{ color: "#f23645", fontFamily: "'IBM Plex Mono', monospace" }}>{result.week52Low.toFixed(2)} {result.currency}</span></div>
              </div>
            )}
          </div>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            <StatCard label="P/E Forward" value={fmt(result.peForward, "x")} />
            <StatCard label="P/E Trailing" value={fmt(result.peTrailing, "x")} />
            <StatCard label="EBITDA Margin" value={fmt(result.ebitdaMargin, "%")} neg={result.ebitdaMargin < 0} />
            <StatCard label="Operating Margin" value={fmt(result.operatingMargin, "%")} neg={result.operatingMargin < 0} />
            <StatCard label="Gross Margin" value={fmt(result.grossMargin, "%")} />
            <StatCard label="ROIC / ROE" value={fmt(result.roic, "%")} neg={result.roic < 0} />
            <StatCard label="Net Debt/EBITDA" value={fmt(result.debtEbitda, "x")} neg={result.debtEbitda > 3} />
            <StatCard label="Revenue Growth" value={fmt(result.revenueGrowth, "%")} neg={result.revenueGrowth < 0} />
          </div>

          {/* Analyst */}
          {(result.targetPrice > 0 || result.recommendation !== "—") && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {result.targetPrice > 0 && (
                <div style={{ flex: 1, border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>Analytikernas kursmål</div>
                  <div style={{ fontSize: 18, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                    {result.targetPrice.toFixed(2)} {result.currency}
                  </div>
                  {result.price > 0 && (
                    <div style={{ fontSize: 11, color: "#787b86", marginTop: 4 }}>
                      Uppsida: <span style={{ color: result.targetPrice > result.price ? "#089981" : "#f23645" }}>
                        {(((result.targetPrice / result.price) - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              {result.recommendation !== "—" && (
                <div style={{ flex: 1, border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>Rekommendation</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: result.recommendation?.includes("buy") ? "#089981" : result.recommendation?.includes("sell") ? "#f23645" : "#131722", textTransform: "uppercase" }}>
                    {result.recommendation}
                  </div>
                </div>
              )}
              <div style={{ flex: 1, border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>Datakällor</div>
                <div style={{ fontSize: 12, color: "#131722" }}>{result.sources?.fundamentals}</div>
                <div style={{ fontSize: 11, color: "#b2b5be", marginTop: 2 }}>Nyheter: {result.sources?.news}</div>
              </div>
            </div>
          )}

          {/* News */}
          {result.news?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#787b86", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Senaste nyheter</div>
              {result.news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f3fa", textDecoration: "none", color: "#131722" }}>
                  <span style={{ fontSize: 12 }}>{n.headline}</span>
                  <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 16, whiteSpace: "nowrap" }}>{n.source}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
