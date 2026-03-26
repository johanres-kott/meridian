import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Chg } from "./SharedComponents.jsx";

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

const SECTOR_EMOJI = {
  "Technology": "💻", "Tech": "💻",
  "Financial Services": "🏦", "Finans": "🏦",
  "Healthcare": "🏥", "Hälsovård": "🏥",
  "Industrials": "🏭", "Industri": "🏭",
  "Consumer Cyclical": "🛍️", "Konsument": "🛍️",
  "Consumer Defensive": "🛒",
  "Communication Services": "📡", "Kommunikation": "📡",
  "Basic Materials": "⛏️", "Råvaror": "⛏️",
  "Energy": "⚡", "Energi": "⚡",
  "Real Estate": "🏠", "Fastigheter": "🏠",
  "Utilities": "💡",
};

const SECTOR_SV = {
  "Financial Services": "Finans", "Technology": "Tech", "Healthcare": "Hälsovård",
  "Industrials": "Industri", "Consumer Cyclical": "Konsument", "Communication Services": "Kommunikation",
  "Basic Materials": "Råvaror", "Energy": "Energi", "Real Estate": "Fastigheter",
  "Consumer Defensive": "Dagligvaror", "Utilities": "Kraftförsörjning",
};

const PROFILE_LABELS = {
  value: "Värdeinvesterare",
  growth: "Tillväxtinvesterare",
  dividend: "Utdelningsinvesterare",
  mixed: "Blandat",
  index: "Indexinvesterare",
};

function ScoreBadge({ score }) {
  const color = score >= 70 ? "#089981" : score >= 40 ? "#e65100" : "#f23645";
  const bg = score >= 70 ? "rgba(8,153,129,0.15)" : score >= 40 ? "rgba(255,152,0,0.15)" : "rgba(242,54,69,0.15)";
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 6px",
      borderRadius: 3, background: bg, color, fontVariantNumeric: "tabular-nums",
    }}>
      {Math.round(score)}
    </span>
  );
}

export default function SmartSuggestions({ profile, existingTickers, isMobile, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(new Set());
  const [added, setAdded] = useState(new Set());

  const investorType = profile?.investorType || "mixed";
  const riskProfile = profile?.riskProfile;

  useEffect(() => {
    const exclude = (existingTickers || []).join(",");
    const params = new URLSearchParams({ profile: investorType, limit: "25" });
    if (riskProfile) params.set("risk", riskProfile);
    if (exclude) params.set("exclude", exclude);

    fetch(`/api/suggestions?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [investorType, riskProfile, existingTickers]);

  async function addToWatchlist(item) {
    if (adding.has(item.ticker) || added.has(item.ticker)) return;
    setAdding(prev => new Set([...prev, item.ticker]));

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("watchlist").insert({
      ticker: item.ticker, name: item.name, user_id: user.id, status: "Bevakar",
    });

    setAdding(prev => { const n = new Set(prev); n.delete(item.ticker); return n; });
    if (!error) setAdded(prev => new Set([...prev, item.ticker]));
  }

  if (!loading && (!data?.suggestions || data.suggestions.length === 0)) return null;

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        padding: isMobile ? "10px 12px" : "14px 20px", borderBottom: "1px solid var(--border-light)",
        background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Toppförslag för dig</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>
            {PROFILE_LABELS[investorType] || investorType}
          </span>
        </div>
        <button
          onClick={() => onNavigate?.("methodology")}
          style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Hur fungerar poängsättningen? →
        </button>
      </div>

      <div style={{ padding: isMobile ? "8px 0" : "0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "20px" }}>Beräknar förslag...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12, minWidth: isMobile ? 0 : undefined }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), width: isMobile ? 24 : 30, textAlign: "center" }}>#</th>
                {!isMobile && <th style={{ ...thStyle, width: 28 }}></th>}
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "left" }}>Bolag</th>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "center", width: isMobile ? 40 : 50 }}>Poäng</th>
                {!isMobile && <th style={{ ...thStyle, textAlign: "left" }}>Taggar</th>}
                {!isMobile && <th style={{ ...thStyle, textAlign: "left" }}>Sektor</th>}
                {!isMobile && <th style={{ ...thStyle, textAlign: "center" }}>Risk</th>}
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), textAlign: "right" }}>Kurs</th>
                <th style={{ ...thStyle, ...(isMobile ? thMobile : {}), width: isMobile ? 56 : 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.suggestions.map((item, idx) => {
                const isAdding = adding.has(item.ticker);
                const isAdded = added.has(item.ticker);
                return (
                  <tr
                    key={item.ticker}
                    style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>{idx + 1}</td>
                    {!isMobile && <td style={{ ...tdStyle, width: 28, fontSize: 16, textAlign: "center" }}>{getFlag(item.ticker)}</td>}
                    <td
                      style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), color: "var(--text)", maxWidth: isMobile ? 120 : undefined }}
                      onClick={() => onNavigate?.("search", { ticker: item.ticker })}
                    >
                      <div style={{ fontWeight: 500, ...(isMobile ? { fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}) }}>
                        {isMobile ? getFlag(item.ticker) + " " : ""}{item.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", ...mono }}>{item.ticker}</div>
                    </td>
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center" }}>
                      <ScoreBadge score={item.compositeScore} />
                    </td>
                    {!isMobile && (
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {item.highlights?.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(8,153,129,0.15)", color: "#089981", fontWeight: 500 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    {!isMobile && (
                      <td style={{ ...tdStyle, fontSize: 11, color: "var(--text-secondary)" }}>
                        {item.sector && item.sector !== "---" ? (
                          <span>
                            {SECTOR_EMOJI[item.sector] || ""}{" "}
                            {SECTOR_SV[item.sector] || item.sector}
                          </span>
                        ) : "–"}
                      </td>
                    )}
                    {!isMobile && (
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{
                          fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 500,
                          background: item.risk === "low" ? "rgba(8,153,129,0.15)" : item.risk === "medium" ? "rgba(255,152,0,0.15)" : "rgba(242,54,69,0.15)",
                          color: item.risk === "low" ? "#089981" : item.risk === "medium" ? "#e65100" : "#f23645",
                        }}>
                          {item.risk === "low" ? "Låg" : item.risk === "medium" ? "Medel" : "Hög"}
                        </span>
                      </td>
                    )}
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "right", ...mono, fontVariantNumeric: "tabular-nums" }}>
                      {item.price != null ? item.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–"}
                      {!isMobile && <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>{item.currency || "SEK"}</div>}
                    </td>
                    <td style={{ ...tdStyle, ...(isMobile ? tdMobile : {}), textAlign: "center" }}>
                      {isAdded ? (
                        <span style={{ fontSize: 10, color: "#089981" }}>✓ Tillagd</span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToWatchlist(item); }}
                          disabled={isAdding}
                          style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 4,
                            border: "1px solid var(--accent)", background: "var(--bg-card)", color: "var(--accent)",
                            cursor: isAdding ? "wait" : "pointer", fontFamily: "inherit",
                            opacity: isAdding ? 0.5 : 1,
                          }}
                        >
                          {isAdding ? "..." : "+ Bevaka"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {data?.scoredAt && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "8px 20px 12px" }}>
            Poäng beräknade: {new Date(data.scoredAt).toLocaleDateString("sv-SE")} · {data.suggestions?.length || 0} bolag
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
