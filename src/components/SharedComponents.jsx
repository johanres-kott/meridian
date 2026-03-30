import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const RANGES = [
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
];

export function PriceChart({ ticker, yahooSymbol, conv = 1, label = "Kurs" }) {
  const [range, setRange] = useState("3m");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartSymbol = yahooSymbol || ticker;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chart?ticker=${encodeURIComponent(chartSymbol)}&range=${range}`)
      .then(r => r.json())
      .then(d => {
        const pts = (d.points || []).map(p => ({
          ...p,
          close: p.close * conv,
        }));
        setPoints(pts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chartSymbol, range, conv]);

  const first = points[0]?.close;
  const last = points[points.length - 1]?.close;
  const isUp = last >= first;
  const color = isUp ? "#089981" : "#f23645";
  const gradientId = `chartGrad-${(chartSymbol || "default").replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 20px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Kursutveckling</div>
        <div style={{ display: "flex", gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 3, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                background: range === r.id ? "var(--accent)" : "var(--border-light)",
                color: range === r.id ? "#fff" : "var(--text-secondary)",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 12 }}>
          Laddar graf...
        </div>
      ) : points.length === 0 ? (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 12 }}>
          Ingen kursdata tillganglig
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#b2b5be" }}
              tickLine={false}
              axisLine={{ stroke: "#e0e3eb" }}
              tickFormatter={d => {
                const [y, m, day] = d.split("-");
                return range === "5y" || range === "1y" ? `${m}/${y.slice(2)}` : `${day}/${m}`;
              }}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "#b2b5be" }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={v => v.toLocaleString("sv-SE")}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              formatter={v => [v.toLocaleString("sv-SE", { minimumFractionDigits: 2 }), label]}
              labelFormatter={d => d}
            />
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {points.length > 1 && (
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>
          <span>Period: <span style={{ color, fontWeight: 500 }}>{isUp ? "+" : ""}{((last - first) / first * 100).toFixed(1)}%</span></span>
          <span>Hog: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.max(...points.map(p => p.close)).toLocaleString("sv-SE", { minimumFractionDigits: 2 })}</span></span>
          <span>Lag: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.min(...points.map(p => p.close)).toLocaleString("sv-SE", { minimumFractionDigits: 2 })}</span></span>
        </div>
      )}
    </div>
  );
}

export const Chg = ({ value }) => (
  <span style={{ color: value >= 0 ? "#089981" : "#f23645" }}>
    {value >= 0 ? "+" : ""}{value.toFixed(2)}%
  </span>
);

export const MiniBar = ({ value, peer, max }) => {
  if (!value) return <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>;
  const vPct = Math.min((Math.abs(value) / max) * 100, 100);
  const pPct = Math.min((peer / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 3, background: "var(--border-light)", borderRadius: 2, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: value < peer ? "#f23645" : "#089981", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: -2, left: `${pPct}%`, width: 1, height: 7, background: "var(--text-muted)" }} />
      </div>
      <span style={{ fontSize: 11, color: value < peer ? "#f23645" : "#089981" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

export const Pill = ({ text, green }) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 3,
    background: green ? "#e8f5e9" : "var(--bg-secondary)",
    color: green ? "#089981" : "var(--text-secondary)", fontWeight: 500
  }}>{text}</span>
);

export const StatCard = ({ label, value, sub, neg, tooltip }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "12px 14px", cursor: tooltip ? "help" : undefined, position: "relative" }}
      onMouseEnter={() => tooltip && setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => tooltip && setShow(!show)}
    >
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
        {label}
        {tooltip && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.5 }}>?</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: neg ? "#f23645" : neg === false ? "#089981" : "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
      {show && tooltip && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--text)", color: "var(--bg)", fontSize: 11, lineHeight: 1.5,
          padding: "8px 10px", borderRadius: 6, zIndex: 50,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", pointerEvents: "none",
        }}>
          {tooltip}
          <div style={{
            position: "absolute", bottom: -4, left: 16, width: 8, height: 8,
            background: "var(--text)", transform: "rotate(45deg)",
          }} />
        </div>
      )}
    </div>
  );
};
