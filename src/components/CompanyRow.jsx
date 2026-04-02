import { useState, useEffect, useRef } from "react";
import { STATUSES, STATUS_COLORS, getFlag } from "../constants.js";
import { formatHoldingValue } from "./PortfolioTreemap.jsx";

async function fetchPrice(ticker) {
  try {
    const res = await fetch(`/api/company?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

export default function CompanyRow({ item, onUpdate, onSelect, onDelete, fxRates = {}, groups = [], onToggleGroup, investmentHolding = null, showInvestmentCols = false, showStatus = true, isMobile = false, investorProfile = null, scoreData = null, priceData = null }) {
  const [price, setPrice] = useState(priceData);
  const [tagOpen, setTagOpen] = useState(false);

  useEffect(() => {
    if (priceData) { setPrice(priceData); return; }
    fetchPrice(item.ticker).then(d => { if (d && d.price) setPrice(d); });
  }, [item.ticker, priceData]);

  const chg = price?.changePercent;
  const chgColor = chg > 0 ? "#089981" : chg < 0 ? "#f23645" : "var(--text-secondary)";
  const totalValue = (item.shares && price?.price) ? (price.price * item.shares) : null;

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
