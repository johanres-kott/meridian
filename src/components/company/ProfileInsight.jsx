import { useState, useEffect } from "react";
import { matchStock, getRisk, riskLabel, betaDescription, isInvestmentCompany } from "../../lib/profileMatcher.js";
import { PROFILE_LABELS } from "../../constants.js";

const SCORE_DETAILS = {
  piotroski: {
    title: "Piotroski F-Score (0\u20139)",
    description: "M\u00e4ter finansiell styrka baserat p\u00e5 9 kriterier inom l\u00f6nsamhet, skulds\u00e4ttning och effektivitet. H\u00f6gre po\u00e4ng = starkare finansiell h\u00e4lsa.",
    items: [
      "Positivt nettoresultat",
      "Positivt operativt kassafl\u00f6de",
      "Stigande avkastning p\u00e5 tillg\u00e5ngar (ROA)",
      "Kassafl\u00f6de \u00f6verstiger nettoresultat",
      "Minskande skulds\u00e4ttning",
      "Stigande likviditetskvot",
      "Inga nya aktier emitterade",
      "Stigande bruttomarginal",
      "Stigande tillg\u00e5ngsomsättning",
    ],
    formatRaw: (raw) => raw != null ? `${raw}/9` : null,
  },
  magicFormula: {
    title: "Magic Formula",
    description: "Kombinerar Earnings Yield (vinstavkastning) och ROIC (avkastning p\u00e5 investerat kapital) f\u00f6r att hitta billiga kvalitetsbolag.",
    items: [
      "Earnings Yield \u2014 h\u00f6g vinst relativt priset",
      "ROIC \u2014 effektiv kapitalanv\u00e4ndning",
    ],
  },
  growth: {
    title: "Tillv\u00e4xt",
    description: "Bed\u00f6mer bolagets tillv\u00e4xttakt baserat p\u00e5 oms\u00e4ttningsutveckling och tillv\u00e4xttrend.",
    items: [
      "Oms\u00e4ttningstillv\u00e4xt",
      "Tillv\u00e4xtens stabilitet och trend",
    ],
  },
  dividend: {
    title: "Utdelning",
    description: "Utv\u00e4rderar utdelningens niv\u00e5 och stabilitet \u00f6ver tid.",
    items: [
      "Direktavkastning",
      "Utdelningens stabilitet och tillv\u00e4xt",
    ],
  },
  quality: {
    title: "Kvalitet",
    description: "Helhetsbild av bolagets kvalitet baserat p\u00e5 marginaler, kapitaleffektivitet och skulds\u00e4ttning.",
    items: [
      "Marginaler (brutto, r\u00f6relse, EBITDA)",
      "ROIC \u2014 avkastning p\u00e5 investerat kapital",
      "Skulds\u00e4ttningsgrad",
    ],
  },
};

function ScoreDetail({ scoreKey, scoreData }) {
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
          Po\u00e4ng: {rawScore}
        </div>
      )}
      <div style={{ marginBottom: 8 }}>{detail.description}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {detail.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ flexShrink: 0, color: "var(--text-muted)", fontSize: 10, marginTop: 1 }}>\u2022</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, scoreKey, scoreData, expanded, onToggle }) {
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
        <summary style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>Hur vi bed\u00f6mer risk (Beta)</summary>
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Beta</strong> m\u00e4ter en akties volatilitet j\u00e4mf\u00f6rt med marknaden (index). Beta 1.0 = samma som marknaden.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#089981", fontSize: 11, width: 14, textAlign: "center" }}>\u25C9</span>
              <strong>L\u00e5g risk</strong> \u2014 Beta &lt; 0.8. Aktien r\u00f6r sig mindre \u00e4n marknaden. Stabilare kursutveckling.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#ff9800", fontSize: 11, width: 14, textAlign: "center" }}>\u25C9</span>
              <strong>Medel risk</strong> \u2014 Beta 0.8\u20131.2. F\u00f6ljer marknaden relativt n\u00e4ra.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#f23645", fontSize: 11, width: 14, textAlign: "center" }}>\u25C9</span>
              <strong>H\u00f6g risk</strong> \u2014 Beta &gt; 1.2. St\u00f6rre kurssv\u00e4ngningar \u00e4n marknaden.
            </div>
          </div>
          <div style={{ marginTop: 6, color: "var(--text-muted)" }}>
            Beta ber\u00e4knas fr\u00e5n 5 \u00e5rs kurshistorik mot S&P 500 (k\u00e4lla: Yahoo Finance). Utg\u00f6r inte finansiell r\u00e5dgivning.
          </div>
        </div>
      </details>
    </div>
  );
}
