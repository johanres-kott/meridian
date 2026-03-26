import { PriceChart } from "./SharedComponents.jsx";
import { Chg } from "./SharedComponents.jsx";

export default function MarketDetailView({ item, onBack, isMobile }) {
  const name = item.name;
  const symbol = item.display || item.symbol;
  const yahooSymbol = item.yahooSymbol;
  const conv = item.conv || 1;
  const unit = item.unit || item.currency || "";
  const price = item.price;
  const change = item.change;
  const high = item.high;
  const low = item.low;

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: isMobile ? 12 : 20 }}>
        <button onClick={onBack}
          style={{ fontSize: isMobile ? 11 : 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: isMobile ? 8 : 12 }}>
          &larr; Tillbaka till marknader
        </button>

        <div>
          <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 500, color: "var(--text)" }}>
            {name}
            <span style={{ fontSize: isMobile ? 11 : 13, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", marginLeft: isMobile ? 6 : 10 }}>{symbol}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 8 : 12, marginTop: isMobile ? 4 : 8 }}>
          <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
            {price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span style={{ fontSize: isMobile ? 11 : 13, color: "var(--text-secondary)" }}>{unit}</span>
          {change != null && (
            <span style={{ fontSize: isMobile ? 12 : 14, fontFamily: "'IBM Plex Mono', monospace" }}>
              <Chg value={change} />
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ maxWidth: 800 }}>
        <PriceChart
          ticker={symbol}
          yahooSymbol={yahooSymbol}
          conv={conv}
          label={name}
        />
      </div>

      {/* Day stats */}
      {(high > 0 || low > 0) && (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 24, marginTop: isMobile ? 12 : 20 }}>
          {high > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? "12px 14px" : "16px 20px", minWidth: isMobile ? undefined : 140 }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)", marginBottom: isMobile ? 4 : 6 }}>Dagens hogsta</div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
                {high.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)", marginTop: 2 }}>{unit}</div>
            </div>
          )}
          {low > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? "12px 14px" : "16px 20px", minWidth: isMobile ? undefined : 140 }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)", marginBottom: isMobile ? 4 : 6 }}>Dagens lagsta</div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
                {low.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)", marginTop: 2 }}>{unit}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
