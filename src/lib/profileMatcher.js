// Profile matching logic for stocks vs investor profile.
// Used to tag stocks and filter suggestions.

// Risk classification by market cap and volatility characteristics
const RISK_TIER = {
  // Large cap, stable = low risk
  low: new Set([
    "ABB.ST", "AZN.ST", "ATCO-A.ST", "VOLV-B.ST", "SEB-A.ST", "SHB-A.ST",
    "SAND.ST", "ERIC-B.ST", "HM-B.ST", "SWED-A.ST", "INVE-B.ST", "AAPL",
    "MSFT", "JNJ", "PG", "KO", "NDAQ", "AXFO.ST", "CAST.ST", "SECU-B.ST",
  ]),
  // Mid cap, moderate = medium risk
  medium: new Set([
    "SAAB-B.ST", "EPI-A.ST", "SOBI.ST", "EQT.ST", "SKF-B.ST", "ALFA.ST",
    "HEX-B.ST", "AZA.ST", "HUSQ-B.ST", "ELUX-B.ST", "BILI-A.ST", "SHOT.ST",
    "FABG.ST", "SAGA-B.ST", "NIBE-B.ST", "AAK.ST", "NWG.ST", "BOLI.ST",
  ]),
  // Small cap, volatile = high risk
  high: new Set([
    "SINCH.ST", "EMBRAC-B.ST", "STAR-B.ST", "PNDX-B.ST", "OVZON.ST",
    "STENF.ST", "SCST.ST", "SEAF.ST", "BAHN-B.ST", "EOLU-B.ST",
    "TSLA", "COIN", "NVDA", "QLINEA.ST",
  ]),
};

// Sector mapping for interest matching
const SECTOR_MAP = {
  tech: ["Technology", "Communication Services", "Teknik", "Teknologi"],
  finance: ["Financial Services", "Finans", "Finansiella tjänster"],
  industry: ["Industrials", "Industri", "Industrivaror"],
  healthcare: ["Healthcare", "Hälsovård"],
  realestate: ["Real Estate", "Fastigheter"],
  energy: ["Energy", "Energi"],
  food: ["Consumer Defensive", "Dagligvaror", "Konsumentvaror"],
  fashion: ["Consumer Cyclical", "Sällanköpsvaror"],
};

// Known dividend stocks (yield > 3%)
const HIGH_DIVIDEND = new Set([
  "SEB-A.ST", "SHB-A.ST", "SWED-A.ST", "VOLV-B.ST", "SKF-B.ST",
  "HM-B.ST", "CAST.ST", "AXFO.ST", "SAND.ST", "SECU-B.ST",
  "INVE-B.ST", "INDU-C.ST", "LATO-B.ST",
]);

// Known growth stocks (revenue growth > 15%)
const HIGH_GROWTH = new Set([
  "SAAB-B.ST", "EQT.ST", "NVDA", "AAPL", "MSFT", "SINCH.ST",
  "AZA.ST", "SOBI.ST", "TSLA", "COIN",
]);

/**
 * Match a stock against an investor profile.
 * Returns { score, tags, warnings } where:
 * - score: 0-100 (how well it matches)
 * - tags: string[] (positive match reasons)
 * - warnings: string[] (potential concerns)
 */
export function matchStock(ticker, { investorType, riskProfile, focus, interests } = {}) {
  const t = ticker.toUpperCase();
  const tags = [];
  const warnings = [];
  let score = 50; // neutral baseline

  // Risk matching
  const stockRisk = RISK_TIER.low.has(t) ? "low" : RISK_TIER.medium.has(t) ? "medium" : RISK_TIER.high.has(t) ? "high" : null;

  if (stockRisk && riskProfile) {
    if (stockRisk === riskProfile) {
      score += 15;
      tags.push("Matchar riskprofil");
    } else if (
      (riskProfile === "low" && stockRisk === "high") ||
      (riskProfile === "high" && stockRisk === "low")
    ) {
      score -= 20;
      warnings.push(riskProfile === "low" ? "Hög risk för din profil" : "Låg risk för din profil");
    }
  }

  // Strategy matching
  if (investorType === "dividend" && HIGH_DIVIDEND.has(t)) {
    score += 20;
    tags.push("Utdelningsaktie");
  }
  if (investorType === "growth" && HIGH_GROWTH.has(t)) {
    score += 20;
    tags.push("Tillväxtaktie");
  }
  if (investorType === "value" && RISK_TIER.low.has(t)) {
    score += 10;
    tags.push("Stabil värdeaktie");
  }

  // Focus matching
  if (focus === "dividends" && HIGH_DIVIDEND.has(t)) {
    score += 10;
    tags.push("Bra utdelning");
  }
  if (focus === "appreciation" && HIGH_GROWTH.has(t)) {
    score += 10;
    tags.push("Tillväxtpotential");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, tags, warnings };
}

/**
 * Get the risk tier for a stock.
 * Returns "low" | "medium" | "high" | null
 */
export function getStockRisk(ticker) {
  const t = ticker.toUpperCase();
  if (RISK_TIER.low.has(t)) return "low";
  if (RISK_TIER.medium.has(t)) return "medium";
  if (RISK_TIER.high.has(t)) return "high";
  return null;
}

/**
 * Risk label in Swedish
 */
export function riskLabel(risk) {
  if (risk === "low") return "Låg risk";
  if (risk === "medium") return "Medel risk";
  if (risk === "high") return "Hög risk";
  return null;
}

/**
 * Legend data for the profile matching system
 */
export const LEGEND = [
  { color: "#089981", label: "Matchar profil", description: "Aktien passar din investerarstrategi och risknivå" },
  { color: "#ff9800", label: "Varning", description: "Aktien avviker från din profil (t.ex. för hög risk)" },
  { color: "#2962ff", label: "Utdelning", description: "Aktien har historiskt hög direktavkastning (>3%)" },
  { color: "#7b1fa2", label: "Tillväxt", description: "Aktien har hög omsättningstillväxt (>15%)" },
];

/**
 * Filter and sort suggestions based on full profile
 */
export function filterSuggestionsByProfile(suggestions, profile = {}) {
  const { riskProfile, investorType } = profile;

  return suggestions
    .map(s => {
      const match = matchStock(s.ticker, profile);
      return { ...s, ...match };
    })
    .filter(s => {
      // Filter out high-risk for low-risk profiles
      if (riskProfile === "low" && RISK_TIER.high.has(s.ticker.toUpperCase())) return false;
      // Filter out low-risk for high-risk profiles (they want excitement)
      if (riskProfile === "high" && RISK_TIER.low.has(s.ticker.toUpperCase()) && investorType === "growth") return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);
}
