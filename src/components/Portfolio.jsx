import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { Treemap, ResponsiveContainer } from "recharts";
import PdfImportModal from "./PdfImportModal.jsx";
import ImportGuide from "./ImportGuide.jsx";
import CompanyView from "./CompanyView.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { matchStock } from "../lib/profileMatcher.js";
import { sanitizeInput } from "../lib/sanitize.js";
import PortfolioChart from "./PortfolioChart.jsx";
import AllocationCard from "./AllocationCard.jsx";
import Markdown from "./Markdown.jsx";
import { STATUSES, STATUS_COLORS, getFlag } from "../constants.js";
import { useFxRates } from "../hooks/useFxRates.js";

async function fetchPrice(ticker) {
  try {
    const res = await fetch(`/api/company?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function AddCompanyBar({ onAdd, isMobile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const sanitized = sanitizeInput(query);
    if (sanitized.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(sanitized)}`);
        const data = await res.json();
        const filtered = (data.result || []).filter(r => r.type === "Common Stock").slice(0, 6);
        setResults(filtered);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function select(r) {
    const ticker = r.symbol.replace(/ /g, "-");
    onAdd({ ticker, name: r.description });
    setQuery("");
    setResults([]);
  }

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Lägg till bolag — sök på namn eller ticker..."
        style={{ width: "100%", maxWidth: isMobile ? "100%" : undefined, boxSizing: isMobile ? "border-box" : undefined, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", color: "var(--text)", background: "var(--bg-card)" }}
      />
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, marginTop: 4 }}>
          {results.map(r => (
            <div key={r.symbol} onClick={() => select(r)}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}
            >
              <span style={{ fontWeight: 500, color: "var(--text)" }}>{r.description}</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>{r.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupTagPopover({ item, groups, onToggle, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (!groups.length) return (
    <div ref={ref} style={{ position: "absolute", top: "100%", right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "12px 16px", zIndex: 200, minWidth: 180, marginTop: 4 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Inga grupper skapade</div>
    </div>
  );

  return (
    <div ref={ref} style={{ position: "absolute", top: "100%", right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "6px 0", zIndex: 200, minWidth: 180, marginTop: 4 }}>
      {groups.map(g => {
        const isMember = (g.members || []).includes(item.id);
        return (
          <div key={g.name} onClick={() => onToggle(g.name, item.id)}
            style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 3,
              border: isMember ? "none" : "1px solid var(--border)",
              background: isMember ? "var(--accent)" : "var(--bg-card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 600,
            }}>
              {isMember ? "\u2713" : ""}
            </div>
            <span style={{ color: "var(--text)" }}>{g.name}</span>
          </div>
        );
      })}
    </div>
  );
}

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

function PortfolioTreemap({ items, prices, fxRates, onSelect, isMobile }) {
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

function CompanyRow({ item, onUpdate, onSelect, onDelete, fxRates = {}, groups = [], onToggleGroup, investmentHolding = null, showInvestmentCols = false, showStatus = true, isMobile = false, investorProfile = null, scoreData = null, priceData = null }) {
  const [price, setPrice] = useState(priceData);
  const [tagOpen, setTagOpen] = useState(false);

  useEffect(() => {
    if (priceData) { setPrice(priceData); return; }
    fetchPrice(item.ticker).then(d => { if (d && d.price) setPrice(d); });
  }, [item.ticker, priceData]);

  const chg = price?.changePercent;
  const chgColor = chg > 0 ? "#089981" : chg < 0 ? "#f23645" : "var(--text-secondary)";
  const totalValue = (item.shares && price?.price) ? (price.price * item.shares) : null;

  // P&L: GAV from Avanza is in SEK, so convert current price to SEK first
  const currency = price?.currency || "SEK";
  const fxRate = fxRates[currency] || null;
  const priceSek = (price?.price && fxRate) ? price.price * fxRate : null;
  const pl = (item.gav && item.shares && priceSek) ? ((priceSek - item.gav) * item.shares) : null;
  const plPct = (item.gav && priceSek) ? ((priceSek - item.gav) / item.gav * 100) : null;

  const itemGroups = groups.filter(g => (g.members || []).includes(item.id));
  const tdBase = { padding: isMobile ? "6px 8px" : "10px 14px", borderBottom: "1px solid var(--border-light)" };

  return (
    <tr
      onClick={() => onSelect(item)}
      style={{ cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <td style={{ ...tdBase, width: 36 }}>{getFlag(item.ticker)}</td>
      <td style={tdBase}>
        <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text)" }}>{item.name || item.ticker}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>{item.ticker}</span>
          {scoreData && (() => {
            const profileType = investorProfile?.investorType || "mixed";
            const compositeScore = scoreData.composite?.[profileType] ?? scoreData.composite?.mixed;
            if (compositeScore == null) return null;
            const color = compositeScore >= 70 ? "#089981" : compositeScore >= 40 ? "#ff9800" : "#f23645";
            const bg = compositeScore >= 70 ? "rgba(8,153,129,0.15)" : compositeScore >= 40 ? "rgba(255,152,0,0.15)" : "rgba(242,54,69,0.15)";
            return (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: bg, color, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                {Math.round(compositeScore)}
              </span>
            );
          })()}
          {scoreData?.scores?.piotroski?.raw >= 7 && (
            <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, background: "var(--accent-light)", color: "#089981", fontWeight: 500 }}>
              F-Score {scoreData.scores.piotroski.raw}/9
            </span>
          )}
        </div>
      </td>
      {showStatus && (
        <td style={tdBase} onClick={e => e.stopPropagation()}>
          {isMobile ? (
            <div
              title={item.status}
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background: STATUS_COLORS[item.status]?.color || "#787b86",
                margin: "0 auto",
              }}
            />
          ) : (
            <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value })}
              style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, background: STATUS_COLORS[item.status]?.bg || "var(--bg-secondary)", color: STATUS_COLORS[item.status]?.color || "var(--text-secondary)" }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </td>
      )}
      {!isMobile && (
        <td style={{ ...tdBase, whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", position: "relative" }}>
            {itemGroups.map(g => (
              <span key={g.name} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "var(--border-light)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{g.name}</span>
            ))}
            <button onClick={() => setTagOpen(!tagOpen)}
              style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, border: "1px dashed var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1.4 }}
              title="Hantera grupper"
            >+</button>
            {tagOpen && <GroupTagPopover item={item} groups={groups} onToggle={onToggleGroup} onClose={() => setTagOpen(false)} />}
          </div>
        </td>
      )}
      {showInvestmentCols && (
        <td style={{ ...tdBase, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--text)" }}>
          {investmentHolding?.weight != null ? `${investmentHolding.weight}%` : "–"}
        </td>
      )}
      {showInvestmentCols && (
        <td style={{ ...tdBase, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--text)" }}>
          {investmentHolding?.valueMSEK != null ? formatHoldingValue(investmentHolding.valueMSEK) : "–"}
        </td>
      )}
      <td style={{ ...tdBase, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
        {price ? (
          <>
            <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text)" }}>{price.price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {price.currency || ""}</div>
            {chg != null && <div style={{ fontSize: 11, color: chgColor }}>{chg > 0 ? "+" : ""}{chg.toFixed(2)}%</div>}
          </>
        ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Hämtar...</span>}
      </td>
      <td style={{ ...tdBase, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
        {totalValue !== null ? (
          <>
            {currency !== "SEK" && fxRate ? (
              <>
                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text)" }}>{(totalValue * fxRate).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.shares} st à {price.price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text)" }}>{totalValue.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} {currency}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.shares} st</div>
              </>
            )}
          </>
        ) : null}
      </td>
      {!isMobile && (
        <td style={{ ...tdBase, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
          {pl !== null ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: pl >= 0 ? "#089981" : "#f23645" }}>{pl >= 0 ? "+" : ""}{pl.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</div>
              <div style={{ fontSize: 11, color: pl >= 0 ? "#089981" : "#f23645" }}>{plPct >= 0 ? "+" : ""}{plPct?.toFixed(1)}%</div>
            </>
          ) : null}
        </td>
      )}
      <td style={{ ...tdBase, textAlign: "center", width: 36 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => { if (window.confirm(`Ta bort ${item.name || item.ticker} från portföljen?`)) onDelete(item.id); }}
          title="Ta bort"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: "2px 6px", lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = "#f23645"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          ×
        </button>
      </td>
    </tr>
  );
}

export default function Portfolio({ preferences = {}, onUpdatePreferences, deepLink, onClearDeepLink, userId }) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selected, setSelected] = useState(null);
  const { fxRates } = useFxRates();
  const [activeGroup, setActiveGroup] = useState(null); // null = "Alla"
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [scores, setScores] = useState({});
  const [prices, setPrices] = useState({});

  const groups = preferences.groups || [];

  useEffect(() => { load(); loadScores(); }, []);

  async function loadScores() {
    try {
      const res = await fetch("/api/suggestions?limit=300");
      const data = await res.json();
      const list = data?.suggestions || (Array.isArray(data) ? data : []);
      const map = {};
      list.forEach(s => { map[s.ticker?.toUpperCase()] = s; });
      setScores(map);
    } catch {}
  }

  // Handle deep link from Översikt
  useEffect(() => {
    if (!deepLink?.ticker || loading || items.length === 0) return;
    const match = items.find(i => i.ticker.toUpperCase() === deepLink.ticker.toUpperCase());
    if (match) {
      setSelected(match);
      onClearDeepLink?.();
    }
  }, [deepLink, loading, items]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at");
    setItems(data || []);
    setLoading(false);
    if (data && data.length > 0) {
      // Only fetch prices for items with shares (needed for treemap + allocation)
      // This avoids hitting rate limits (58 items → ~8 with shares)
      const withShares = data.filter(item => item.shares > 0);
      if (withShares.length > 0) {
        const results = await Promise.all(
          withShares.map(item =>
            fetchPrice(item.ticker).then(d => d?.price ? [item.ticker, d] : null)
          )
        );
        const map = {};
        for (const r of results) { if (r) map[r[0]] = r[1]; }
        setPrices(map);
      }
    }
  }


  async function addCompany({ ticker, name }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("watchlist").insert({ ticker, name, user_id: user.id, status: "Bevakar" }).select().single();
    if (!error) {
      setItems(prev => [...prev, data]);
      // Auto-add to active group if one is selected
      if (activeGroup && data) {
        toggleGroupMember(activeGroup, data.id);
      }
    }
  }

  async function updateItem(id, updates) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("watchlist").update(updates).eq("id", id).eq("user_id", user.id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (selected && selected.id === id) setSelected(prev => ({ ...prev, ...updates }));
  }

  async function deleteItem(id) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("watchlist").delete().eq("id", id).eq("user_id", user.id);
    setItems(prev => prev.filter(i => i.id !== id));
    // Remove from all groups
    const updated = groups.map(g => ({
      ...g,
      members: (g.members || []).filter(m => m !== id),
    }));
    if (JSON.stringify(updated) !== JSON.stringify(groups)) {
      onUpdatePreferences({ groups: updated });
    }
  }

  function createGroup() {
    const name = sanitizeInput(newGroupName);
    if (!name) return;
    if (groups.some(g => g.name === name)) return;
    const updated = [...groups, { name, members: [] }];
    onUpdatePreferences({ groups: updated });
    setNewGroupName("");
    setCreatingGroup(false);
    setActiveGroup(name);
  }

  function deleteGroup(name) {
    if (!window.confirm(`Ta bort gruppen "${name}"?`)) return;
    const updated = groups.filter(g => g.name !== name);
    onUpdatePreferences({ groups: updated });
    if (activeGroup === name) setActiveGroup(null);
  }

  function renameGroup(oldName, newName) {
    const trimmed = sanitizeInput(newName);
    if (!trimmed || trimmed === oldName) return;
    if (groups.some(g => g.name === trimmed)) return;
    const updated = groups.map(g => g.name === oldName ? { ...g, name: trimmed } : g);
    onUpdatePreferences({ groups: updated });
    if (activeGroup === oldName) setActiveGroup(trimmed);
  }

  function toggleGroupMember(groupName, itemId) {
    const updated = groups.map(g => {
      if (g.name !== groupName) return g;
      const members = g.members || [];
      if (members.includes(itemId)) {
        return { ...g, members: members.filter(m => m !== itemId) };
      } else {
        return { ...g, members: [...members, itemId] };
      }
    });
    onUpdatePreferences({ groups: updated });
  }

  if (loading) return <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Laddar...</div>;

  async function importHoldings(holdings) {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = holdings.map(h => ({
      ticker: h.ticker, name: h.name, user_id: user.id,
      status: "Bevakar", shares: h.shares, gav: h.gav,
    }));
    const { data, error } = await supabase.from("watchlist").insert(rows).select();
    if (!error && data) {
      setItems(prev => [...prev, ...data]);
      // Auto-add imported items to active group
      if (activeGroup) {
        const newIds = data.map(d => d.id);
        const updated = groups.map(g => {
          if (g.name !== activeGroup) return g;
          return { ...g, members: [...(g.members || []), ...newIds] };
        });
        onUpdatePreferences({ groups: updated });
      }
    }
    return { data, error };
  }

  if (selected) {
    const freshItem = items.find(i => i.id === selected.id) || selected;
    return <CompanyView item={freshItem} onBack={() => setSelected(null)} onUpdate={updateItem} investorType={preferences.investorProfile?.investorType} investorProfile={preferences.investorProfile} />;
  }

  // Filter items by active group
  const filteredItems = activeGroup
    ? items.filter(item => {
        const group = groups.find(g => g.name === activeGroup);
        return group && (group.members || []).includes(item.id);
      })
    : items;

  const hasAnyShares = filteredItems.some(i => i.shares);
  const hasAnyPL = filteredItems.some(i => i.gav && i.shares);

  return (
    <div>
      {showImport && (
        <PdfImportModal
          onClose={() => setShowImport(false)}
          existingTickers={items.map(i => i.ticker)}
          onImport={importHoldings}
        />
      )}
      {showGuide && (
        <ImportGuide
          onClose={() => setShowGuide(false)}
          onStartImport={() => setShowImport(true)}
        />
      )}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, gap: isMobile ? 12 : 0 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text)", marginBottom: 4 }}>Portfölj</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {activeGroup ? `${filteredItems.length} bolag i ${activeGroup}` : `${items.length} bolag`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexDirection: "row" }}>
          <button onClick={() => {
            const rows = [["Bolag", "Ticker", "Status", "Antal", "GAV", "Kurs", "Valuta"].join(";")];
            items.forEach(i => {
              rows.push([i.name || "", i.ticker, i.status || "", i.shares || "", i.gav || "", "", ""].join(";"));
            });
            const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "thesion-portfolj.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
            title="Exportera CSV"
            style={{ padding: isMobile ? "7px 10px" : "7px 16px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text)" }}>
            {isMobile ? "⬇ CSV" : "Exportera CSV"}
          </button>
          <button onClick={() => setShowImport(true)}
            title="Importera portfölj"
            style={{ padding: isMobile ? "7px 10px" : "7px 16px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text)" }}>
            {isMobile ? "⬆ Import" : "Importera portfölj"}
          </button>
          <button onClick={() => setShowGuide(true)}
            title="Hur importerar jag?"
            style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text-secondary)" }}>
            ?
          </button>
        </div>
      </div>

      {/* Investment strategy card */}
      {preferences.investmentPlan?.text && (() => {
        const text = preferences.investmentPlan.text;
        // Parse sections: look for **VARFÖR...**, **VAD...**, **HUR...**, **Motivering** (or ## variants)
        // Consume the entire header line so leftover text doesn't leak into content
        const sectionRegex = /(?:^|\n)\s*(?:\*\*|#{1,3}\s*)(Varf[öo]r|Vad|Hur|Motivering)\b[^\n]*\n?/gi;
        const sections = {};
        let matches = [];
        let m;
        while ((m = sectionRegex.exec(text)) !== null) {
          const rawKey = m[1].toLowerCase().replace("ö", "o");
          const key = rawKey === "motivering" ? "motivering" : rawKey;
          matches.push({ key, index: m.index, end: m.index + m[0].length });
        }
        if (matches.length >= 2) {
          for (let i = 0; i < matches.length; i++) {
            const nextStart = i + 1 < matches.length ? matches[i + 1].index : text.length;
            sections[matches[i].key] = text.slice(matches[i].end, nextStart).trim();
          }
          // Text before first section
          const preamble = text.slice(0, matches[0].index).trim();
          return (
            <div style={{
              marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent-light), var(--bg-secondary))",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                  Din investeringsstrategi
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Sparad {new Date(preferences.investmentPlan.savedAt).toLocaleDateString("sv-SE")}
                </div>
              </div>
              {preamble && <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 10 }}><Markdown text={preamble} /></div>}
              {sections.varfor && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 12, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Varför</div>
                  <Markdown text={sections.varfor} />
                </div>
              )}
              <div style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {sections.vad && (
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Vad</div>
                    <Markdown text={sections.vad} />
                  </div>
                )}
                {sections.hur && (
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Hur</div>
                    <Markdown text={sections.hur} />
                  </div>
                )}
              </div>
              {sections.motivering && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Motivering</div>
                  <Markdown text={sections.motivering} />
                </div>
              )}
              <button
                onClick={() => onUpdatePreferences({ investmentPlan: null })}
                style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Ta bort strategi
              </button>
            </div>
          );
        }
        // Fallback: render as before if sections not detected
        return (
          <div style={{
            marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-light), var(--bg-secondary))",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                Din investeringsstrategi
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Sparad {new Date(preferences.investmentPlan.savedAt).toLocaleDateString("sv-SE")}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
              <Markdown text={text} />
            </div>
            <button
              onClick={() => onUpdatePreferences({ investmentPlan: null })}
              style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Ta bort strategi
            </button>
          </div>
        );
      })()}

      {/* Allocation analysis */}
      <AllocationCard
        items={items}
        scores={scores}
        prices={prices}
        fxRates={fxRates}
        riskProfile={preferences.investorProfile?.riskProfile || "medium"}
        isMobile={isMobile}
      />

      {/* Group filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : undefined, WebkitOverflowScrolling: isMobile ? "touch" : undefined, paddingBottom: isMobile ? 4 : undefined }}>
        <button
          onClick={() => setActiveGroup(null)}
          style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 14,
            border: activeGroup === null ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: activeGroup === null ? "var(--accent-light)" : "var(--bg-card)",
            color: activeGroup === null ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer", fontFamily: "inherit", fontWeight: activeGroup === null ? 500 : 400,
            flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          Alla ({items.length})
        </button>
        {groups.map(g => {
          const count = (g.members || []).filter(m => items.some(i => i.id === m)).length;
          const isActive = activeGroup === g.name;
          return (
            <div key={g.name} style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => setActiveGroup(isActive ? null : g.name)}
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 14,
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: isActive ? "var(--accent-light)" : "var(--bg-card)",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: isActive ? 500 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {g.name} ({count})
              </button>
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(g.name); }}
                  title="Ta bort grupp"
                  style={{ marginLeft: 2, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f23645"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {creatingGroup ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") { setCreatingGroup(false); setNewGroupName(""); } }}
              autoFocus
              placeholder="Gruppnamn..."
              style={{ fontSize: 12, padding: "4px 10px", border: "1px solid var(--accent)", borderRadius: 14, outline: "none", fontFamily: "inherit", width: 140, background: "var(--bg-card)", color: "var(--text)" }}
            />
            <button onClick={createGroup} style={{ fontSize: 11, padding: "4px 8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
            <button onClick={() => { setCreatingGroup(false); setNewGroupName(""); }} style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Avbryt</button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingGroup(true)}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 14, border: "1px dashed var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            + Ny grupp
          </button>
        )}
      </div>

      <AddCompanyBar onAdd={addCompany} isMobile={isMobile} />
      <PortfolioTreemap items={filteredItems} prices={prices} fxRates={fxRates} onSelect={setSelected} isMobile={isMobile} />

      {items.some(i => i.shares) && userId && <PortfolioChart userId={userId} />}

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)", fontSize: 13 }}>
          {activeGroup
            ? `Inga bolag i "${activeGroup}" — klicka + på en rad för att lägga till`
            : "Inga bolag ännu — sök efter ett bolag ovan för att lägga till"}
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 480 : undefined }}>
            <thead>
              <tr>
                {["", "Bolag", "Status", ...(isMobile ? [] : ["Grupper"]), "Kurs", ...(hasAnyShares ? ["Värde"] : []), ...(!isMobile && hasAnyPL ? ["P&L"] : []), " "].map(h => (
                  <th key={h || "flag"} style={{
                    padding: isMobile ? "6px 8px" : "8px 14px",
                    textAlign: ["Kurs", "Värde", "P&L"].includes(h) ? "right" : "left",
                    fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <CompanyRow key={item.id} item={item} onUpdate={updateItem} onSelect={setSelected} onDelete={deleteItem} fxRates={fxRates} groups={groups} onToggleGroup={toggleGroupMember} isMobile={isMobile} investorProfile={preferences.investorProfile} scoreData={scores[item.ticker?.toUpperCase()]} priceData={prices[item.ticker] || null} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile matching legend */}
      {preferences.investorProfile && filteredItems.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
            Hur vi poängsätter bolag
          </summary>
          <div style={{ marginTop: 8, padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 6, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(8,153,129,0.15)", color: "#089981", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>82</span>
                Totalpoäng 70–100: Stark matchning med din profil
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>55</span>
                Totalpoäng 40–69: Okej matchning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(242,54,69,0.15)", color: "#f23645", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>25</span>
                Totalpoäng 0–39: Svag matchning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, background: "var(--accent-light)", color: "#089981", fontWeight: 500, flexShrink: 0 }}>F-Score 8/9</span>
                Piotroski F-Score ≥ 7 — hög finansiell kvalitet
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
              Poäng baseras på Piotroski F-Score, Magic Formula, tillväxt, utdelning och kvalitet. Viktas efter din investerarprofil. Utgör inte finansiell rådgivning.
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
