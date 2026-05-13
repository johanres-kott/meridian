import { useEffect, useMemo, useState } from "react";
import { fetchOwnership } from "../lib/apiClient.js";

const SORT_OPTIONS = [
  { id: "spinoff", label: "Spin-off-flagga" },
  { id: "freefloat", label: "Free float (lågt först)" },
  { id: "largest", label: "Största ägare (störst först)" },
  { id: "name", label: "Namn (A→Ö)" },
];

export default function OwnershipOverlay({ items, onSelect, isMobile }) {
  const stocks = useMemo(
    () => items.filter(i => i.type !== "fund"),
    [items]
  );

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("spinoff");

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

  const rows = useMemo(() => {
    const arr = stocks.map(item => ({
      item,
      ownership: data[item.ticker] ?? null,
    }));

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
        case "name":
          return (a.item.name || a.item.ticker).localeCompare(
            b.item.name || b.item.ticker, "sv"
          );
        default:
          return 0;
      }
    };
    return arr.slice().sort(cmp);
  }, [stocks, data, sort]);

  const candidateCount = rows.filter(r => r.ownership?.isSpinOffCandidate).length;

  if (stocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)", fontSize: 13 }}>
        Inga aktier i bevakningslistan — lägg till ett bolag för att se ägarstrukturen.
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
              Ägarstruktur
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              Free float &lt; 15% + största ägare ≥ 30% flaggas som spin-off-kandidat
            </div>
          </div>
          {candidateCount > 0 && (
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600 }}>
              {candidateCount} spin-off-kandidat{candidateCount === 1 ? "" : "er"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sortera:</span>
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
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && Object.keys(data).length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 12 }}>
          Hämtar ägardata...
        </div>
      )}

      <div style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 560 : undefined }}>
          <thead>
            <tr>
              {[
                { label: "Bolag", align: "left" },
                { label: "Free float", align: "right" },
                { label: "Största ägare", align: "left" },
                { label: "% kapital", align: "right" },
                ...(isMobile ? [] : [{ label: "Top 3", align: "left" }]),
                { label: "Flaggor", align: "left" },
              ].map(h => (
                <th key={h.label} style={{
                  padding: isMobile ? "6px 8px" : "8px 14px",
                  textAlign: h.align,
                  fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, ownership }) => (
              <OwnershipRow
                key={item.id}
                item={item}
                ownership={ownership}
                onSelect={onSelect}
                isMobile={isMobile}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Free float = 100% − insiders − strategiska ägare ≥5% (svensk kurerad data) eller 100% − insiders (Yahoo).
        Spin-off-flaggan sätts bara på bolag med kurerad data eftersom Yahoo inte ser svenska huvudägare som Wallenberg eller Douglas.
        Lock-up perioder och förvärvsplaner är inte tillgängliga i strukturerad form och visas därför inte.
      </div>
    </div>
  );
}

function OwnershipRow({ item, ownership, onSelect, isMobile }) {
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
          <div style={{ fontWeight: 500 }}>{item.name || item.ticker}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{item.ticker}</div>
        </td>
        <td colSpan={isMobile ? 4 : 5} style={{ ...cellStyle, color: "var(--text-muted)", fontStyle: "italic", fontSize: 11 }}>
          Ingen ägardata
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
        <div style={{ fontWeight: 500 }}>{item.name || item.ticker}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{item.ticker}</div>
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
      <td style={numStyle}>
        {largest ? `${largest.pctHeld.toFixed(1)}%` : "—"}
      </td>
      {!isMobile && (
        <td style={cellStyle}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {top3.length > 0 ? top3.map((h, i) => (
              <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginRight: 6 }}>
                  {h.pctHeld.toFixed(1)}%
                </span>
                {h.name}
              </div>
            )) : "—"}
          </div>
        </td>
      )}
      <td style={cellStyle}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {ownership.isSpinOffCandidate && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600 }}>
              Spin-off
            </span>
          )}
          {ownership.isLowFloat && !ownership.isSpinOffCandidate && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(242,54,69,0.12)", color: "#f23645", fontWeight: 600 }}>
              Lågt float
            </span>
          )}
          {ownership.source === "curated" && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(8,153,129,0.12)", color: "#089981", fontWeight: 500 }}>
              Kurerad
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
