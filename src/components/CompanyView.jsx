import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { fmt } from "./shared.js";
import { StatCard, PriceChart } from "./SharedComponents.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { matchStock, getRisk, riskLabel, betaDescription, isInvestmentCompany } from "../lib/profileMatcher.js";
import QuarterlyChart from "./QuarterlyChart.jsx";

const STATUS_COLORS = {
  Bevakar: { bg: "#f0f3fa", color: "#787b86" },
  Analyserar: { bg: "#fff8e1", color: "#e65100" },
  Intressant: { bg: "#e8f5e9", color: "#1b5e20" },
  "Äger": { bg: "#e3f2fd", color: "#1565c0" },
  "Avstår": { bg: "#fce4ec", color: "#880e4f" },
};

const STATUSES = ["Bevakar", "Analyserar", "Intressant", "Äger", "Avstår"];

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

function getMetricOrder(investorType) {
  const orders = {
    value: ["peForward", "peTrailing", "debtEbitda", "grossMargin", "roic", "operatingMargin", "dividendYield", "revenueGrowth"],
    growth: ["revenueGrowth", "roic", "operatingMargin", "peForward", "ebitdaMargin", "grossMargin", "dividendYield", "debtEbitda"],
    dividend: ["dividendYield", "peForward", "grossMargin", "debtEbitda", "roic", "operatingMargin", "ebitdaMargin", "revenueGrowth"],
  };
  return orders[investorType] || ["peForward", "peTrailing", "ebitdaMargin", "operatingMargin", "grossMargin", "roic", "debtEbitda", "revenueGrowth", "dividendYield"];
}

const METRIC_TIPS = {
  peForward: "Aktiekursen delat med förväntad vinst per aktie. Lägre = billigare.",
  peTrailing: "Aktiekursen delat med senaste årets vinst per aktie.",
  ebitdaMargin: "Vinst före räntor, skatt och avskrivningar som andel av omsättningen.",
  operatingMargin: "Rörelseresultat delat med omsättning. Visar hur mycket som blir vinst.",
  grossMargin: "Omsättning minus varukostnad, delat med omsättning. Högre = bättre.",
  roic: "Avkastning på investerat kapital. Visar hur effektivt bolaget använder sina pengar.",
  debtEbitda: "Nettoskuld delat med EBITDA. Över 3x anses högt belånat.",
  revenueGrowth: "Omsättningstillväxt jämfört med föregående år.",
  dividendYield: "Årlig utdelning delat med aktiekursen. Högre = mer tillbaka varje år.",
};

const METRIC_LABELS = {
  peForward: "P/E Forward",
  peTrailing: "P/E Trailing",
  ebitdaMargin: "EBITDA-marginal",
  operatingMargin: "Rör.marginal",
  grossMargin: "Bruttomarginal",
  roic: "ROIC / ROE",
  debtEbitda: "Nettoskuld/EBITDA",
  revenueGrowth: "Tillväxt",
  dividendYield: "Direktavkastning",
};

const METRIC_FMT = {
  peForward: "x", peTrailing: "x", ebitdaMargin: "%", operatingMargin: "%",
  grossMargin: "%", roic: "%", debtEbitda: "x", revenueGrowth: "%", dividendYield: "%",
};

function isNeg(key, value) {
  if (key === "debtEbitda") return value > 3;
  if (key === "dividendYield") return false;
  return value < 0;
}

const PROFILE_LABELS = { value: "värdeinvesterare", growth: "tillväxtinvesterare", dividend: "utdelningsinvesterare", mixed: "blandat", index: "indexinvesterare" };

function ScoreBar({ label, value }) {
  if (value == null) return null;
  const color = value >= 70 ? "#089981" : value >= 40 ? "#ff9800" : "#f23645";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
      <span style={{ width: 90, color: "#787b86", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#f0f3fa", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ width: 28, textAlign: "right", fontWeight: 500, color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{Math.round(value)}</span>
    </div>
  );
}

function ProfileInsight({ ticker, company, investorProfile }) {
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { if (d) setScoreData(d); })
      .catch(() => {});
  }, [ticker]);

  if (!investorProfile && !scoreData) return null;

  const companyData = {
    beta: company?.beta,
    dividendYield: company?.dividendYield,
    revenueGrowth: company?.revenueGrowth,
    marketCap: company?.marketCap,
  };
  const { tags, warnings, score } = matchStock(ticker, investorProfile, companyData);
  const risk = getRisk(company?.beta, company?.marketCap, ticker);
  const riskText = riskLabel(risk);
  const hasDiv = company?.dividendYield > 0;
  const allItems = [];

  // Beta / Risk
  if (risk) {
    const riskColor = risk === "low" ? "#089981" : risk === "medium" ? "#ff9800" : "#f23645";
    if (isInvestmentCompany(ticker)) {
      allItems.push({ icon: "◉", color: riskColor, text: `${riskText} — diversifierat investmentbolag` });
    } else if (company?.beta != null) {
      allItems.push({ icon: "◉", color: riskColor, text: betaDescription(company.beta) });
    } else {
      allItems.push({ icon: "◉", color: riskColor, text: `${riskText} (baserat på börsvärde)` });
    }
  }

  // Dividend
  if (hasDiv) {
    allItems.push({ icon: "💰", color: "#089981", text: `Direktavkastning ${company.dividendYield.toFixed(1)}%` });
  } else {
    allItems.push({ icon: "–", color: "#787b86", text: "Ingen utdelning" });
  }

  // Sector
  if (isInvestmentCompany(ticker)) {
    allItems.push({ icon: "🏢", color: "#2962ff", text: "Investmentbolag — diversifierad portfölj" });
  } else if (company?.sector && company.sector !== "—") {
    allItems.push({ icon: "🏢", color: "#787b86", text: company.sector });
  }

  // Profile tags
  tags.forEach(t => allItems.push({ icon: "✓", color: "#089981", text: t }));
  warnings.forEach(w => allItems.push({ icon: "⚠", color: "#e65100", text: w }));

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>Din profil & detta bolag</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {allItems.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: item.color, fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <span style={{ color: "#131722" }}>{item.text}</span>
          </div>
        ))}
      </div>
      {scoreData?.scores && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f0f3fa" }}>
          <div style={{ fontSize: 10, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>Vår analys</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <ScoreBar label="Piotroski" value={scoreData.scores.piotroski?.normalized} />
            <ScoreBar label="Magic Formula" value={scoreData.scores.magicFormula} />
            <ScoreBar label="Tillväxt" value={scoreData.scores.growth} />
            <ScoreBar label="Utdelning" value={scoreData.scores.dividend} />
            <ScoreBar label="Kvalitet" value={scoreData.scores.quality} />
          </div>
          {scoreData.composite && (() => {
            const profileType = investorProfile?.investorType || "mixed";
            const compositeScore = scoreData.composite[profileType] ?? scoreData.composite.mixed;
            if (compositeScore == null) return null;
            const color = compositeScore >= 70 ? "#089981" : compositeScore >= 40 ? "#ff9800" : "#f23645";
            return (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(compositeScore)}</span>
                <span style={{ fontSize: 11, color: "#787b86" }}>/ 100 — totalpoäng för {PROFILE_LABELS[profileType] || profileType}</span>
              </div>
            );
          })()}
        </div>
      )}
      <div style={{ marginTop: 10, padding: "8px 10px", background: score >= 60 ? "#e8f5e9" : score >= 40 ? "#fff8e1" : "#fff5f5", borderRadius: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: score >= 60 ? "#089981" : score >= 40 ? "#e65100" : "#c62828" }}>
          {score >= 60 ? "Matchar din profil" : score >= 40 ? "Delvis matchning" : "Avviker från din profil"}
        </div>
      </div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 10, color: "#b2b5be", cursor: "pointer", userSelect: "none" }}>Hur vi bedömer risk (Beta)</summary>
        <div style={{ marginTop: 6, fontSize: 10, color: "#787b86", lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Beta</strong> mäter en akties volatilitet jämfört med marknaden (index). Beta 1.0 = samma som marknaden.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#089981", fontSize: 11, width: 14, textAlign: "center" }}>◉</span>
              <strong>Låg risk</strong> — Beta &lt; 0.8. Aktien rör sig mindre än marknaden. Stabilare kursutveckling.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#ff9800", fontSize: 11, width: 14, textAlign: "center" }}>◉</span>
              <strong>Medel risk</strong> — Beta 0.8–1.2. Följer marknaden relativt nära.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#f23645", fontSize: 11, width: 14, textAlign: "center" }}>◉</span>
              <strong>Hög risk</strong> — Beta &gt; 1.2. Större kurssvängningar än marknaden.
            </div>
          </div>
          <div style={{ marginTop: 6, color: "#b2b5be" }}>
            Beta beräknas från 5 års kurshistorik mot S&P 500 (källa: Yahoo Finance). Utgör inte finansiell rådgivning.
          </div>
        </div>
      </details>
    </div>
  );
}

const SCRAPER_API = "https://thesion-scraper.vercel.app";

function InsiderSection({ ticker }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker || !ticker.toUpperCase().endsWith(".ST")) {
      setLoading(false);
      return;
    }
    fetch(`${SCRAPER_API}/api/insider?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) return null;
  if (transactions.length === 0) return null;

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>
        Insiderhandel
      </div>
      {transactions.slice(0, 10).map((t, i) => {
        const isBuy = t.type?.toLowerCase().includes("förv") || t.type?.toLowerCase().includes("acq");
        const value = t.value || (t.volume && t.price ? Math.round(t.volume * t.price) : null);
        return (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: i < Math.min(transactions.length, 10) - 1 ? "1px solid #f0f3fa" : "none",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#131722" }}>
                <span style={{ fontWeight: 500 }}>{t.person}</span>
                {t.position && <span style={{ color: "#787b86", fontSize: 11 }}> · {t.position}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#787b86", marginTop: 2 }}>
                <span style={{
                  color: isBuy ? "#089981" : "#f23645",
                  fontWeight: 500,
                }}>
                  {isBuy ? "Köp" : "Sälj"}
                </span>
                {" · "}
                {t.volume?.toLocaleString("sv-SE")} aktier
                {value ? ` · ${value.toLocaleString("sv-SE")} ${t.currency || "SEK"}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#b2b5be", ...mono, whiteSpace: "nowrap" }}>
              {t.date}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 8 }}>
        Källa: Finansinspektionens insynsregister
      </div>
    </div>
  );
}

export default function CompanyView({ item, onBack, onUpdate, investorType, investorProfile }) {
  const isMobile = useIsMobile();
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
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: isMobile ? 16 : 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chart */}
            <PriceChart ticker={item.ticker} />

            {/* Key metrics */}
            <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 14 }}>Nyckeltal</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
                {getMetricOrder(investorType).map(key => (
                  <div key={key} title={METRIC_TIPS[key] || ""} style={{ cursor: METRIC_TIPS[key] ? "help" : "default" }}>
                    <StatCard label={METRIC_LABELS[key]} value={fmt(company[key], METRIC_FMT[key])} neg={isNeg(key, company[key])} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quarterly financials */}
            <QuarterlyChart ticker={item.ticker} />

            {/* Analyst targets */}
            {(company.targetPrice > 0 || company.recommendation !== "—") && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {company.targetPrice > 0 && (
                  <div style={{ flex: 1, minWidth: 160, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Kursmål (snitt)</div>
                    <div style={{ fontSize: 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                      {company.targetPrice.toFixed(2)} {company.currency}
                    </div>
                    {company.targetLow > 0 && company.targetHigh > 0 && (
                      <div style={{ fontSize: 10, color: "#787b86", marginTop: 4 }}>
                        Spann: {company.targetLow.toFixed(0)} – {company.targetHigh.toFixed(0)} {company.currency}
                      </div>
                    )}
                    {company.price > 0 && (
                      <div style={{ fontSize: 11, color: "#787b86", marginTop: 4 }}>
                        Uppsida: <span style={{ color: company.targetPrice > company.price ? "#089981" : "#f23645" }}>
                          {(((company.targetPrice / company.price) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {company.numberOfAnalysts > 0 && (
                      <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 6 }}>
                        Baserat på {company.numberOfAnalysts} analytiker · Källa: Yahoo Finance
                      </div>
                    )}
                  </div>
                )}
                {company.recommendation !== "—" && (
                  <div style={{ flex: 1, minWidth: 160, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Rekommendation</div>
                    <div style={{
                      fontSize: 16, fontWeight: 500, textTransform: "uppercase",
                      color: company.recommendation?.includes("buy") ? "#089981" : company.recommendation?.includes("sell") ? "#f23645" : "#131722",
                    }}>
                      {company.recommendation}
                    </div>
                    {company.numberOfAnalysts > 0 && (
                      <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 6 }}>
                        {company.numberOfAnalysts} analytiker · Yahoo Finance consensus
                      </div>
                    )}
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

            {/* Insider transactions */}
            <InsiderSection ticker={item.ticker} />
          </div>

          {/* Right column: Profile insight + Notes + GAV */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProfileInsight ticker={item.ticker} company={company} investorProfile={investorProfile} />
            <NotesSection item={item} onUpdate={onUpdate} />
          </div>
        </div>
      )}
    </div>
  );
}
