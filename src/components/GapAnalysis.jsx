import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { fmt } from "./shared.js";

const FLAG_MAP = {
  ST: "\u{1F1F8}\u{1F1EA}", HE: "\u{1F1EB}\u{1F1EE}", CO: "\u{1F1E9}\u{1F1F0}",
  OL: "\u{1F1F3}\u{1F1F4}", HK: "\u{1F1ED}\u{1F1F0}", L: "\u{1F1EC}\u{1F1E7}",
  PA: "\u{1F1EB}\u{1F1F7}", DE: "\u{1F1E9}\u{1F1EA}", AS: "\u{1F1F3}\u{1F1F1}",
  SW: "\u{1F1E8}\u{1F1ED}", T: "\u{1F1EF}\u{1F1F5}", TO: "\u{1F1E8}\u{1F1E6}",
};

function getFlag(ticker) {
  if (!ticker) return "";
  const parts = ticker.split(".");
  if (parts.length > 1) return FLAG_MAP[parts[parts.length - 1]] || "\u{1F1FA}\u{1F1F8}";
  return "\u{1F1FA}\u{1F1F8}";
}

const COLUMNS = [
  { key: "name", label: "Bolag", align: "left" },
  { key: "price", label: "Kurs", align: "right", fmt: (v, d) => v ? `${v.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${d.currency || ""}` : "\u2014" },
  { key: "changePercent", label: "\u0394 Idag", align: "right", fmt: v => v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "\u2014", color: v => v > 0 ? "#089981" : v < 0 ? "#f23645" : "#787b86" },
  { key: "peForward", label: "P/E Fwd", align: "right", fmt: v => fmt(v, "x") },
  { key: "peTrailing", label: "P/E Trail", align: "right", fmt: v => fmt(v, "x") },
  { key: "ebitdaMargin", label: "EBITDA %", align: "right", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "operatingMargin", label: "Ror.marg", align: "right", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "grossMargin", label: "Brutto %", align: "right", fmt: v => fmt(v, "%") },
  { key: "revenueGrowth", label: "Tillv\u00e4xt", align: "right", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : v > 0 ? "#089981" : null },
  { key: "roic", label: "ROIC", align: "right", fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
  { key: "debtEbitda", label: "Skuld/EBITDA", align: "right", fmt: v => fmt(v, "x"), color: v => v > 3 ? "#f23645" : null },
];

export default function GapAnalysis({ preferences = {} }) {
  const [items, setItems] = useState([]);
  const [companyData, setCompanyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);

  const groups = preferences.groups || [];

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at");
      setItems(data || []);

      // Fetch company data for all items
      const results = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const res = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
            const d = await res.json();
            return { ticker: item.ticker, data: d };
          } catch {
            return { ticker: item.ticker, data: null };
          }
        })
      );
      const map = {};
      results.forEach(({ ticker, data: d }) => { if (d) map[ticker] = d; });
      setCompanyData(map);
      setLoading(false);
    }
    load();
  }, []);

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  // Filter items by active group
  const filteredItems = activeGroup
    ? items.filter(item => {
        const group = groups.find(g => g.name === activeGroup);
        return group && (group.members || []).includes(item.id);
      })
    : items;

  const sorted = [...filteredItems];
  if (sortKey) {
    sorted.sort((a, b) => {
      let va, vb;
      if (sortKey === "name") {
        va = (a.name || a.ticker || "").toLowerCase();
        vb = (b.name || b.ticker || "").toLowerCase();
      } else {
        va = companyData[a.ticker]?.[sortKey] ?? null;
        vb = companyData[b.ticker]?.[sortKey] ?? null;
      }
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }

  const thStyle = (col) => ({
    padding: "8px 10px",
    textAlign: col.align,
    fontSize: 11,
    fontWeight: 500,
    color: sortKey === col.key ? "#2962ff" : "#787b86",
    borderBottom: "1px solid #e0e3eb",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  const tdStyle = (col) => ({
    padding: "8px 10px",
    textAlign: col.align,
    fontFamily: col.align === "right" ? "'IBM Plex Mono', monospace" : "inherit",
    fontSize: 12,
    borderBottom: "1px solid #f0f3fa",
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Nyckeltal</h1>
        <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
          Fundamentala nyckeltal f&ouml;r {filteredItems.length} bolag{activeGroup ? ` i ${activeGroup}` : ""}
        </p>
      </div>

      {/* Group filter bar */}
      {groups.length > 0 && !loading && items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveGroup(null)}
            style={{
              fontSize: 12, padding: "5px 12px", borderRadius: 14,
              border: activeGroup === null ? "1px solid #2962ff" : "1px solid #e0e3eb",
              background: activeGroup === null ? "#f0f3fa" : "#fff",
              color: activeGroup === null ? "#2962ff" : "#787b86",
              cursor: "pointer", fontFamily: "inherit", fontWeight: activeGroup === null ? 500 : 400,
            }}
          >
            Alla ({items.length})
          </button>
          {groups.map(g => {
            const count = (g.members || []).filter(m => items.some(i => i.id === m)).length;
            const isActive = activeGroup === g.name;
            return (
              <button
                key={g.name}
                onClick={() => setActiveGroup(isActive ? null : g.name)}
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 14,
                  border: isActive ? "1px solid #2962ff" : "1px solid #e0e3eb",
                  background: isActive ? "#f0f3fa" : "#fff",
                  color: isActive ? "#2962ff" : "#787b86",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: isActive ? 500 : 400,
                }}
              >
                {g.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Laddar nyckeltal...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#787b86", fontSize: 13 }}>
          Inga bolag i watchlisten &mdash; l&auml;gg till bolag p&aring; Portf&ouml;lj-sidan
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#787b86", fontSize: 13 }}>
          Inga bolag i &ldquo;{activeGroup}&rdquo;
        </div>
      ) : (
        <div style={{ border: "1px solid #e0e3eb", borderRadius: 4, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #e0e3eb", width: 30 }}></th>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={thStyle(col)}>
                    {col.label}
                    {sortKey === col.key && <span style={{ marginLeft: 4 }}>{sortAsc ? "\u25B2" : "\u25BC"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(item => {
                const d = companyData[item.ticker] || {};
                return (
                  <tr key={item.id}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8f9fd"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f3fa", width: 30 }}>{getFlag(item.ticker)}</td>
                    {COLUMNS.map(col => {
                      const val = col.key === "name" ? null : d[col.key];
                      const colorFn = col.color;
                      const cellColor = colorFn ? colorFn(val) : null;

                      if (col.key === "name") {
                        return (
                          <td key={col.key} style={{ ...tdStyle(col), fontWeight: 500 }}>
                            <div style={{ color: "#131722" }}>{item.name || item.ticker}</div>
                            <div style={{ fontSize: 10, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>{item.ticker}</div>
                          </td>
                        );
                      }

                      const formatted = col.fmt ? col.fmt(val, d) : (val ?? "\u2014");

                      return (
                        <td key={col.key} style={{ ...tdStyle(col), color: cellColor || "#131722" }}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
