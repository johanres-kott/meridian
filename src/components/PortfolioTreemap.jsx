import { Treemap, ResponsiveContainer } from "recharts";

function formatHoldingValue(msek) {
  if (msek >= 1000) {
    const mdkr = msek / 1000;
    return `${mdkr % 1 === 0 ? mdkr.toFixed(0) : mdkr.toFixed(1)} Mdkr`;
  }
  return `${msek.toLocaleString("sv-SE")} Mkr`;
}

function TreemapCell({ x, y, width, height, name, ticker, valueSek, changePercent }) {
  if (width < 4 || height < 4) return null;
  const bg = changePercent > 0 ? "#089981" : changePercent < 0 ? "#f23645" : "#42a5f5";
  const showTicker = width > 50 && height > 30;
  const showValue = width > 60 && height > 44;
  const fontSize = Math.max(10, Math.min(14, width / 8));
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} ry={3}
        style={{ fill: bg, stroke: "#fff", strokeWidth: 2, cursor: "pointer" }} />
      {showTicker && (
        <text x={x + 6} y={y + 4 + fontSize} fontSize={fontSize} fontWeight={600} fill="#fff" fontFamily="inherit">
          {width < 80 ? ticker : name}
        </text>
      )}
      {showValue && (
        <text x={x + 6} y={y + 6 + fontSize * 2.1} fontSize={Math.max(9, fontSize - 2)} fill="rgba(255,255,255,0.85)" fontFamily="inherit">
          {valueSek >= 1000000
            ? `${(valueSek / 1000000).toFixed(1)} Mkr`
            : `${Math.round(valueSek).toLocaleString("sv-SE")} kr`}
        </text>
      )}
    </g>
  );
}

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
      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "var(--text-secondary, #787b86)" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#089981", marginRight: 4 }} />Upp idag</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#f23645", marginRight: 4 }} />Ner idag</span>
      </div>
    </div>
  );
}

export { formatHoldingValue };
