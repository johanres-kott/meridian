import { useState, useEffect } from "react";
import { sanitizeInput } from "../lib/sanitize.js";
import { searchStocks, searchFunds } from "../lib/apiClient.js";

export default function AddCompanyBar({ onAdd, isMobile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("stock"); // "stock" | "fund"

  useEffect(() => {
    const sanitized = sanitizeInput(query);
    if (sanitized.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      if (mode === "fund") {
        const data = await searchFunds(sanitized, 8);
        setResults(data);
      } else {
        const data = await searchStocks(sanitized, 6);
        setResults(data);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, mode]);

  function select(r) {
    if (mode === "fund") {
      onAdd({ ticker: r.secId, name: r.legalName || r.name, type: "fund" });
    } else {
      const ticker = (r.symbol || r.ticker || "").replace(/ /g, "-");
      onAdd({ ticker, name: r.description || r.name });
    }
    setQuery("");
    setResults([]);
  }

  const toggleStyle = (active) => ({
    padding: "5px 12px",
    fontSize: 11,
    fontFamily: "inherit",
    fontWeight: active ? 600 : 400,
    border: "1px solid var(--border)",
    borderRadius: 4,
    cursor: "pointer",
    background: active ? "var(--accent)" : "var(--bg-card)",
    color: active ? "#fff" : "var(--text-secondary)",
  });

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
        <button style={toggleStyle(mode === "stock")} onClick={() => { setMode("stock"); setQuery(""); setResults([]); }}>Aktier</button>
        <button style={toggleStyle(mode === "fund")} onClick={() => { setMode("fund"); setQuery(""); setResults([]); }}>Fonder</button>
      </div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={mode === "fund" ? "Sök fond — t.ex. SEB, Handelsbanken, Avanza..." : "Lägg till bolag — sök på namn eller ticker..."}
        style={{ width: "100%", maxWidth: isMobile ? "100%" : undefined, boxSizing: isMobile ? "border-box" : undefined, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", color: "var(--text)", background: "var(--bg-card)" }}
      />
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, marginTop: 4, maxHeight: 320, overflowY: "auto" }}>
          {results.map(r => {
            if (mode === "fund") {
              return (
                <div key={r.secId} onClick={() => select(r)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-light)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 500, color: "var(--text)", fontSize: 13 }}>{r.legalName || r.name}</span>
                    {r.starRating && (
                      <span style={{ fontSize: 11, color: "#f5a623" }}>{"★".repeat(r.starRating)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, display: "flex", gap: 12 }}>
                    <span>{r.category}</span>
                    {r.ongoingCharge != null && <span>Avgift: {r.ongoingCharge.toFixed(2)}%</span>}
                    {r.returnM12 != null && <span>1 år: {r.returnM12 > 0 ? "+" : ""}{r.returnM12.toFixed(1)}%</span>}
                  </div>
                </div>
              );
            }
            return (
              <div key={r.symbol || r.ticker} onClick={() => select(r)}
                style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}
              >
                <span style={{ fontWeight: 500, color: "var(--text)" }}>{r.description || r.name}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>{r.symbol || r.ticker}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
