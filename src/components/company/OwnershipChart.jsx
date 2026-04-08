import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useIsMobile } from "../../hooks/useIsMobile.js";

const COLORS = [
  "#089981", "#2962ff", "#ff9800", "#ab47bc", "#26a69a",
  "#ef5350", "#42a5f5", "#66bb6a", "#ffa726", "#8d6e63",
  "#78909c", "#7e57c2",
];

const INSIDER_COLOR = "#e65100";
const RETAIL_COLOR = "#b0bec5";
const OTHER_INST_COLOR = "#546e7a";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 4, padding: "8px 12px", fontSize: 11, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <div style={{ fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: "var(--text-secondary)" }}>{d.value.toFixed(1)}% kapital</div>
      {d.pctVotes != null && (
        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>{d.pctVotes.toFixed(1)}% röster</div>
      )}
      {d.shares > 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: 10 }}>
          {d.shares.toLocaleString("sv-SE")} aktier
        </div>
      )}
    </div>
  );
}

export default function OwnershipChart({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ownership?ticker=${encodeURIComponent(ticker)}`)
      .then(r => {
        if (!r.ok) throw new Error("Kunde inte hämta ägardata");
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [ticker]);

  if (loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>Ägare</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>Hämtar ägardata...</div>
      </div>
    );
  }

  if (error || !data) return null;

  // Build pie chart data
  const pieData = [];
  const topHolders = data.topHolders || [];

  // Add top holders (max 10 to keep chart readable)
  const hasCurated = data.source === "curated";
  const shownHolders = topHolders.slice(0, hasCurated ? 10 : 8);
  shownHolders.forEach((h, i) => {
    if (h.pctHeld > 0) {
      pieData.push({
        name: shortenName(h.name),
        fullName: h.name,
        value: h.pctHeld,
        pctVotes: h.pctVotes ?? null,
        shares: h.shares,
        color: COLORS[i % COLORS.length],
      });
    }
  });

  // Remaining institutional
  const shownPct = shownHolders.reduce((s, h) => s + h.pctHeld, 0);
  const remainingInst = (data.institutionsPercent || 0) - shownPct;
  if (remainingInst > 0.5) {
    pieData.push({
      name: "Övriga institutioner",
      fullName: "Övriga institutionella ägare",
      value: parseFloat(remainingInst.toFixed(1)),
      shares: 0,
      color: OTHER_INST_COLOR,
    });
  }

  // Insiders
  if (data.insidersPercent > 0.1) {
    pieData.push({
      name: "Insiders",
      fullName: "Insiders & ledning",
      value: data.insidersPercent,
      shares: 0,
      color: INSIDER_COLOR,
    });
  }

  // Retail / other
  if (data.retailPercent > 0.5) {
    pieData.push({
      name: "Övriga",
      fullName: "Privata investerare & övriga",
      value: data.retailPercent,
      shares: 0,
      color: RETAIL_COLOR,
    });
  }

  if (pieData.length === 0) return null;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>
        Ägare
        {data.institutionsCount && (
          <span style={{ fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6, opacity: 0.7 }}>
            ({data.institutionsCount} institutioner)
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
        {/* Pie Chart */}
        <div style={{ width: isMobile ? 200 : 180, height: isMobile ? 200 : 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? 85 : 75}
                innerRadius={isMobile ? 45 : 38}
                paddingAngle={1}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          {pieData.map((entry, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
              <span style={{ color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.name}
              </span>
              <span style={{ color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, flexShrink: 0 }}>
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-light)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {data.institutionsPercent != null && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Institutionellt</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {data.institutionsPercent.toFixed(1)}%
            </div>
          </div>
        )}
        {data.insidersPercent != null && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Insiders</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {data.insidersPercent.toFixed(1)}%
            </div>
          </div>
        )}
        {data.retailPercent != null && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Privata</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {data.retailPercent.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
      {data.source === "curated" && data.lastUpdated && (
        <div style={{ marginTop: 8, fontSize: 9, color: "var(--text-muted)" }}>
          Källa: Bolagets IR-sida · Uppdaterad {new Date(data.lastUpdated).toLocaleDateString("sv-SE")}
        </div>
      )}
      {data.source === "yahoo" && (
        <div style={{ marginTop: 8, fontSize: 9, color: "var(--text-muted)" }}>
          Källa: Yahoo Finance
        </div>
      )}
    </div>
  );
}

function shortenName(name) {
  // Shorten common institutional names for the legend
  const map = {
    "Vanguard Group": "Vanguard",
    "The Vanguard Group, Inc.": "Vanguard",
    "Vanguard Group, Inc. (The)": "Vanguard",
    "BlackRock Inc.": "BlackRock",
    "BlackRock Institutional Trust Company, N.A.": "BlackRock",
    "BlackRock Fund Advisors": "BlackRock Funds",
    "State Street Corporation": "State Street",
    "State Street Corp": "State Street",
    "FMR, LLC": "Fidelity",
    "FMR LLC": "Fidelity",
    "Geode Capital Management, LLC": "Geode Capital",
    "Morgan Stanley": "Morgan Stanley",
    "JPMorgan Chase & Co": "JPMorgan",
    "Goldman Sachs Group, Inc. (The)": "Goldman Sachs",
    "Bank of America Corporation": "Bank of America",
    "Wells Fargo & Company": "Wells Fargo",
    "Capital Research Global Investors": "Capital Research",
    "Northern Trust Corporation": "Northern Trust",
    "T. Rowe Price Associates, Inc.": "T. Rowe Price",
    "Invesco Ltd.": "Invesco",
    "Charles Schwab Investment Management, Inc.": "Schwab",
  };

  if (map[name]) return map[name];

  // Generic shortening: remove Inc., LLC, Corp, etc.
  let short = name
    .replace(/,?\s*(Inc\.?|LLC\.?|Corp\.?|Corporation|Company|N\.A\.|Ltd\.?|Group|PLC|plc|AB|S\.A\.)\s*/gi, " ")
    .replace(/\(The\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Truncate if still too long
  if (short.length > 22) short = short.substring(0, 20) + "…";

  return short;
}
