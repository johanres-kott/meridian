import { PriceChart } from "./SharedComponents.jsx";
import { Chg } from "./SharedComponents.jsx";

export default function MarketDetailView({ item, onBack }) {
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
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}>
          &larr; Tillbaka till marknader
        </button>

        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#131722" }}>
            {name}
            <span style={{ fontSize: 13, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{symbol}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
            {price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span style={{ fontSize: 13, color: "#787b86" }}>{unit}</span>
          {change != null && (
            <span style={{ fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>
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
        <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
          {high > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px", minWidth: 140 }}>
              <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Dagens hogsta</div>
              <div style={{ fontSize: 16, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
                {high.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
              <div style={{ fontSize: 11, color: "#787b86", marginTop: 2 }}>{unit}</div>
            </div>
          )}
          {low > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px", minWidth: 140 }}>
              <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Dagens lagsta</div>
              <div style={{ fontSize: 16, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
                {low.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
              <div style={{ fontSize: 11, color: "#787b86", marginTop: 2 }}>{unit}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
