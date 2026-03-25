import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../supabase.js";
import { fmt } from "./shared.js"
import { StatCard, PriceChart } from "./SharedComponents.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { matchStock, getRisk, riskLabel, betaDescription, isInvestmentCompany } from "../lib/profileMatcher.js";

const PROFILE_LABELS = { value: "värdeinvesterare", growth: "tillväxtinvesterare", dividend: "utdelningsinvesterare", mixed: "blandat", index: "indexinvesterare" };

function ScoreBar({ label, value }) {
  if (value == null) return null;
  const color = value >= 70 ? "#089981" : value >= 40 ? "#ff9800" : "#f23645";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
      <span style={{ width: 90, color: "#787b86", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#f0f3fa", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ width: 28, textAlign: "right", fontWeight: 500, color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{Math.round(value)}</span>
    </div>
  );
}

export default function CompanySearch({ deepLink, onClearDeepLink, preferences = {} }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enriched, setEnriched] = useState({});
  const [added, setAdded] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const debounceRef = useRef(null);
  const enrichRef = useRef(0);

  // Fetch enriched data for top N suggestion tickers in parallel
  const enrichSuggestions = useCallback(async (tickers) => {
    const batch = ++enrichRef.current;
    const top = tickers.slice(0, 4);
    const results = await Promise.allSettled(
      top.map(t =>
        fetch(`/api/company?ticker=${encodeURIComponent(t)}`)
          .then(r => r.json())
          .then(d => d.error ? null : d)
      )
    );
    if (enrichRef.current !== batch) return; // stale
    const map = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) map[top[i]] = r.value;
    });
    setEnriched(prev => ({ ...prev, ...map }));
  }, []);

  // Name search via Finnhub symbol lookup
  const searchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); setEnriched({}); return; }
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
      // Auto-enrich top results
      const tickers = results.map(s => s.ticker.replace(/ /g, "-"));
      enrichSuggestions(tickers);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, [enrichSuggestions]);

  // Handle deep link from other pages
  useEffect(() => {
    if (deepLink?.ticker) {
      const ticker = deepLink.ticker;
      setQuery(ticker);
      fetchCompany(ticker);
      onClearDeepLink?.();
    }
  }, [deepLink]);

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
    setAdded(false);
    setShowSuggestions(false);
    try {
      const r = await fetch(`/api/company?ticker=${ticker}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
      // Fetch score data
      setScoreData(null);
      fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`).then(r => r.json()).then(s => { if (s) setScoreData(s); }).catch(() => {});
      // Check if already in portfolio
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("watchlist").select("id").eq("user_id", user.id).eq("ticker", ticker).limit(1);
        if (data?.length > 0) setAdded(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function addToPortfolio() {
    if (!result) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("watchlist").insert({
      ticker: result.ticker, name: result.name, user_id: user.id, status: "Bevakar",
    });
    if (!err) setAdded(true);
  }

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
            {suggestions.map(s => {
              const key = s.ticker.replace(/ /g, "-");
              const e = enriched[key];
              const changeColor = e ? (e.changePercent >= 0 ? "#089981" : "#f23645") : "#787b86";
              return (
                <div
                  key={s.ticker}
                  onClick={() => selectSuggestion(s)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f3fa" }}
                  onMouseEnter={ev => ev.currentTarget.style.background = "#f8f9fd"}
                  onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                >
                  {/* Top row: name, exchange, ticker */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: "#787b86", marginLeft: 8 }}>{s.exchange}</span>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#2962ff", flexShrink: 0, marginLeft: 8 }}>{s.ticker}</span>
                  </div>
                  {/* Bottom row: enriched data */}
                  {e ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: "#131722" }}>
                        {e.price?.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400, color: "#787b86" }}>{e.currency}</span>
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 500, color: changeColor }}>
                        {e.changePercent >= 0 ? "+" : ""}{e.changePercent?.toFixed(2)}%
                      </span>
                      {e.sector && e.sector !== "—" && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f0f3fa", color: "#787b86" }}>{e.sector}</span>
                      )}
                      {e.peForward > 0 && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f0f3fa", color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>P/E {e.peForward}x</span>
                      )}
                      {e.marketCap > 0 && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f0f3fa", color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>MCap {e.marketCap}B</span>
                      )}
                    </div>
                  ) : (
                    enrichRef.current > 0 && (
                      <div style={{ marginTop: 4, fontSize: 10, color: "#b2b5be" }}>Laddar...</div>
                    )
                  )}
                </div>
              );
            })}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {added ? (
                <span style={{ fontSize: 12, color: "#089981", fontWeight: 500 }}>✓ I din portfölj</span>
              ) : (
                <button onClick={addToPortfolio}
                  style={{ padding: "7px 16px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500 }}>
                  + Lägg till i portfölj
                </button>
              )}
              {result.week52High > 0 && (
                <div style={{ textAlign: "right", fontSize: 12, color: "#787b86" }}>
                  <span>52v: <span style={{ color: "#f23645" }}>{result.week52Low?.toFixed(0)}</span> – <span style={{ color: "#089981" }}>{result.week52High.toFixed(0)}</span> {result.currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            <StatCard label="P/E Forward" value={fmt(result.peForward, "x")} tooltip="Aktiekurs delat med förväntad vinst per aktie kommande 12 mån. Lägre = billigare." />
            <StatCard label="P/E Trailing" value={fmt(result.peTrailing, "x")} tooltip="Aktiekurs delat med vinst per aktie senaste 12 mån. Lägre = billigare." />
            <StatCard label="EBITDA-marginal" value={fmt(result.ebitdaMargin, "%")} neg={result.ebitdaMargin < 0} tooltip="Vinst före räntor, skatt och avskrivningar som andel av omsättningen." />
            <StatCard label="Rör.marginal" value={fmt(result.operatingMargin, "%")} neg={result.operatingMargin < 0} tooltip="Rörelseresultat delat med omsättning. Visar hur mycket som blir vinst." />
            <StatCard label="Bruttomarginal" value={fmt(result.grossMargin, "%")} tooltip="Omsättning minus varukostnad, delat med omsättning. Högre = bättre." />
            <StatCard label="ROIC / ROE" value={fmt(result.roic, "%")} neg={result.roic < 0} tooltip="Avkastning på investerat kapital. Visar hur effektivt bolaget använder sina pengar." />
            <StatCard label="Nettoskuld/EBITDA" value={fmt(result.debtEbitda, "x")} neg={result.debtEbitda > 3} tooltip="Nettoskuld delat med EBITDA. Över 3x anses högt belånat." />
            <StatCard label="Tillväxt" value={fmt(result.revenueGrowth, "%")} neg={result.revenueGrowth < 0} tooltip="Omsättningstillväxt jämfört med föregående år (YoY)." />
          </div>

          {/* Profile insight + Chart */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {preferences.investorProfile && (() => {
              const profile = preferences.investorProfile;
              const companyData = { beta: result.beta, dividendYield: result.dividendYield, revenueGrowth: result.revenueGrowth, marketCap: result.marketCap };
              const { tags, warnings, score } = matchStock(result.ticker, profile, companyData);
              const risk = getRisk(result.beta, result.marketCap, result.ticker);
              const items = [];
              if (risk) {
                const rc = risk === "low" ? "#089981" : risk === "medium" ? "#ff9800" : "#f23645";
                items.push({ icon: "◉", color: rc, text: isInvestmentCompany(result.ticker) ? `${riskLabel(risk)} — diversifierat investmentbolag` : result.beta != null ? betaDescription(result.beta) : `${riskLabel(risk)} (baserat på börsvärde)` });
              }
              if (result.dividendYield > 0) items.push({ icon: "💰", color: "#089981", text: `Direktavkastning ${result.dividendYield.toFixed(1)}%` });
              else items.push({ icon: "–", color: "#787b86", text: "Ingen utdelning" });
              tags.forEach(t => items.push({ icon: "✓", color: "#089981", text: t }));
              warnings.forEach(w => items.push({ icon: "⚠", color: "#e65100", text: w }));
              return (
                <div style={{ border: "1px solid #e0e3eb", borderRadius: 6, padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>Din profil & detta bolag</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ color: it.color, fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{it.icon}</span>
                        <span style={{ color: "#131722" }}>{it.text}</span>
                      </div>
                    ))}
                  </div>
                  {scoreData?.scores && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f0f3fa" }}>
                      <div style={{ fontSize: 10, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>Vår analys</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <ScoreBar label="Piotroski" value={scoreData.scores.piotroski?.normalized} />
                        <ScoreBar label="Magic Formula" value={scoreData.scores.magicFormula} />
                        <ScoreBar label="Tillväxt" value={scoreData.scores.growth} />
                        <ScoreBar label="Utdelning" value={scoreData.scores.dividend} />
                        <ScoreBar label="Kvalitet" value={scoreData.scores.quality} />
                      </div>
                      {scoreData.composite && (() => {
                        const profileType = profile?.investorType || "mixed";
                        const compositeScore = scoreData.composite[profileType] ?? scoreData.composite.mixed;
                        if (compositeScore == null) return null;
                        const color = compositeScore >= 70 ? "#089981" : compositeScore >= 40 ? "#ff9800" : "#f23645";
                        return (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(compositeScore)}</span>
                            <span style={{ fontSize: 11, color: "#787b86" }}>/ 100 — totalpoäng för {PROFILE_LABELS[profileType] || profileType}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div style={{ marginTop: 10, padding: "8px 10px", background: score >= 60 ? "#e8f5e9" : score >= 40 ? "#fff8e1" : "#fff5f5", borderRadius: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: score >= 60 ? "#089981" : score >= 40 ? "#e65100" : "#c62828" }}>
                      {score >= 60 ? "Matchar din profil" : score >= 40 ? "Delvis matchning" : "Avviker från din profil"}
                    </div>
                  </div>
                </div>
              );
            })()}
            <PriceChart ticker={result.ticker} />
          </div>

          {/* Analyst */}
          {(result.targetPrice > 0 || result.recommendation !== "—") && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {result.targetPrice > 0 && (
                <div style={{ flex: 1, minWidth: 160, border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>Kursmål (snitt)</div>
                  <div style={{ fontSize: 18, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                    {result.targetPrice.toFixed(2)} {result.currency}
                  </div>
                  {result.targetLow > 0 && result.targetHigh > 0 && (
                    <div style={{ fontSize: 10, color: "#787b86", marginTop: 4 }}>
                      Spann: {result.targetLow.toFixed(0)} – {result.targetHigh.toFixed(0)} {result.currency}
                    </div>
                  )}
                  {result.price > 0 && (
                    <div style={{ fontSize: 11, color: "#787b86", marginTop: 4 }}>
                      Uppsida: <span style={{ color: result.targetPrice > result.price ? "#089981" : "#f23645" }}>
                        {(((result.targetPrice / result.price) - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {result.numberOfAnalysts > 0 && (
                    <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 6 }}>
                      {result.numberOfAnalysts} analytiker · Yahoo Finance
                    </div>
                  )}
                </div>
              )}
              {result.recommendation !== "—" && (
                <div style={{ flex: 1, minWidth: 160, border: "1px solid #e0e3eb", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>Rekommendation</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: result.recommendation?.includes("buy") ? "#089981" : result.recommendation?.includes("sell") ? "#f23645" : "#131722", textTransform: "uppercase" }}>
                    {result.recommendation}
                  </div>
                  {result.numberOfAnalysts > 0 && (
                    <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 6 }}>
                      {result.numberOfAnalysts} analytiker · Yahoo Finance consensus
                    </div>
                  )}
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
