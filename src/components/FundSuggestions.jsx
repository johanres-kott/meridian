import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";

export default function FundSuggestions({ isMobile, onNavigate }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState("aktie_sverige");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "index" | "active"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(new Set());
  const [added, setAdded] = useState(new Set());

  const categories = [
    { id: "aktie_sverige", label: t("fundSuggestions.catSweden") },
    { id: "aktie_global", label: t("fundSuggestions.catGlobal") },
    { id: "aktie_tillvaxt", label: t("fundSuggestions.catEmerging") },
    { id: "blandfond", label: t("fundSuggestions.catMixed") },
    { id: "rantefond", label: t("fundSuggestions.catFixed") },
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fund-top?category=${category}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  async function addToWatchlist(fund) {
    if (adding.has(fund.secId) || added.has(fund.secId)) return;
    setAdding(prev => new Set([...prev, fund.secId]));

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("watchlist").insert({
      ticker: fund.secId, name: fund.legalName || fund.name, user_id: user.id, status: "Bevakar", type: "fund",
    });

    setAdding(prev => { const n = new Set(prev); n.delete(fund.secId); return n; });
    if (!error) setAdded(prev => new Set([...prev, fund.secId]));
  }

  async function openFund(fund) {
    if (!added.has(fund.secId)) {
      await addToWatchlist(fund);
    }
    onNavigate?.("portfolio", { ticker: fund.secId });
  }

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const filtered = (data?.results || []).filter(f =>
    typeFilter === "all" ? true : typeFilter === "index" ? f.indexFund : !f.indexFund
  );

  return (
    <div style={{ marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        padding: isMobile ? "10px 12px" : "14px 20px", borderBottom: "1px solid var(--border-light)",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{t("fundSuggestions.title")}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)",
                cursor: "pointer", fontFamily: "inherit", fontWeight: category === cat.id ? 600 : 400,
                background: category === cat.id ? "var(--accent)" : "var(--bg-card)",
                color: category === cat.id ? "#fff" : "var(--text-secondary)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "all", label: t("fundSuggestions.filterAll") },
            { id: "index", label: t("fundSuggestions.filterIndex") },
            { id: "active", label: t("fundSuggestions.filterActive") },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTypeFilter(opt.id)}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 3, border: "1px solid var(--border)",
                cursor: "pointer", fontFamily: "inherit", fontWeight: typeFilter === opt.id ? 600 : 400,
                background: typeFilter === opt.id
                  ? (opt.id === "index" ? "rgba(33,150,243,0.15)" : opt.id === "active" ? "rgba(156,39,176,0.12)" : "var(--bg-card)")
                  : "var(--bg-card)",
                color: typeFilter === opt.id
                  ? (opt.id === "index" ? "#1976d2" : opt.id === "active" ? "#7b1fa2" : "var(--text)")
                  : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: isMobile ? "8px 0" : "0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "20px" }}>{t("fundSuggestions.loading")}</div>
        ) : !filtered.length ? (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "20px" }}>{t("fundSuggestions.noFunds")}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), width: isMobile ? 24 : 30, textAlign: "center" }}>#</th>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "left" }}>{t("fundSuggestions.colFund")}</th>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "center", width: 60 }}>{t("fundSuggestions.colRating")}</th>
                {!isMobile && <th style={{ ...thStyle, textAlign: "right", width: 60 }}>{t("fundSuggestions.colFee")}</th>}
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "right", width: 60 }}>{t("fundSuggestions.col1y")}</th>
                {!isMobile && <th style={{ ...thStyle, textAlign: "right", width: 60 }}>{t("fundSuggestions.col3y")}</th>}
                {!isMobile && <th style={{ ...thStyle, textAlign: "right", width: 60 }}>{t("fundSuggestions.col5y")}</th>}
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), width: isMobile ? 56 : 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fund, idx) => {
                const isAdding = adding.has(fund.secId);
                const isAdded = added.has(fund.secId);
                return (
                  <tr
                    key={fund.secId}
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>{idx + 1}</td>
                    <td
                      onClick={() => openFund(fund)}
                      style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), color: "var(--text)", maxWidth: isMobile ? 140 : undefined, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 500, ...(isMobile ? { fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}) }}>
                          {fund.legalName || fund.name}
                        </span>
                        <span style={{
                          fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 500, flexShrink: 0,
                          background: fund.indexFund ? "rgba(33,150,243,0.12)" : "rgba(156,39,176,0.10)",
                          color: fund.indexFund ? "#1976d2" : "#7b1fa2",
                        }}>
                          {fund.indexFund ? t("fundSuggestions.filterIndex") : t("fundSuggestions.filterActive")}
                        </span>
                      </div>
                      {!isMobile && <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{fund.category}</div>}
                    </td>
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center" }}>
                      {fund.starRating ? (
                        <span style={{ color: "#f5a623", fontSize: isMobile ? 10 : 12 }}>
                          {"★".repeat(fund.starRating)}{"☆".repeat(5 - fund.starRating)}
                        </span>
                      ) : <span style={{ color: "var(--text-muted)" }}>–</span>}
                    </td>
                    {!isMobile && (
                      <td style={{ ...tdStyle, textAlign: "right", ...mono, fontSize: 11 }}>
                        {fund.ongoingCharge != null ? `${fund.ongoingCharge.toFixed(2)}%` : "–"}
                      </td>
                    )}
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "right", ...mono, fontVariantNumeric: "tabular-nums" }}>
                      {fund.returnM12 != null ? (
                        <span style={{ color: fund.returnM12 >= 0 ? "#089981" : "#f23645" }}>
                          {fund.returnM12 > 0 ? "+" : ""}{fund.returnM12.toFixed(1)}%
                        </span>
                      ) : "–"}
                    </td>
                    {!isMobile && (
                      <td style={{ ...tdStyle, textAlign: "right", ...mono, fontVariantNumeric: "tabular-nums" }}>
                        {fund.returnM36 != null ? (
                          <span style={{ color: fund.returnM36 >= 0 ? "#089981" : "#f23645" }}>
                            {fund.returnM36 > 0 ? "+" : ""}{fund.returnM36.toFixed(1)}%
                          </span>
                        ) : "–"}
                      </td>
                    )}
                    {!isMobile && (
                      <td style={{ ...tdStyle, textAlign: "right", ...mono, fontVariantNumeric: "tabular-nums" }}>
                        {fund.returnM60 != null ? (
                          <span style={{ color: fund.returnM60 >= 0 ? "#089981" : "#f23645" }}>
                            {fund.returnM60 > 0 ? "+" : ""}{fund.returnM60.toFixed(1)}%
                          </span>
                        ) : "–"}
                      </td>
                    )}
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center" }}>
                      {isAdded ? (
                        <span style={{ fontSize: 10, color: "#089981" }}>{t("fundSuggestions.added")}</span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToWatchlist(fund); }}
                          disabled={isAdding}
                          style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 4,
                            border: "1px solid var(--accent)", background: "var(--bg-card)", color: "var(--accent)",
                            cursor: isAdding ? "wait" : "pointer", fontFamily: "inherit",
                            opacity: isAdding ? 0.5 : 1,
                          }}
                        >
                          {isAdding ? "..." : t("fundSuggestions.watch")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "8px 20px 12px" }}>
            {t("fundSuggestions.source", { count: filtered.length })}
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 10px", fontSize: 10, color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" };
const tdStyle = { padding: "8px 10px" };
const thMobile = { padding: "6px 4px", fontSize: 9 };
const tdMobile = { padding: "6px 4px" };
