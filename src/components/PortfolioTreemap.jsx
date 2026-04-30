import { Treemap, ResponsiveContainer } from "recharts";

function formatHoldingValue(msek) {
  if (msek >= 1000) {
    const mdkr = msek / 1000;
    return `${mdkr % 1 === 0 ? mdkr.toFixed(0) : mdkr.toFixed(1)} Mdkr`;
  }
  return `${msek.toLocaleString("sv-SE")} Mkr`;
}

// TradingView-stil heatmap-färger: intensitet kodar dagsförändring.
// Tröskelvärden i procent. Mörkare = större rörelse.
const HEAT_BUCKETS = [
  { min: 3,            bg: "#0a6b46", fg: "#ffffff" }, // stark upp
  { min: 1.5,          bg: "#1f8a5b", fg: "#ffffff" },
  { min: 0.5,          bg: "#3da777", fg: "#ffffff" },
  { min: 0.01,         bg: "#5fbc94", fg: "#ffffff" }, // svagt upp
  { min: -0.01,        bg: "#5a6571", fg: "#ffffff" }, // ~oförändrad
  { min: -0.5,         bg: "#d97777", fg: "#ffffff" }, // svagt ner
  { min: -1.5,         bg: "#c84747", fg: "#ffffff" },
  { min: -3,           bg: "#a82828", fg: "#ffffff" },
  { min: -Infinity,    bg: "#7a1414", fg: "#ffffff" }, // stark ner
];

function colorFor(pct) {
  for (const b of HEAT_BUCKETS) if (pct >= b.min) return b;
  return HEAT_BUCKETS[HEAT_BUCKETS.length - 1];
}

function fmtPct(p) {
  if (p == null || !Number.isFinite(p)) return "";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(p >= 10 || p <= -10 ? 1 : 2)}%`;
}

function TreemapCell({ x, y, width, height, name, ticker, valueSek, changePercent }) {
  if (width < 4 || height < 4) return null;
  const { bg, fg } = colorFor(changePercent || 0);
  const showTicker = width > 50 && height > 30;
  const showValue = width > 60 && height > 60;
  const showPct = width > 50 && height > 44;
  const fontSize = Math.max(10, Math.min(14, width / 8));
  const subColor = fg === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)";

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} ry={3}
        style={{ fill: bg, stroke: "rgba(255,255,255,0.5)", strokeWidth: 1.5, cursor: "pointer" }} />
      {showTicker && (
        <text x={x + 6} y={y + 4 + fontSize} fontSize={fontSize} fontWeight={600} fill={fg} fontFamily="inherit">
          {width < 80 ? ticker : name}
        </text>
      )}
      {showPct && (
        <text x={x + 6} y={y + 6 + fontSize * 2.1} fontSize={Math.max(10, fontSize - 1)} fontWeight={600} fill={fg} fontFamily="'IBM Plex Mono', monospace">
          {fmtPct(changePercent)}
        </text>
      )}
      {showValue && (
        <text x={x + 6} y={y + 8 + fontSize * 3.2} fontSize={Math.max(9, fontSize - 2)} fill={subColor} fontFamily="inherit">
          {valueSek >= 1000000
            ? `${(valueSek / 1000000).toFixed(1)} Mkr`
            : `${Math.round(valueSek).toLocaleString("sv-SE")} kr`}
        </text>
      )}
    </g>
  );
}

// Legend-rutor i samma ordning som färgskalan ovan, från stark ner till stark upp.
const LEGEND_STEPS = [
  { bg: "#7a1414", label: "≤ −3%" },
  { bg: "#a82828", label: "−3%" },
  { bg: "#c84747", label: "−1,5%" },
  { bg: "#d97777", label: "−0,5%" },
  { bg: "#5a6571", label: "0%" },
  { bg: "#5fbc94", label: "+0,5%" },
  { bg: "#3da777", label: "+1,5%" },
  { bg: "#1f8a5b", label: "+3%" },
  { bg: "#0a6b46", label: "≥ +3%" },
];

export default function PortfolioTreemap({ items, prices, fxRates, onSelect, isMobile }) {
  const treemapData = items
    .filter(item => item.shares && prices[item.ticker]?.price)
    .map(item => {
      const p = prices[item.ticker];
      const currency = p.currency || "SEK";
      const fx = fxRates[currency] || 1;
      const valueSek = item.shares * p.price * fx;
      return { name: item.name || item.ticker, ticker: item.ticker, valueSek, changePercent: p.changePercent || 0, _item: item };
    })
    .filter(d => d.valueSek > 0)
    .sort((a, b) => b.valueSek - a.valueSek);

  if (treemapData.length < 2) return null;

  const total = treemapData.reduce((s, d) => s + d.valueSek, 0);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary, #131722)" }}>Portföljkarta</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary, #787b86)" }}>
          Totalt: {total >= 1000000
            ? `${(total / 1000000).toFixed(1)} Mkr`
            : `${Math.round(total).toLocaleString("sv-SE")} kr`}
        </div>
      </div>
      <div style={{ border: "1px solid var(--border, #e0e3eb)", borderRadius: 6, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
          <Treemap
            data={treemapData}
            dataKey="valueSek"
            content={<TreemapCell />}
            onClick={(node) => {
              if (node?._item) onSelect(node._item);
            }}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      </div>

      {/* Färgskala-legend: visuellt sammanhängande gradient med tickmarks. */}
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", height: 10, borderRadius: 3, overflow: "hidden" }}>
          {LEGEND_STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, background: s.bg }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary, #787b86)", fontFamily: "'IBM Plex Mono', monospace" }}>
          <span>≤ −3%</span>
          <span>−1,5%</span>
          <span>0%</span>
          <span>+1,5%</span>
          <span>≥ +3%</span>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-secondary, #787b86)", marginTop: 2 }}>
          Färg = dagsförändring · Ruta-storlek = innehavets värde
        </div>
      </div>
    </div>
  );
}

export { formatHoldingValue };
