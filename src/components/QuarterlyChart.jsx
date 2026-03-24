import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useIsMobile } from "../hooks/useIsMobile.js";

function formatMSEK(v) {
  if (v == null) return "–";
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

function formatQuarterLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear().toString().slice(2)}`;
}

export default function QuarterlyChart({ ticker }) {
  const isMobile = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("revenue"); // revenue | margins

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quarterly?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#787b86" }}>Laddar kvartalsdata...</div>
    </div>
  );

  if (!data?.quarters?.length) return null;

  const quarters = data.quarters.map(q => ({
    ...q,
    label: formatQuarterLabel(q.date),
  }));

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Kvartalsdata</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "revenue", label: "Omsättning" }, { id: "margins", label: "Marginaler" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 3, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                background: view === v.id ? "#2962ff" : "#f0f3fa",
                color: view === v.id ? "#fff" : "#787b86",
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "revenue" ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quarters} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#787b86" }} />
            <YAxis tickFormatter={formatMSEK} tick={{ fontSize: 10, fill: "#787b86" }} />
            <Tooltip
              formatter={(v, name) => [formatMSEK(v), name === "revenue" ? "Omsättning" : name === "operatingIncome" ? "Rörelseresultat" : "Nettoresultat"]}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 11, borderRadius: 4 }}
            />
            <Bar dataKey="revenue" fill="#2962ff" radius={[3, 3, 0, 0]} name="revenue" />
            <Bar dataKey="operatingIncome" fill="#089981" radius={[3, 3, 0, 0]} name="operatingIncome" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={quarters} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#787b86" }} />
            <YAxis tickFormatter={v => `${v?.toFixed(0)}%`} tick={{ fontSize: 10, fill: "#787b86" }} />
            <Tooltip
              formatter={(v, name) => [`${v?.toFixed(1)}%`, name === "operatingMargin" ? "Rörelsemarginal" : name === "grossMargin" ? "Bruttomarginal" : "Nettomarginal"]}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 11, borderRadius: 4 }}
            />
            <Line type="monotone" dataKey="grossMargin" stroke="#2962ff" strokeWidth={2} dot={false} name="grossMargin" />
            <Line type="monotone" dataKey="operatingMargin" stroke="#089981" strokeWidth={2} dot={false} name="operatingMargin" />
            <Line type="monotone" dataKey="netMargin" stroke="#f23645" strokeWidth={2} dot={false} name="netMargin" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Quarterly table */}
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
              <th style={thStyle}>Kvartal</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Omsättning</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Rörelseresultat</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Rör.marg</th>
              {!isMobile && <th style={{ ...thStyle, textAlign: "right" }}>Nettoresultat</th>}
              {!isMobile && <th style={{ ...thStyle, textAlign: "right" }}>EPS</th>}
            </tr>
          </thead>
          <tbody>
            {quarters.slice().reverse().slice(0, 8).map((q, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f3fa" }}>
                <td style={{ ...tdStyle, color: "#131722", fontWeight: 500 }}>{q.label}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatMSEK(q.revenue)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", color: q.operatingIncome < 0 ? "#f23645" : "#131722" }}>{formatMSEK(q.operatingIncome)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", color: q.operatingMargin < 0 ? "#f23645" : "#131722" }}>{q.operatingMargin != null ? `${q.operatingMargin.toFixed(1)}%` : "–"}</td>
                {!isMobile && <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", color: q.netIncome < 0 ? "#f23645" : "#131722" }}>{formatMSEK(q.netIncome)}</td>}
                {!isMobile && <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{q.eps?.toFixed(2) ?? "–"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: "6px 6px", fontSize: 10, color: "#787b86", fontWeight: 500, textAlign: "left" };
const tdStyle = { padding: "6px 6px", fontSize: 11 };
