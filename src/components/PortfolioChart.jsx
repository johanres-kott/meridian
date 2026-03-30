import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { useIsMobile } from "../hooks/useIsMobile.js";

const RANGES = [
  { id: "1m", label: "1M", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "6m", label: "6M", days: 180 },
  { id: "1y", label: "1Y", days: 365 },
];

const RANGE_TO_CHART = { "1m": "1m", "3m": "3m", "6m": "6m", "1y": "1y" };

export default function PortfolioChart({ userId, compact = false }) {
  const isMobile = useIsMobile();
  const [range, setRange] = useState("3m");
  const [allPoints, setAllPoints] = useState([]);
  const [indexData, setIndexData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showIndex, setShowIndex] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(false);

    // Fetch portfolio + OMXS30 in parallel
    Promise.all([
      fetch(`https://thesion-scraper.vercel.app/api/portfolio-history?user_id=${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/chart?ticker=${encodeURIComponent("^OMX")}&range=1y`).then(r => r.ok ? r.json() : null),
    ]).then(([portfolioData, omxData]) => {
      // Portfolio
      const raw = portfolioData?.snapshots || portfolioData?.points || portfolioData || [];
      const maxHoldings = Math.max(...raw.map(p => p.holdingsCount || 0), 1);
      const threshold = maxHoldings * 0.5;
      const pts = raw
        .filter(p => (p.holdingsCount || 0) >= threshold)
        .map(p => ({
          date: p.date,
          value: p.totalValue ?? p.value ?? 0,
          estimated: !!p.estimated,
        }));
      setAllPoints(pts);

      // OMXS30 — build date→close map
      if (omxData?.points) {
        const map = {};
        omxData.points.forEach(p => { map[p.date] = p.close; });
        setIndexData(map);
      }

      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [userId]);

  const points = useMemo(() => {
    if (allPoints.length === 0) return [];
    const rangeDef = RANGES.find(r => r.id === range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (rangeDef?.days || 90));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = allPoints.filter(p => p.date >= cutoffStr);
    if (filtered.length === 0) return [];

    // Normalize to % change from first point
    const firstVal = filtered[0].value;
    const firstIdx = indexData[filtered[0].date];

    return filtered.map(p => {
      const portfolioPct = firstVal > 0 ? ((p.value - firstVal) / firstVal) * 100 : 0;
      const idxClose = indexData[p.date];
      const indexPct = (firstIdx && idxClose) ? ((idxClose - firstIdx) / firstIdx) * 100 : null;
      return { ...p, portfolioPct, indexPct };
    });
  }, [allPoints, range, indexData]);

  const hasEstimated = points.some(p => p.estimated);
  const hasIndex = showIndex && points.some(p => p.indexPct != null);

  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  const isUp = last >= first;
  const color = isUp ? "#089981" : "#f23645";
  const returnSek = last - first;
  const returnPct = first > 0 ? ((last - first) / first) * 100 : 0;

  // Index return for comparison
  const lastIndexPct = points[points.length - 1]?.indexPct;
  const beatIndex = returnPct > (lastIndexPct || 0);

  const gradientId = `portfolioChartGrad-${range}`;
  const chartHeight = compact ? 160 : (isMobile ? 180 : 220);

  // Split data into actual and estimated segments for dashed line effect
  const splitPoints = useMemo(() => {
    if (!hasEstimated) return [];
    // Find last actual point to use as bridge connecting the two line segments
    let lastActualIdx = -1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (!points[i].estimated) { lastActualIdx = i; break; }
    }
    return points.map((p, i) => ({
      ...p,
      actual: p.estimated ? undefined : p.value,
      est: (p.estimated || i === lastActualIdx) ? p.value : undefined,
    }));
  }, [points, hasEstimated]);

  if (loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: compact ? "12px 14px" : "20px 20px 12px", marginBottom: compact ? 0 : 20 }}>
        <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 12 }}>
          Laddar portfoljutveckling...
        </div>
      </div>
    );
  }

  if (error || points.length < 2) return null;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: compact ? "12px 14px" : "20px 20px 12px", marginBottom: compact ? 0 : 20 }}>
      {/* Header with return info and range selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: compact ? "center" : "flex-start", marginBottom: compact ? 10 : 16, flexDirection: compact && isMobile ? "column" : "row", gap: compact && isMobile ? 8 : 0 }}>
        <div>
          <div style={{ fontSize: compact ? 10 : 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: compact ? 2 : 4 }}>
            Portfoljutveckling (SEK)
          </div>
          {!compact && (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {last.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {returnSek >= 0 ? "+" : ""}{returnSek.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK ({returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%)
                </span>
              </div>
              {hasIndex && lastIndexPct != null && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>OMXS30: <span style={{ color: lastIndexPct >= 0 ? "#089981" : "#f23645", fontFamily: "'IBM Plex Mono', monospace" }}>{lastIndexPct >= 0 ? "+" : ""}{lastIndexPct.toFixed(1)}%</span></span>
                  <span style={{ color: beatIndex ? "#089981" : "#f23645", fontWeight: 500 }}>
                    {beatIndex ? "▲" : "▼"} {Math.abs(returnPct - lastIndexPct).toFixed(1)}% vs index
                  </span>
                </div>
              )}
            </div>
          )}
          {compact && (
            <span style={{ fontSize: 12, fontWeight: 500, color, fontFamily: "'IBM Plex Mono', monospace" }}>
              {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
              <span style={{ color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                ({returnSek >= 0 ? "+" : ""}{returnSek.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK)
              </span>
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {!compact && Object.keys(indexData).length > 0 && (
            <button onClick={() => setShowIndex(!showIndex)}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500, marginRight: 8,
                background: showIndex ? "rgba(120,123,134,0.15)" : "var(--border-light)",
                color: showIndex ? "var(--text)" : "var(--text-muted)",
                border: "none",
              }}>
              {showIndex ? "● OMXS30" : "○ OMXS30"}
            </button>
          )}
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        {hasIndex ? (
          // Comparison mode: % change with two lines
          <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted, #b2b5be)" }} tickLine={false} axisLine={{ stroke: "var(--border, #e0e3eb)" }}
              tickFormatter={d => { if (!d) return ""; const [y, m, day] = d.split("-"); return range === "1y" || range === "6m" ? `${m}/${y.slice(2)}` : `${day}/${m}`; }}
              minTickGap={compact ? 50 : 40}
            />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--text-muted, #b2b5be)" }} tickLine={false} axisLine={false} width={compact ? 40 : 50}
              tickFormatter={v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              formatter={(v, name) => {
                if (v == null) return [null, null];
                const label = name === "portfolioPct" ? "Min portfölj" : "OMXS30";
                return [`${v >= 0 ? "+" : ""}${v.toFixed(1)}%`, label];
              }}
              labelFormatter={d => d}
            />
            <Area type="monotone" dataKey="portfolioPct" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} name="portfolioPct" />
            <Line type="monotone" dataKey="indexPct" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="indexPct" connectNulls />
          </ComposedChart>
        ) : (
          // Absolute mode: SEK value
          <AreaChart data={hasEstimated ? splitPoints : points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted, #b2b5be)" }} tickLine={false} axisLine={{ stroke: "var(--border, #e0e3eb)" }}
              tickFormatter={d => { if (!d) return ""; const [y, m, day] = d.split("-"); return range === "1y" || range === "6m" ? `${m}/${y.slice(2)}` : `${day}/${m}`; }}
              minTickGap={compact ? 50 : 40}
            />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--text-muted, #b2b5be)" }} tickLine={false} axisLine={false} width={compact ? 50 : 65}
              tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toLocaleString("sv-SE")}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              formatter={(v, name) => { if (v == null) return [null, null]; return [v.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " SEK", name === "est" ? "Estimerat" : "Portföljvärde"]; }}
              labelFormatter={d => d}
            />
            {hasEstimated ? (
              <>
                <Area type="monotone" dataKey="actual" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} connectNulls={false} />
                <Area type="monotone" dataKey="est" stroke={color} strokeWidth={1.5} strokeDasharray="5 3" fill={`url(#${gradientId})`} fillOpacity={0.4} dot={false} connectNulls={false} />
              </>
            ) : (
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Footer */}
      {!compact && points.length > 1 && (
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--text-secondary)", flexWrap: "wrap" }}>
          <span>{"H\u00f6gst: "}<span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.max(...points.map(p => p.value)).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</span></span>
          <span>{"L\u00e4gst: "}<span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.min(...points.map(p => p.value)).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</span></span>
          {hasEstimated && (
            <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
              {"Estimerat baserat p\u00e5 nuvarande innehav"}
            </span>
          )}
        </div>
      )}
      {compact && hasEstimated && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic", marginTop: 6 }}>
          {"Estimerat baserat p\u00e5 nuvarande innehav"}
        </div>
      )}
    </div>
  );
}
