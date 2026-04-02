import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { sanitizeInput } from "../lib/sanitize.js";
import SuggestionDropdown from "./search/SuggestionDropdown.jsx";
import SearchResultDetail from "./search/SearchResultDetail.jsx";

export default function CompanySearch({ deepLink, onClearDeepLink }) {
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
    const sanitized = sanitizeInput(q);
    if (sanitized.length < 2) { setSuggestions([]); setEnriched({}); return; }
    setSuggestLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(sanitized)}`);
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
    } catch (err) {
      console.error("CompanySearch: suggestion fetch failed:", err);
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
      fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`).then(r => r.json()).then(s => { if (s) setScoreData(s); }).catch(err => { console.error("Failed to fetch score:", err); });
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
      fetchCompany(sanitizeInput(query).toUpperCase());
    }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Company Search</h1>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
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
                width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                borderRadius: 4, fontSize: 13, outline: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {suggestLoading && (
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-secondary)" }}>
                Söker...
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowSuggestions(false); fetchCompany(sanitizeInput(query).toUpperCase()); }}
            disabled={loading}
            style={{ padding: "10px 20px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}
          >
            {loading ? "Söker..." : "Sök"}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <SuggestionDropdown
            suggestions={suggestions}
            enriched={enriched}
            enrichRef={enrichRef}
            onSelect={selectSuggestion}
          />
        )}
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, color: "#f23645", marginBottom: 16 }}>
          Fel: {error}
        </div>
      )}

      {result && (
        <SearchResultDetail
          result={result}
          scoreData={scoreData}
          added={added}
          onAddToPortfolio={addToPortfolio}
        />
      )}
    </div>
  );
}
