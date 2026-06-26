import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchOwnership } from "../lib/apiClient.js";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import { baseTicker, shareClass } from "../lib/shareClass.js";
import ShareClassBadge from "./ShareClassBadge.jsx";

const SORT_OPTIONS = [
  { id: "spinoff" },
  { id: "freefloat" },
  { id: "largest" },
  { id: "votegap" },
  { id: "name" },
];

// A holder has a meaningful A/B asymmetry when voting share clearly exceeds capital share.
// 1.3× threshold filters out rounding noise — true A/B structures (Wallenberg, Stenbeck,
// Douglas, Lundberg etc.) typically sit at 2–5×.
const DUAL_CLASS_RATIO = 1.3;
const DUAL_CLASS_MIN_CAPITAL_PCT = 3;

function isDualClassHolder(h) {
  return h.pctVotes != null
    && h.pctHeld >= DUAL_CLASS_MIN_CAPITAL_PCT
    && h.pctVotes / Math.max(h.pctHeld, 0.01) >= DUAL_CLASS_RATIO;
}

function maxVoteGap(holders) {
  let max = 0;
  for (const h of holders || []) {
    if (h.pctVotes == null) continue;
    const gap = h.pctVotes - h.pctHeld;
    if (gap > max) max = gap;
  }
  return max;
}

export default function OwnershipOverlay({ onSelect, isMobile }) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [items, setItems] = useState([]);
  const stocks = useMemo(
    () => items.filter(i => i.type !== "fund"),
    [items]
  );

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("spinoff");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at");
      if (!cancelled) setItems(data || []);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (stocks.length === 0) return;
    let cancelled = false;
    setLoading(true);

    const tickers = stocks.map(s => s.ticker).filter(Boolean);
    Promise.all(
      tickers.map(t => fetchOwnership(t).then(d => [t, d]))
    ).then(results => {
      if (cancelled) return;
      const map = {};
      for (const [t, d] of results) {
        if (d) map[t] = d;
      }
      setData(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [stocks]);

  // Group stocks by base ticker so A and B shares of the same company collapse to one row.
  // Ownership data is functionally identical across share classes (same company, same holders);
  // we use the first non-null result. Click prefers the share class the user actually owns.
  const groups = useMemo(() => {
    const map = new Map();
    for (const s of stocks) {
      const key = baseTicker(s.ticker);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()].map(([base, classItems]) => {
      const primary = classItems.find(i => i.shares > 0) ?? classItems[0];
      const ownership = classItems.map(i => data[i.ticker]).find(Boolean) ?? null;
      const classes = classItems.map(i => shareClass(i.ticker)).filter(Boolean).sort();
      return { base, primary, classItems, classes, ownership };
    });
  }, [stocks, data]);

  const rows = useMemo(() => {
    const arr = groups.map(g => ({ ...g, item: g.primary }));

    const cmp = (a, b) => {
      const oa = a.ownership;
      const ob = b.ownership;
      // Rows without data sink to bottom
      if (!oa && !ob) return 0;
      if (!oa) return 1;
      if (!ob) return -1;

      switch (sort) {
        case "spinoff":
          if (oa.isSpinOffCandidate !== ob.isSpinOffCandidate) {
            return oa.isSpinOffCandidate ? -1 : 1;
          }
          return (oa.freeFloatPercent ?? 100) - (ob.freeFloatPercent ?? 100);
        case "freefloat":
          return (oa.freeFloatPercent ?? 100) - (ob.freeFloatPercent ?? 100);
        case "largest":
          return (ob.largestHolder?.pctHeld ?? 0) - (oa.largestHolder?.pctHeld ?? 0);
        case "votegap":
          return maxVoteGap(ob.topHolders) - maxVoteGap(oa.topHolders);
        case "name":
          return (a.item.name || a.item.ticker).localeCompare(
            b.item.name || b.item.ticker, "sv"
          );
        default:
          return 0;
      }
    };
    return arr.slice().sort(cmp);
  }, [groups, sort]);

  const candidateCount = rows.filter(r => r.ownership?.isSpinOffCandidate).length;

  if (stocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)", fontSize: 13 }}>
        {t("ownershipOverlay.noStocks")}
      </div>
    );
  }

  return (
    <div>
      {/* Intro / context */}
      <div style={{
        marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
        background: "var(--bg-card)", border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
              {t("ownershipOverlay.sectionTitle")}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              {t("ownershipOverlay.spinOffCriteria")}
            </div>
          </div>
          {candidateCount > 0 && (
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600 }}>
              {t("ownershipOverlay.spinOffCandidates", { count: candidateCount })}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("ownershipOverlay.sort.label")}</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              style={{
                padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 12,
                background: sort === opt.id ? "var(--accent-light)" : "var(--bg-card)",
                color: sort === opt.id ? "#089981" : "var(--text-secondary)",
                fontSize: 11, fontWeight: sort === opt.id ? 600 : 500, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t(`ownershipOverlay.sort.${opt.id}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && Object.keys(data).length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 12 }}>
          {t("ownershipOverlay.loadingData")}
        </div>
      )}

      <div style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 560 : undefined }}>
          <thead>
            <tr>
              {[
                { key: "company", label: t("ownershipOverlay.table.company"), align: "left" },
                { key: "freeFloat", label: t("ownershipOverlay.table.freeFloat"), align: "right" },
                { key: "largestHolder", label: t("ownershipOverlay.table.largestHolder"), align: "left" },
                { key: "capitalVotes", label: t("ownershipOverlay.table.capitalVotes"), align: "left" },
                ...(isMobile ? [] : [{ key: "top3", label: t("ownershipOverlay.table.top3"), align: "left" }]),
                { key: "flags", label: t("ownershipOverlay.table.flags"), align: "left" },
              ].map(h => (
                <th key={h.key} style={{
                  padding: isMobile ? "6px 8px" : "8px 14px",
                  textAlign: h.align,
                  fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, ownership, classes }) => (
              <OwnershipRow
                key={item.id}
                item={item}
                ownership={ownership}
                classes={classes}
                onSelect={onSelect}
                isMobile={isMobile}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <DualBar pctCapital={20} pctVotes={45} width={50} />
          <span>{t("ownershipOverlay.legend.barExplain")}</span>
        </div>
        {t("ownershipOverlay.legend.freeFloatDef")}{" "}
        {t("ownershipOverlay.legend.spinOffNote")}{" "}
        {t("ownershipOverlay.legend.lockupNote")}
      </div>

    </div>
  );
}

// Compact dual bar: capital (gray) above, votes (orange when higher, green when equal/lower).
// When pctVotes is null or matches pctCapital, only the capital bar shows — keeps non-dual-class
// companies visually quiet so the A/B asymmetry pops on companies that have it.
function DualBar({ pctCapital, pctVotes, width = 70 }) {
  const cap = pctCapital ?? 0;
  const votes = pctVotes;
  const showVotes = votes != null && Math.abs(votes - cap) >= 0.5;
  const votesHigher = showVotes && votes > cap;

  return (
    <div style={{ width, display: "inline-block", verticalAlign: "middle" }}>
      <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(cap, 100)}%`, height: "100%",
          background: "var(--text-muted)",
        }} />
      </div>
      {showVotes && (
        <div style={{ height: 4, marginTop: 2, background: "var(--bg-secondary)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(votes, 100)}%`, height: "100%",
            background: votesHigher ? "#ff9800" : "#089981",
          }} />
        </div>
      )}
    </div>
  );
}

function OwnershipRow({ item, ownership, classes = [], onSelect, isMobile }) {
  const { t } = useTranslation();
  const isGrouped = classes.length > 1;
  const tickerLabel = isGrouped ? `${baseTicker(item.ticker)} · ${classes.join("/")}` : item.ticker;
  const cellStyle = {
    padding: isMobile ? "8px 8px" : "10px 14px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 12, color: "var(--text)",
  };
  const numStyle = { ...cellStyle, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" };

  const handleClick = () => onSelect?.(item);

  if (!ownership) {
    return (
      <tr onClick={handleClick} style={{ cursor: "pointer" }}>
        <td style={cellStyle}>
          <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            {item.name || item.ticker}
            <ShareClassBadge ticker={item.ticker} classes={isGrouped ? classes : undefined} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{tickerLabel}</div>
        </td>
        <td colSpan={isMobile ? 4 : 5} style={{ ...cellStyle, color: "var(--text-muted)", fontStyle: "italic", fontSize: 11 }}>
          {t("ownershipOverlay.noData")}
        </td>
      </tr>
    );
  }

  const top3 = (ownership.topHolders || []).slice(0, 3);
  const float = ownership.freeFloatPercent;
  const largest = ownership.largestHolder;

  return (
    <tr
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
    >
      <td style={cellStyle}>
        <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          {item.name || item.ticker}
          <ShareClassBadge ticker={item.ticker} classes={isGrouped ? classes : undefined} />
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{tickerLabel}</div>
      </td>
      <td style={{ ...numStyle, color: ownership.isLowFloat ? "#ff9800" : "var(--text)", fontWeight: ownership.isLowFloat ? 600 : 500 }}>
        {float != null ? `${float.toFixed(1)}%` : "—"}
      </td>
      <td style={cellStyle}>
        {largest ? (
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 120 : 180 }} title={largest.name}>
            {largest.name}
          </div>
        ) : "—"}
      </td>
      <td style={cellStyle}>
        {largest ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            title={largest.pctVotes != null
              ? t("ownershipOverlay.titleCapitalVotes", { capital: largest.pctHeld.toFixed(1), votes: largest.pctVotes.toFixed(1) })
              : t("ownershipOverlay.titleCapitalOnly", { capital: largest.pctHeld.toFixed(1) })}
          >
            <DualBar pctCapital={largest.pctHeld} pctVotes={largest.pctVotes} width={isMobile ? 50 : 70} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, lineHeight: 1.2, color: "var(--text-secondary)" }}>
              <div style={{ color: "var(--text)" }}>{largest.pctHeld.toFixed(1)}%</div>
              {largest.pctVotes != null && Math.abs(largest.pctVotes - largest.pctHeld) >= 0.5 && (
                <div style={{ color: largest.pctVotes > largest.pctHeld ? "#ff9800" : "var(--text-muted)" }}>
                  {largest.pctVotes.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        ) : "—"}
      </td>
      {!isMobile && (
        <td style={cellStyle}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {top3.length > 0 ? top3.map((h, i) => {
              const showVotes = h.pctVotes != null && Math.abs(h.pctVotes - h.pctHeld) >= 0.5;
              const votesHigher = showVotes && h.pctVotes > h.pctHeld;
              return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: i < top3.length - 1 ? 3 : 0 }}
                  title={showVotes
                    ? t("ownershipOverlay.titleCapitalVotes", { capital: h.pctHeld.toFixed(1), votes: h.pctVotes.toFixed(1) })
                    : t("ownershipOverlay.titleCapitalOnly", { capital: h.pctHeld.toFixed(1) })}
                >
                  <DualBar pctCapital={h.pctHeld} pctVotes={h.pctVotes} width={50} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--text-muted)", minWidth: 32 }}>
                    {h.pctHeld.toFixed(1)}%
                    {showVotes && (
                      <span style={{ color: votesHigher ? "#ff9800" : "var(--text-muted)", marginLeft: 3 }}>
                        /{h.pctVotes.toFixed(1)}
                      </span>
                    )}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                    {h.name}
                  </span>
                </div>
              );
            }) : "—"}
          </div>
        </td>
      )}
      <td style={cellStyle}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {ownership.isSpinOffCandidate && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600 }}>
              {t("ownershipOverlay.flags.spinOff")}
            </span>
          )}
          {(isDualClassHolder(ownership.largestHolder || {}) || (ownership.topHolders || []).some(isDualClassHolder)) && (
            <span
              title={t("ownershipOverlay.flags.dualClassTitle")}
              style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(255,152,0,0.12)", color: "#ff9800", fontWeight: 600 }}
            >
              {t("ownershipOverlay.flags.dualClass")}
            </span>
          )}
          {ownership.isLowFloat && !ownership.isSpinOffCandidate && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(242,54,69,0.12)", color: "#f23645", fontWeight: 600 }}>
              {t("ownershipOverlay.flags.lowFloat")}
            </span>
          )}
          {ownership.source === "curated" && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(8,153,129,0.12)", color: "#089981", fontWeight: 500 }}>
              {t("ownershipOverlay.flags.curated")}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
