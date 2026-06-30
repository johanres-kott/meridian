import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { fmt } from "./shared.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { useUser } from "../contexts/UserContext.jsx";
import CompareView from "./CompareView.jsx";
import { getFlag } from "../constants.js";

const MOBILE_COLUMNS = new Set(["name", "price", "changePercent", "peForward"]);

const COLUMN_ORDERS = {
  value: ["name", "price", "changePercent", "peForward", "peTrailing", "debtEbitda", "grossMargin", "roic", "operatingMargin", "ebitdaMargin", "revenueGrowth", "dividendYield"],
  growth: ["name", "price", "changePercent", "revenueGrowth", "roic", "operatingMargin", "peForward", "ebitdaMargin", "grossMargin", "peTrailing", "debtEbitda", "dividendYield"],
  dividend: ["name", "price", "changePercent", "dividendYield", "peForward", "grossMargin", "debtEbitda", "roic", "operatingMargin", "ebitdaMargin", "peTrailing", "revenueGrowth"],
  default: ["name", "price", "changePercent", "peForward", "peTrailing", "ebitdaMargin", "operatingMargin", "grossMargin", "revenueGrowth", "roic", "debtEbitda", "dividendYield"],
};

function getAllColumns(t, numberLocale) {
  return {
    name: { key: "name", label: t("gapAnalysis.columns.name"), align: "left" },
    price: { key: "price", label: t("gapAnalysis.columns.price"), align: "right", tip: t("gapAnalysis.tips.price"), fmt: (v, d) => v ? `${v.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${d.currency || ""}` : "—" },
    changePercent: { key: "changePercent", label: t("gapAnalysis.columns.changePercent"), align: "right", tip: t("gapAnalysis.tips.changePercent"), fmt: v => v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "—", color: v => v > 0 ? "#089981" : v < 0 ? "#f23645" : "var(--text-secondary)" },
    peForward: { key: "peForward", label: t("gapAnalysis.columns.peForward"), align: "right", tip: t("gapAnalysis.tips.peForward"), fmt: v => fmt(v, "x") },
    peTrailing: { key: "peTrailing", label: t("gapAnalysis.columns.peTrailing"), align: "right", tip: t("gapAnalysis.tips.peTrailing"), fmt: v => fmt(v, "x") },
    ebitdaMargin: { key: "ebitdaMargin", label: t("gapAnalysis.columns.ebitdaMargin"), align: "right", tip: t("gapAnalysis.tips.ebitdaMargin"), fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
    operatingMargin: { key: "operatingMargin", label: t("gapAnalysis.columns.operatingMargin"), align: "right", tip: t("gapAnalysis.tips.operatingMargin"), fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
    grossMargin: { key: "grossMargin", label: t("gapAnalysis.columns.grossMargin"), align: "right", tip: t("gapAnalysis.tips.grossMargin"), fmt: v => fmt(v, "%") },
    revenueGrowth: { key: "revenueGrowth", label: t("gapAnalysis.columns.revenueGrowth"), align: "right", tip: t("gapAnalysis.tips.revenueGrowth"), fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : v > 0 ? "#089981" : null },
    roic: { key: "roic", label: t("gapAnalysis.columns.roic"), align: "right", tip: t("gapAnalysis.tips.roic"), fmt: v => fmt(v, "%"), color: v => v < 0 ? "#f23645" : null },
    debtEbitda: { key: "debtEbitda", label: t("gapAnalysis.columns.debtEbitda"), align: "right", tip: t("gapAnalysis.tips.debtEbitda"), fmt: v => fmt(v, "x"), color: v => v > 3 ? "#f23645" : null },
    dividendYield: { key: "dividendYield", label: t("gapAnalysis.columns.dividendYield"), align: "right", tip: t("gapAnalysis.tips.dividendYield"), fmt: v => fmt(v, "%"), color: v => v > 3 ? "#089981" : null },
  };
}

function getColumns(investorType, allCols) {
  const order = COLUMN_ORDERS[investorType] || COLUMN_ORDERS.default;
  return order.map(key => allCols[key]).filter(Boolean);
}

export default function GapAnalysis({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { preferences } = useUser();
  const isMobile = useIsMobile();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const allColumnsDef = getAllColumns(t, numberLocale);
  const allColumns = getColumns(preferences.investorProfile?.investorType, allColumnsDef);
  const columns = isMobile ? allColumns.filter(c => MOBILE_COLUMNS.has(c.key)) : allColumns;
  const [items, setItems] = useState([]);
  const [companyData, setCompanyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState(new Set());
  const [compareMode, setCompareMode] = useState(false);

  const groups = preferences.groups || [];

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at");
      setItems(data || []);

      const results = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const res = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
            const d = await res.json();
            return { ticker: item.ticker, data: d };
          } catch (err) {
            console.error(`GapAnalysis: failed to fetch ${item.ticker}:`, err);
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

  function toggleCompare(ticker) {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else if (next.size < 4) next.add(ticker);
      return next;
    });
  }

  if (compareMode) {
    const compareCompanies = [...selectedForCompare].map(ticker => {
      const item = items.find(i => i.ticker === ticker);
      const d = companyData[ticker] || {};
      return { ticker, name: item?.name || ticker, ...d };
    });
    return (
      <CompareView
        companies={compareCompanies}
        onBack={() => setCompareMode(false)}
      />
    );
  }

  const thStyle = (col) => ({
    padding: isMobile ? "6px 6px" : "8px 10px",
    textAlign: col.align,
    fontSize: isMobile ? 10 : 11,
    fontWeight: 500,
    color: sortKey === col.key ? "var(--accent)" : "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  const tdStyle = (col) => ({
    padding: isMobile ? "6px 6px" : "8px 10px",
    textAlign: col.align,
    fontFamily: col.align === "right" ? "'IBM Plex Mono', monospace" : "inherit",
    fontSize: isMobile ? 11 : 12,
    borderBottom: "1px solid var(--border-light)",
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 500 }}>{t("gapAnalysis.title")}</h1>
        <p style={{ fontSize: isMobile ? 11 : 12, color: "var(--text-secondary)", marginTop: 2 }}>
          {activeGroup
            ? t("gapAnalysis.subtitleGroup", { count: filteredItems.length, group: activeGroup })
            : t("gapAnalysis.subtitle", { count: filteredItems.length })}
        </p>
        {selectedForCompare.size >= 2 && (
          <button
            onClick={() => setCompareMode(true)}
            style={{
              marginTop: 8, fontSize: 12, padding: "6px 16px", borderRadius: 4,
              border: "none", background: "#2962ff", color: "#fff",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
              width: isMobile ? "100%" : "auto",
            }}
          >
            {t("gapAnalysis.compare", { count: selectedForCompare.size })}
          </button>
        )}
      </div>

      {groups.length > 0 && !loading && items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveGroup(null)}
            style={{
              fontSize: 12, padding: "5px 12px", borderRadius: 14,
              border: activeGroup === null ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: activeGroup === null ? "var(--border-light)" : "var(--bg-card)",
              color: activeGroup === null ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer", fontFamily: "inherit", fontWeight: activeGroup === null ? 500 : 400,
            }}
          >
            {t("gapAnalysis.all", { count: items.length })}
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
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: isActive ? "var(--border-light)" : "var(--bg-card)",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
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
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>{t("gapAnalysis.loading")}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
          {t("gapAnalysis.emptyWatchlist")}
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
          {t("gapAnalysis.emptyGroup", { group: activeGroup })}
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 4, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 360 : 900 }}>
            <thead>
              <tr>
                <th style={{ padding: isMobile ? "6px 2px 6px 6px" : "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", width: isMobile ? 20 : 30 }}></th>
                <th style={{ padding: isMobile ? "6px 4px" : "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", width: isMobile ? 24 : 30 }}></th>
                {columns.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={thStyle(col)} title={col.tip || ""}>
                    {col.label}
                    {col.tip && <span style={{ marginLeft: 2, fontSize: 9, color: "var(--text-muted)", cursor: "help" }}>?</span>}
                    {sortKey === col.key && <span style={{ marginLeft: 4 }}>{sortAsc ? "▲" : "▼"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(item => {
                const d = companyData[item.ticker] || {};
                return (
                  <tr key={item.id}
                    onClick={() => onNavigate?.("portfolio", { ticker: item.ticker })}
                    style={{ cursor: onNavigate ? "pointer" : "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: isMobile ? "6px 2px 6px 6px" : "8px 4px 8px 10px", borderBottom: "1px solid var(--border-light)", width: isMobile ? 20 : 30, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedForCompare.has(item.ticker)}
                        onChange={() => toggleCompare(item.ticker)}
                        disabled={!selectedForCompare.has(item.ticker) && selectedForCompare.size >= 4}
                        style={{ cursor: "pointer", accentColor: "var(--accent)", width: isMobile ? 14 : undefined, height: isMobile ? 14 : undefined }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? "6px 4px" : "8px 10px", borderBottom: "1px solid var(--border-light)", width: isMobile ? 24 : 30 }}>{getFlag(item.ticker)}</td>
                    {columns.map(col => {
                      const val = col.key === "name" ? null : d[col.key];
                      const colorFn = col.color;
                      const cellColor = colorFn ? colorFn(val) : null;

                      if (col.key === "name") {
                        return (
                          <td key={col.key} style={{ ...tdStyle(col), fontWeight: 500 }}>
                            <div style={{ color: "var(--text)" }}>{item.name || item.ticker}</div>
                            <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>{item.ticker}</div>
                          </td>
                        );
                      }

                      const formatted = col.fmt ? col.fmt(val, d) : (val ?? "—");

                      return (
                        <td key={col.key} style={{ ...tdStyle(col), color: cellColor || "var(--text)" }}>
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
