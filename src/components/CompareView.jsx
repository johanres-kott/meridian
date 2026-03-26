import { useIsMobile } from "../hooks/useIsMobile.js";
import { fmt } from "./shared.js";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer,
} from "recharts";

const COMPANY_COLORS = ["#2962ff", "#089981", "#f23645", "#e65100"];

const METRIC_COLUMNS = [
  { key: "peForward", label: "P/E Forward", fmt: v => fmt(v, "x") },
  { key: "peTrailing", label: "P/E Trailing", fmt: v => fmt(v, "x") },
  { key: "operatingMargin", label: "Rörelsemarginal", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "ebitdaMargin", label: "EBITDA-marginal", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "grossMargin", label: "Bruttomarginal", fmt: v => fmt(v, "%") },
  { key: "revenueGrowth", label: "Tillväxt", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : v > 0 ? "#089981" : null },
  { key: "roic", label: "ROIC", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "debtEbitda", label: "Skuld/EBITDA", fmt: v => fmt(v, "x"), color: v => v > 3 ? "#f23645" : null },
];

const RADAR_METRICS = [
  { key: "peForward", label: "P/E Fwd", invert: true },
  { key: "operatingMargin", label: "Rörelsemarg.", invert: false },
  { key: "revenueGrowth", label: "Tillväxt", invert: false },
  { key: "roic", label: "ROIC", invert: false },
  { key: "debtEbitda", label: "Skuld/EBITDA", invert: true },
];

function normalize(values, invert) {
  const nums = values.filter(v => v != null && isFinite(v));
  if (nums.length === 0) return values.map(() => 50);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min;
  return values.map(v => {
    if (v == null || !isFinite(v)) return 30;
    const norm = range === 0 ? 50 : ((v - min) / range) * 80 + 10;
    return invert ? 100 - norm : norm;
  });
}

export default function CompareView({ companies, onBack }) {
  const isMobile = useIsMobile();

  const radarData = RADAR_METRICS.map(metric => {
    const rawValues = companies.map(c => c[metric.key] ?? null);
    const normalized = normalize(rawValues, metric.invert);
    const entry = { metric: metric.label };
    companies.forEach((c, i) => {
      entry[c.ticker] = Math.round(normalized[i]);
    });
    return entry;
  });

  return (
    <div>
      {/* Header with back button */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 4,
            padding: "6px 14px", fontSize: 12, color: "var(--text)", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Tillbaka
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Jämförelse</h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
            {companies.map(c => c.name || c.ticker).join(" vs ")}
          </p>
        </div>
      </div>

      {/* Company header cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : `repeat(${companies.length}, 1fr)`,
        gap: 12, marginBottom: 24,
      }}>
        {companies.map((c, i) => (
          <div key={c.ticker} style={{
            border: "1px solid var(--border)", borderRadius: 6, padding: 16,
            borderTop: `3px solid ${COMPANY_COLORS[i]}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{c.name || c.ticker}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
              {c.ticker}
            </div>
            {c.price != null && (
              <div style={{ fontSize: 18, fontWeight: 500, marginTop: 8, color: "var(--text)" }}>
                {c.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>{c.currency || ""}</span>
              </div>
            )}
            {c.changePercent != null && (
              <div style={{
                fontSize: 12, marginTop: 4,
                color: c.changePercent > 0 ? "#089981" : c.changePercent < 0 ? "#f23645" : "var(--text-secondary)",
              }}>
                {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Radar chart */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Relativt styrkeindex</div>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "65%" : "70%"}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {companies.map((c, i) => (
              <Radar
                key={c.ticker}
                name={c.name || c.ticker}
                dataKey={c.ticker}
                stroke={COMPANY_COLORS[i]}
                fill={COMPANY_COLORS[i]}
                fillOpacity={0.08}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics comparison table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 400 : 0 }}>
          <thead>
            <tr>
              <th style={{
                padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 500,
                color: "var(--text-secondary)", borderBottom: "1px solid var(--border)",
              }}>
                Nyckeltal
              </th>
              {companies.map((c, i) => (
                <th key={c.ticker} style={{
                  padding: "8px 10px", textAlign: "right", fontSize: 11, fontWeight: 500,
                  color: COMPANY_COLORS[i], borderBottom: "1px solid var(--border)",
                }}>
                  {c.name || c.ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_COLUMNS.map(col => (
              <tr key={col.key}>
                <td style={{
                  padding: "8px 10px", fontSize: 12, color: "var(--text)",
                  borderBottom: "1px solid var(--border-light)",
                }}>
                  {col.label}
                </td>
                {companies.map(c => {
                  const val = c[col.key];
                  const cellColor = col.color ? col.color(val) : null;
                  return (
                    <td key={c.ticker} style={{
                      padding: "8px 10px", textAlign: "right",
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                      borderBottom: "1px solid var(--border-light)",
                      color: cellColor || "var(--text)",
                    }}>
                      {col.fmt ? col.fmt(val) : (val ?? "\u2014")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
