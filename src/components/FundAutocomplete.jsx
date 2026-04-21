import { useState, useRef, useEffect, useMemo } from "react";
import { searchFunds } from "../lib/apiClient.js";
import { useItpFunds } from "../hooks/useItpFunds.js";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

/**
 * Autocomplete input that searches for funds.
 * If `providerName` is provided, searches that provider's ITP fund list (from
 * Supabase itp_funds) first — instant, no API round-trip. Falls back to the
 * Morningstar API if fewer than 3 local matches.
 *
 * Props:
 *   value          – current fund name string
 *   onChange       – (fundObj) => void, called with { name, fee, secId, category, indexFund }
 *   onChangeName   – (string) => void, fallback for plain text changes
 *   placeholder    – input placeholder
 *   style          – extra style for the wrapper
 *   providerName   – (optional) ITP provider name to constrain search
 */
export default function FundAutocomplete({ value, onChange, onChangeName, placeholder, style, providerName }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  const { funds: itpFunds } = useItpFunds(providerName);

  // Normalize ITP funds into the same shape as Morningstar results for rendering.
  const itpPool = useMemo(
    () => itpFunds.map(f => ({
      secId: f.sec_id || f.isin,
      name: f.name,
      ongoingCharge: f.ongoing_charge,
      starRating: f.star_rating,
      category: f.advisor, // show fund company as the secondary line
      indexFund: false,
      _source: "itp",
    })),
    [itpFunds]
  );

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function localMatch(q) {
    const needle = q.toLowerCase();
    return itpPool.filter(f => f.name?.toLowerCase().includes(needle)).slice(0, 8);
  }

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    onChangeName?.(val);

    clearTimeout(timerRef.current);
    if (val.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Instant local hit from ITP fund list.
    const local = itpPool.length ? localMatch(val) : [];
    if (local.length > 0) {
      setResults(local);
      setOpen(true);
    }

    // If ITP pool gave us enough, skip Morningstar (saves a round-trip).
    if (local.length >= 3) {
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const remote = await searchFunds(val, 6);
      // Merge: ITP matches first (tagged), then Morningstar, deduped by secId/name.
      const seen = new Set(local.map(f => f.secId || f.name));
      const merged = [...local];
      for (const f of remote) {
        const k = f.secId || f.name;
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push({ ...f, _source: "morningstar" });
      }
      setResults(merged);
      setOpen(merged.length > 0);
      setLoading(false);
    }, 300);
  }

  function select(fund) {
    setQuery(fund.name);
    setOpen(false);
    onChange?.({
      name: fund.name,
      fee: fund.ongoingCharge != null ? Number(fund.ongoingCharge.toFixed(2)) : null,
      secId: fund.secId,
      category: fund.category,
      indexFund: fund.indexFund || false,
    });
  }

  const inputStyle = {
    padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4,
    fontSize: 13, fontFamily: "inherit", background: "var(--bg-card)", color: "var(--text)",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", ...style }}>
      <input
        value={query}
        onChange={handleInput}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={placeholder || "Sök fond..."}
        style={inputStyle}
      />
      {loading && (
        <div style={{ position: "absolute", right: 8, top: 8, fontSize: 11, color: "var(--text-muted)" }}>...</div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 6px 6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto",
        }}>
          {results.map((fund, i) => (
            <button
              key={(fund.secId || fund.name) + i}
              onClick={() => select(fund)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                border: "none", borderBottom: "1px solid var(--border-light)",
                background: "none", cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{fund.name}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                {fund._source === "itp" && (
                  <span style={{ fontSize: 9, padding: "0 4px", borderRadius: 2, background: "rgba(33,150,243,0.12)", color: "#1976d2", fontWeight: 500 }}>
                    ITP
                  </span>
                )}
                {fund.category && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{fund.category}</span>
                )}
                {fund.ongoingCharge != null && (
                  <span style={{ fontSize: 10, color: fund.ongoingCharge <= 0.3 ? "#089981" : "var(--text-muted)", ...mono }}>
                    avg. {fund.ongoingCharge.toFixed(2)}%
                  </span>
                )}
                {fund.starRating > 0 && (
                  <span style={{ fontSize: 10, color: "#ff9800" }}>{"★".repeat(fund.starRating)}</span>
                )}
                {fund.indexFund && (
                  <span style={{ fontSize: 9, padding: "0 4px", borderRadius: 2, background: "rgba(33,150,243,0.12)", color: "#1976d2", fontWeight: 500 }}>Index</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
