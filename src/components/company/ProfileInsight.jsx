import { useState, useEffect } from "react";
import { matchStock, getRisk, riskLabel, betaDescription, isInvestmentCompany } from "../../lib/profileMatcher.js";
import { PROFILE_LABELS } from "../../constants.js";

export const SCORE_DETAILS = {
  piotroski: {
    title: "Piotroski F-Score (0–9)",
    description: "Mäter finansiell styrka baserat på 9 kriterier inom lönsamhet, skuldsättning och effektivitet. Högre poäng = starkare finansiell hälsa.",
    items: [
      "Positivt nettoresultat",
      "Positivt operativt kassaflöde",
      "Stigande avkastning på tillgångar (ROA)",
      "Kassaflöde överstiger nettoresultat",
      "Minskande skuldsättning",
      "Stigande likviditetskvot",
      "Inga nya aktier emitterade",
      "Stigande bruttomarginal",
      "Stigande tillgångsomsättning",
    ],
    formatRaw: (raw) => raw != null ? `${raw}/9` : null,
  },
  magicFormula: {
    title: "Magic Formula",
    description: "Kombinerar Earnings Yield (vinstavkastning) och ROIC (avkastning på investerat kapital) för att hitta billiga kvalitetsbolag.",
    items: [
      "Earnings Yield — hög vinst relativt priset",
      "ROIC — effektiv kapitalanvändning",
    ],
  },
  growth: {
    title: "Tillväxt",
    description: "Bedömer bolagets tillväxttakt baserat på omsättningsutveckling och tillväxttrend.",
    items: [
      "Omsättningstillväxt",
      "Tillväxtens stabilitet och trend",
    ],
  },
  dividend: {
    title: "Utdelning",
    description: "Utvärderar utdelningens nivå och stabilitet över tid.",
    items: [
      "Direktavkastning",
      "Utdelningens stabilitet och tillväxt",
    ],
  },
  quality: {
    title: "Kvalitet",
    description: "Helhetsbild av bolagets kvalitet baserat på marginaler, kapitaleffektivitet och skuldsättning.",
    items: [
      "Marginaler (brutto, rörelse, EBITDA)",
      "ROIC — avkastning på investerat kapital",
      "Skuldsättningsgrad",
    ],
  },
};

export function ScoreDetail({ scoreKey, scoreData }) {
  const detail = SCORE_DETAILS[scoreKey];
  if (!detail) return null;

  const rawScore = scoreKey === "piotroski" && detail.formatRaw
    ? detail.formatRaw(scoreData?.piotroski?.raw)
    : null;

  return (
    <div style={{
      padding: "10px 12px", marginTop: 4, marginBottom: 2,
      background: "var(--bg-secondary)", borderRadius: 4,
      fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary)",
    }}>
      <div style={{ fontWeight: 500, color: "var(--text)", marginBottom: 4, fontSize: 12 }}>{detail.title}</div>
      {rawScore && (
        <div style={{ marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: "var(--text)" }}>
          {"Poäng: "}{rawScore}
        </div>
      )}
      <div style={{ marginBottom: 8 }}>{detail.description}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {detail.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ flexShrink: 0, color: "var(--text-muted)", fontSize: 10, marginTop: 1 }}>{"•"}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, scoreKey, scoreData, expanded, onToggle }) {
  if (value == null) return null;
  const color = value >= 70 ? "#089981" : value >= 40 ? "#ff9800" : "#f23645";
  const hasDetail = !!SCORE_DETAILS[scoreKey];
  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: hasDetail ? "pointer" : undefined }}
        onClick={() => hasDetail && onToggle?.()}
        role={hasDetail ? "button" : undefined}
        tabIndex={hasDetail ? 0 : undefined}
        onKeyDown={hasDetail ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle?.(); } } : undefined}
      >
        <span style={{ width: 90, color: expanded ? "var(--text)" : "var(--text-secondary)", flexShrink: 0, fontWeight: expanded ? 500 : 400, transition: "color 150ms" }}>
          {label}
          {hasDetail && <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.5 }}>{expanded ? "\u25B2" : "\u25BC"}</span>}
        </span>
        <div style={{ flex: 1, height: 6, background: "var(--border-light)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
        </div>
        <span style={{ width: 28, textAlign: "right", fontWeight: 500, color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{Math.round(value)}</span>
      </div>
      {expanded && <ScoreDetail scoreKey={scoreKey} scoreData={scoreData} />}
    </div>
  );
}

export default function ProfileInsight({ ticker, company, investorProfile }) {
  const [scoreData, setScoreData] = useState(null);
  const [expandedScore, setExpandedScore] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { if (d) setScoreData(d); })
      .catch(err => { console.error(`ProfileInsight: score fetch failed for ${ticker}:`, err); });
  }, [ticker]);

  if (!investorProfile && !scoreData) return null;

  const companyData = {
    beta: company?.beta,
    dividendYield: company?.dividendYield,
    revenueGrowth: company?.revenueGrowth,
    marketCap: company?.marketCap,
  };
  const { score } = matchStock(ticker, investorProfile, companyData);
  const risk = getRisk(company?.beta, company?.marketCap, ticker);
  const riskText = riskLabel(risk);
  const hasDiv = company?.dividendYield > 0;
  const allItems = [];

  // Beta / Risk
  if (risk) {
    const riskColor = risk === "low" ? "#089981" : risk === "medium" ? "#ff9800" : "#f23645";
    if (isInvestmentCompany(ticker)) {
      allItems.push({ icon: "\u25C9", color: riskColor, text: `${riskText} \u2014 diversifierat investmentbolag` });
    } else if (company?.beta != null) {
      allItems.push({ icon: "\u25C9", color: riskColor, text: betaDescription(company.beta) });
    } else {
      allItems.push({ icon: "\u25C9", color: riskColor, text: `${riskText} (baserat p\u00e5 b\u00f6rsv\u00e4rde)` });
    }
  }

  // Dividend
  if (hasDiv) {
    allItems.push({ icon: "\uD83D\uDCB0", color: "#089981", text: `Direktavkastning ${company.dividendYield.toFixed(1)}%` });
  } else {
    allItems.push({ icon: "\u2013", color: "var(--text-secondary)", text: "Ingen utdelning" });
  }

  // Sector
  if (isInvestmentCompany(ticker)) {
    allItems.push({ icon: "\uD83C\uDFE2", color: "var(--accent)", text: "Investmentbolag \u2014 diversifierad portf\u00f6lj" });
  } else if (company?.sector && company.sector !== "\u2014") {
    allItems.push({ icon: "\uD83C\uDFE2", color: "var(--text-secondary)", text: company.sector });
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>Din profil & detta bolag</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {allItems.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: item.color, fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <span style={{ color: "var(--text)" }}>{item.text}</span>
          </div>
        ))}
      </div>
      {scoreData?.scores && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>V\u00e5r analys</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <ScoreBar label="Piotroski" value={scoreData.scores.piotroski?.normalized} scoreKey="piotroski" scoreData={scoreData.scores} expanded={expandedScore === "piotroski"} onToggle={() => setExpandedScore(expandedScore === "piotroski" ? null : "piotroski")} />
            <ScoreBar label="Magic Formula" value={scoreData.scores.magicFormula} scoreKey="magicFormula" scoreData={scoreData.scores} expanded={expandedScore === "magicFormula"} onToggle={() => setExpandedScore(expandedScore === "magicFormula" ? null : "magicFormula")} />
            <ScoreBar label="Tillv\u00e4xt" value={scoreData.scores.growth} scoreKey="growth" scoreData={scoreData.scores} expanded={expandedScore === "growth"} onToggle={() => setExpandedScore(expandedScore === "growth" ? null : "growth")} />
            <ScoreBar label="Utdelning" value={scoreData.scores.dividend} scoreKey="dividend" scoreData={scoreData.scores} expanded={expandedScore === "dividend"} onToggle={() => setExpandedScore(expandedScore === "dividend" ? null : "dividend")} />
            <ScoreBar label="Kvalitet" value={scoreData.scores.quality} scoreKey="quality" scoreData={scoreData.scores} expanded={expandedScore === "quality"} onToggle={() => setExpandedScore(expandedScore === "quality" ? null : "quality")} />
          </div>
          {scoreData.composite && (() => {
            const profileType = investorProfile?.investorType || "mixed";
            const compositeScore = scoreData.composite[profileType] ?? scoreData.composite.mixed;
            if (compositeScore == null) return null;
            const color = compositeScore >= 70 ? "#089981" : compositeScore >= 40 ? "#ff9800" : "#f23645";
            return (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(compositeScore)}</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>/ 100 \u2014 totalpo\u00e4ng f\u00f6r {PROFILE_LABELS[profileType] || profileType}</span>
              </div>
            );
          })()}
        </div>
      )}
      {(() => {
        const profileType = investorProfile?.investorType || "mixed";
        const cs = scoreData?.composite?.[profileType] ?? scoreData?.composite?.mixed ?? score;
        const matchColor = cs >= 70 ? "#089981" : cs >= 40 ? "#e65100" : "#c62828";
        const matchBg = cs >= 70 ? "rgba(8,153,129,0.12)" : cs >= 40 ? "rgba(255,152,0,0.12)" : "rgba(200,40,40,0.12)";
        const matchText = cs >= 70 ? "Stark matchning" : cs >= 40 ? "Delvis matchning" : "Svag matchning";
        return (
          <div style={{ marginTop: 10, padding: "8px 10px", background: matchBg, borderRadius: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: matchColor }}>
              {matchText}
            </div>
          </div>
        );
      })()}
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>{"Hur vi bedömer risk (Beta)"}</summary>
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Beta</strong> {"mäter en akties volatilitet jämfört med marknaden (index). Beta 1.0 = samma som marknaden."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#089981", fontSize: 11, width: 14, textAlign: "center" }}>{"◉"}</span>
              <strong>{"Låg risk"}</strong> {" — Beta < 0.8. Aktien rör sig mindre än marknaden. Stabilare kursutveckling."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#ff9800", fontSize: 11, width: 14, textAlign: "center" }}>{"◉"}</span>
              <strong>{"Medel risk"}</strong> {" — Beta 0.8–1.2. Följer marknaden relativt nära."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#f23645", fontSize: 11, width: 14, textAlign: "center" }}>{"◉"}</span>
              <strong>{"Hög risk"}</strong> {" — Beta > 1.2. Större kurssvängningar än marknaden."}
            </div>
          </div>
          <div style={{ marginTop: 6, color: "var(--text-muted)" }}>
            {"Beta beräknas från 5 års kurshistorik mot S&P 500 (källa: Yahoo Finance). Utgör inte finansiell rådgivning."}
          </div>
        </div>
      </details>
    </div>
  );
}
