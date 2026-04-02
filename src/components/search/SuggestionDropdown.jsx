export default function SuggestionDropdown({ suggestions, enriched, enrichRef, onSelect }) {
  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 48,
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, marginTop: 4,
    }}>
      {suggestions.map(s => {
        const key = s.ticker.replace(/ /g, "-");
        const e = enriched[key];
        const changeColor = e ? (e.changePercent >= 0 ? "#089981" : "#f23645") : "var(--text-secondary)";
        return (
          <div
            key={s.ticker}
            onClick={() => onSelect(s)}
            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-light)" }}
            onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
          >
            {/* Top row: name, exchange, ticker */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>{s.exchange}</span>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--accent)", flexShrink: 0, marginLeft: 8 }}>{s.ticker}</span>
            </div>
            {/* Bottom row: enriched data */}
            {e ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                  {e.price?.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>{e.currency}</span>
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 500, color: changeColor }}>
                  {e.changePercent >= 0 ? "+" : ""}{e.changePercent?.toFixed(2)}%
                </span>
                {e.sector && e.sector !== "\u2014" && (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--border-light)", color: "var(--text-secondary)" }}>{e.sector}</span>
                )}
                {e.peForward > 0 && (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--border-light)", color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>P/E {e.peForward}x</span>
                )}
                {e.marketCap > 0 && (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--border-light)", color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>MCap {e.marketCap}B</span>
                )}
              </div>
            ) : (
              enrichRef.current > 0 && (
                <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>Laddar...</div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
