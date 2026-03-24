// Profile matching logic for stocks vs investor profile.
// Uses Beta (from Yahoo Finance) as the primary risk indicator.
//
// Beta measures a stock's volatility relative to the market:
//   Beta < 0.8  = Low risk (less volatile than the market)
//   Beta 0.8-1.2 = Medium risk (similar to the market)
//   Beta > 1.2  = High risk (more volatile than the market)

/**
 * Classify risk based on Beta value.
 * Returns "low" | "medium" | "high" | null
 */
export function getRiskFromBeta(beta) {
  if (beta == null) return null;
  if (beta < 0.8) return "low";
  if (beta <= 1.2) return "medium";
  return "high";
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
 * Get beta description in Swedish
 */
export function betaDescription(beta) {
  if (beta == null) return "Beta ej tillgängligt";
  if (beta < 0.5) return `Beta ${beta.toFixed(2)} — Mycket stabil, rör sig mindre än marknaden`;
  if (beta < 0.8) return `Beta ${beta.toFixed(2)} — Stabil, lägre volatilitet än marknaden`;
  if (beta <= 1.0) return `Beta ${beta.toFixed(2)} — Nära marknaden`;
  if (beta <= 1.2) return `Beta ${beta.toFixed(2)} — Något mer volatil än marknaden`;
  if (beta <= 1.5) return `Beta ${beta.toFixed(2)} — Hög volatilitet`;
  return `Beta ${beta.toFixed(2)} — Mycket hög volatilitet`;
}

/**
 * Match a stock against an investor profile.
 * companyData should include { beta, dividendYield, revenueGrowth } from /api/company.
 *
 * Returns { score, tags, warnings }
 */
export function matchStock(ticker, profile = {}, companyData = {}) {
  const { investorType, riskProfile, focus } = profile;
  const { beta, dividendYield, revenueGrowth } = companyData;
  const tags = [];
  const warnings = [];
  let score = 50; // neutral baseline

  // Risk matching via Beta
  const stockRisk = getRiskFromBeta(beta);

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

  // Dividend matching (yield > 3%)
  const isHighDividend = dividendYield != null && dividendYield > 3;
  if (investorType === "dividend" && isHighDividend) {
    score += 20;
    tags.push("Utdelningsaktie");
  }
  if (focus === "dividends" && isHighDividend) {
    score += 10;
    if (!tags.includes("Utdelningsaktie")) tags.push("Bra utdelning");
  }

  // Growth matching (revenue growth > 15%)
  const isHighGrowth = revenueGrowth != null && revenueGrowth > 15;
  if (investorType === "growth" && isHighGrowth) {
    score += 20;
    tags.push("Tillväxtaktie");
  }
  if (focus === "appreciation" && isHighGrowth) {
    score += 10;
    if (!tags.includes("Tillväxtaktie")) tags.push("Tillväxtpotential");
  }

  // Value matching (low beta + reasonable valuation)
  if (investorType === "value" && stockRisk === "low") {
    score += 10;
    tags.push("Stabil värdeaktie");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, tags, warnings };
}

/**
 * Legacy function for compatibility — when no companyData is available,
 * returns null risk (no tags/warnings for risk).
 */
export function getStockRisk(ticker) {
  // Without beta data, we can't determine risk
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
 * Filter and sort suggestions based on full profile.
 * Note: Without beta data in suggestions, risk filtering is skipped.
 */
export function filterSuggestionsByProfile(suggestions, profile = {}) {
  return suggestions
    .map(s => {
      const match = matchStock(s.ticker, profile, {});
      return { ...s, ...match };
    })
    .sort((a, b) => b.score - a.score);
}
