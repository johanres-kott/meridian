import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../supabase.js";
import { fmt } from "./shared.js";
import { StatCard } from "./SharedComponents.jsx";

const RANGES = [
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
];

const STATUS_COLORS = {
  Bevakar: { bg: "#f0f3fa", color: "#787b86" },
  Analyserar: { bg: "#fff8e1", color: "#e65100" },
  Intressant: { bg: "#e8f5e9", color: "#1b5e20" },
  "Äger": { bg: "#e3f2fd", color: "#1565c0" },
  "Avstår": { bg: "#fce4ec", color: "#880e4f" },
};

const STATUSES = ["Bevakar", "Analyserar", "Intressant", "Äger", "Avstår"];

function PriceChart({ ticker }) {
  const [range, setRange] = useState("3m");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}&range=${range}`)
      .then(r => r.json())
      .then(d => { setPoints(d.points || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, range]);

  const first = points[0]?.close;
  const last = points[points.length - 1]?.close;
  const isUp = last >= first;
  const color = isUp ? "#089981" : "#f23645";

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "20px 20px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Kursutveckling</div>
        <div style={{ display: "flex", gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 3, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                background: range === r.id ? "#2962ff" : "#f0f3fa",
                color: range === r.id ? "#fff" : "#787b86",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#787b86", fontSize: 12 }}>
          Laddar graf...
        </div>
      ) : points.length === 0 ? (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#787b86", fontSize: 12 }}>
          Ingen kursdata tillganglig
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#b2b5be" }}
              tickLine={false}
              axisLine={{ stroke: "#e0e3eb" }}
              tickFormatter={d => {
                const [y, m, day] = d.split("-");
                return range === "5y" || range === "1y" ? `${m}/${y.slice(2)}` : `${day}/${m}`;
              }}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "#b2b5be" }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={v => v.toLocaleString("sv-SE")}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e0e3eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              formatter={v => [v.toLocaleString("sv-SE", { minimumFractionDigits: 2 }), "Kurs"]}
              labelFormatter={d => d}
            />
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={1.5} fill="url(#chartGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {points.length > 1 && (
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#787b86" }}>
          <span>Period: <span style={{ color, fontWeight: 500 }}>{isUp ? "+" : ""}{((last - first) / first * 100).toFixed(1)}%</span></span>
          <span>Hog: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.max(...points.map(p => p.close)).toLocaleString("sv-SE", { minimumFractionDigits: 2 })}</span></span>
          <span>Lag: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.min(...points.map(p => p.close)).toLocaleString("sv-SE", { minimumFractionDigits: 2 })}</span></span>
        </div>
      )}
    </div>
  );
}

function NotesSection({ item, onUpdate }) {
  const [notes, setNotes] = useState(item.notes || "");
  const [editing, setEditing] = useState(false);
  const [showGAV, setShowGAV] = useState(false);
  const [shares, setShares] = useState(item.shares || "");
  const [gav, setGav] = useState(item.gav || "");

  async function saveNotes() {
    await onUpdate(item.id, { notes });
    setEditing(false);
  }

  async function saveGAV() {
    await onUpdate(item.id, { shares: parseFloat(shares) || null, gav: parseFloat(gav) || null });
    setShowGAV(false);
  }

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
      {/* GAV */}
      <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Egna kop</div>
          <button onClick={() => setShowGAV(!showGAV)}
            style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #e0e3eb", borderRadius: 3, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            {showGAV ? "Avbryt" : "Redigera"}
          </button>
        </div>

        {showGAV ? (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#787b86", display: "block", marginBottom: 4 }}>ANTAL AKTIER</label>
                <input type="number" value={shares} onChange={e => setShares(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#787b86", display: "block", marginBottom: 4 }}>GAV (SNITTPRIS)</label>
                <input type="number" value={gav} onChange={e => setGav(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }} />
              </div>
            </div>
            <button onClick={saveGAV}
              style={{ fontSize: 11, padding: "6px 14px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              Spara
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "#787b86" }}>Antal</div>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{item.shares || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#787b86" }}>GAV</div>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{item.gav ? item.gav.toLocaleString("sv-SE", { minimumFractionDigits: 2 }) : "—"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Anteckningar</div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #e0e3eb", borderRadius: 3, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              Redigera
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} autoFocus
              style={{ width: "100%", minHeight: 120, padding: "10px 12px", border: "1px solid #2962ff", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={saveNotes}
                style={{ fontSize: 11, padding: "6px 14px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer" }}>
                Spara
              </button>
              <button onClick={() => { setNotes(item.notes || ""); setEditing(false); }}
                style={{ fontSize: 11, padding: "6px 14px", border: "1px solid #e0e3eb", borderRadius: 4, background: "#fff", cursor: "pointer" }}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: notes ? "#131722" : "#c0c3cb", whiteSpace: "pre-wrap", minHeight: 40 }}>
            {notes || "Inga anteckningar annu. Klicka Redigera for att lagga till investeringstes, analys, etc."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyView({ item, onBack, onUpdate }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`)
      .then(r => r.json())
      .then(d => { setCompany(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [item.ticker]);

  const pl = (item.gav && item.shares && company?.price) ? ((company.price - item.gav) * item.shares) : null;
  const plPct = (item.gav && company?.price) ? ((company.price - item.gav) / item.gav * 100) : null;

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}>
          &larr; Tillbaka till bevakningslistan
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#131722" }}>
              {item.name || item.ticker}
              <span style={{ fontSize: 13, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{item.ticker}</span>
            </div>
            {company && (
              <div style={{ fontSize: 12, color: "#787b86", marginTop: 4 }}>
                {company.sector}{company.industry !== "—" ? ` · ${company.industry}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
        </div>

        {/* Price + P&L row */}
        {company && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
              {company.price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 13, color: "#787b86" }}>{company.currency}</span>
            {company.marketCap > 0 && <span style={{ fontSize: 12, color: "#787b86" }}>Mkt Cap: {company.marketCap}B {company.currency}</span>}
            {pl !== null && (
              <span style={{ fontSize: 13, fontWeight: 500, color: pl >= 0 ? "#089981" : "#f23645", marginLeft: 8 }}>
                P&L: {pl >= 0 ? "+" : ""}{pl.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} {company.currency} ({plPct >= 0 ? "+" : ""}{plPct?.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: "#787b86", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Laddar bolagsdata...</div>
      ) : !company ? (
        <div style={{ color: "#f23645", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Kunde inte ladda data for {item.ticker}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chart */}
            <PriceChart ticker={item.ticker} />

            {/* Key metrics */}
            <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 14 }}>Nyckeltal</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <StatCard label="P/E Forward" value={fmt(company.peForward, "x")} />
                <StatCard label="P/E Trailing" value={fmt(company.peTrailing, "x")} />
                <StatCard label="EBITDA-marginal" value={fmt(company.ebitdaMargin, "%")} neg={company.ebitdaMargin < 0} />
                <StatCard label="Ror.marginal" value={fmt(company.operatingMargin, "%")} neg={company.operatingMargin < 0} />
                <StatCard label="Bruttomarginal" value={fmt(company.grossMargin, "%")} />
                <StatCard label="ROIC / ROE" value={fmt(company.roic, "%")} neg={company.roic < 0} />
                <StatCard label="Nettoskuld/EBITDA" value={fmt(company.debtEbitda, "x")} neg={company.debtEbitda > 3} />
                <StatCard label="Tillvaxt" value={fmt(company.revenueGrowth, "%")} neg={company.revenueGrowth < 0} />
              </div>
            </div>

            {/* Analyst targets */}
            {(company.targetPrice > 0 || company.recommendation !== "—") && (
              <div style={{ display: "flex", gap: 12 }}>
                {company.targetPrice > 0 && (
                  <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Kursmal</div>
                    <div style={{ fontSize: 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                      {company.targetPrice.toFixed(2)} {company.currency}
                    </div>
                    {company.price > 0 && (
                      <div style={{ fontSize: 11, color: "#787b86", marginTop: 4 }}>
                        Uppsida: <span style={{ color: company.targetPrice > company.price ? "#089981" : "#f23645" }}>
                          {(((company.targetPrice / company.price) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {company.recommendation !== "—" && (
                  <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Rekommendation</div>
                    <div style={{
                      fontSize: 16, fontWeight: 500, textTransform: "uppercase",
                      color: company.recommendation?.includes("buy") ? "#089981" : company.recommendation?.includes("sell") ? "#f23645" : "#131722",
                    }}>
                      {company.recommendation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* News */}
            {company.news?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>Senaste nyheter</div>
                {company.news.map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 0",
                      borderBottom: i < company.news.length - 1 ? "1px solid #f0f3fa" : "none",
                      textDecoration: "none", color: "#131722",
                    }}>
                    <span style={{ fontSize: 12, lineHeight: 1.4 }}>{n.headline}</span>
                    <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0 }}>{n.source}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Notes + GAV */}
          <NotesSection item={item} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
