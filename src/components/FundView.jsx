import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { STATUSES, STATUS_COLORS } from "../constants.js";
import { fetchFund } from "../lib/apiClient.js";
import NotesSection from "./company/NotesSection.jsx";

function StatCard({ label, value, sub, tip }) {
  return (
    <div title={tip} style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "12px 14px", minWidth: 110 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ReturnBar({ label, value }) {
  if (value == null) return null;
  const color = value >= 0 ? "#089981" : "#f23645";
  const width = Math.min(Math.abs(value), 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color }}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function FundView({ item, onBack, onUpdate }) {
  const isMobile = useIsMobile();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFund(item.ticker).then(d => {
      setFund(d);
      setLoading(false);
    });
  }, [item.ticker]);

  const pl = (item.gav && item.shares && fund?.nav) ? ((fund.nav - item.gav) * item.shares) : null;
  const plPct = (item.gav && fund?.nav) ? ((fund.nav - item.gav) / item.gav * 100) : null;

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}>
          &larr; Tillbaka till portföljen
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "var(--text)" }}>
              <span style={{ fontSize: 18, marginRight: 8 }}>📊</span>
              {item.name || item.ticker}
            </div>
            {fund && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                {fund.category}
              </div>
            )}
          </div>

          <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value })}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
              background: STATUS_COLORS[item.status]?.bg || "#f0f3fa",
              color: STATUS_COLORS[item.status]?.color || "#787b86",
            }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* NAV + P&L */}
        {fund && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {fund.nav?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{fund.currency || "SEK"}</span>
            {fund.returnD1 != null && (
              <span style={{ fontSize: 14, fontWeight: 500, color: fund.returnD1 >= 0 ? "#089981" : "#f23645" }}>
                {fund.returnD1 > 0 ? "+" : ""}{fund.returnD1.toFixed(2)}% idag
              </span>
            )}
          </div>
        )}

        {/* P&L if holdings */}
        {pl !== null && (
          <div style={{ marginTop: 8, fontSize: 13, color: pl >= 0 ? "#089981" : "#f23645" }}>
            {item.shares} andelar · P&L: {pl >= 0 ? "+" : ""}{pl.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} {fund?.currency || "SEK"} ({plPct >= 0 ? "+" : ""}{plPct.toFixed(1)}%)
          </div>
        )}

        {/* Shares + GAV edit */}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Andelar</label>
            <input
              type="number"
              value={item.shares || ""}
              onChange={e => onUpdate(item.id, { shares: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              style={{ width: 90, padding: "6px 10px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>GAV</label>
            <input
              type="number"
              step="0.01"
              value={item.gav || ""}
              onChange={e => onUpdate(item.id, { gav: e.target.value ? Number(e.target.value) : null })}
              placeholder="0.00"
              style={{ width: 100, padding: "6px 10px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </div>
        </div>
      </div>

      {loading && <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Laddar fonddata...</div>}

      {fund && (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24 }}>
          {/* Left column: metrics + returns */}
          <div style={{ flex: 1 }}>
            {/* Key metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard
                label="Morningstar"
                value={fund.starRating ? "★".repeat(fund.starRating) + "☆".repeat(5 - fund.starRating) : "–"}
                tip="Morningstars betyg baserat på riskjusterad avkastning"
              />
              <StatCard
                label="Avgift"
                value={fund.ongoingCharge != null ? `${fund.ongoingCharge.toFixed(2)}%` : "–"}
                tip="Årlig förvaltningsavgift (TER)"
              />
              {fund.yield != null && (
                <StatCard
                  label="Utdelning"
                  value={`${(fund.yield * 100).toFixed(2)}%`}
                  tip="Direktavkastning senaste 12 mån"
                />
              )}
            </div>

            {/* Return bars */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Avkastning</div>
              <ReturnBar label="1 vecka" value={fund.returnW1} />
              <ReturnBar label="1 månad" value={fund.returnM1} />
              <ReturnBar label="3 månader" value={fund.returnM3} />
              <ReturnBar label="6 månader" value={fund.returnM6} />
              <ReturnBar label="1 år" value={fund.returnM12} />
              <ReturnBar label="3 år" value={fund.returnM36} />
              <ReturnBar label="5 år" value={fund.returnM60} />
              <ReturnBar label="10 år" value={fund.returnM120} />
            </div>

            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>
              Källa: Morningstar · Avkastning i {fund.currency || "SEK"}
            </div>
          </div>

          {/* Right column: notes */}
          <div style={{ width: isMobile ? "100%" : 320 }}>
            <NotesSection item={item} onUpdate={onUpdate} />
          </div>
        </div>
      )}
    </div>
  );
}
