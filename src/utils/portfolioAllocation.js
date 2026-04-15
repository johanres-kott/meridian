/**
 * Portfolio Allocation Analysis — Core-Satellite-modellen
 *
 * Classifies holdings into Core / Satellite / Speculation buckets
 * and compares against target allocation based on risk profile.
 *
 * Classification priority (scored holdings):
 *   1. Score-based signals (beta, risk rating, quality, Piotroski)
 *   2. Sector + market cap heuristics
 *   3. Default: satellite (benefit of the doubt)
 *
 * Classification priority (unscored holdings):
 *   1. Price-data signals (market cap from API response)
 *   2. Sector from price-data
 *   3. Name heuristics
 *   4. Default: satellite (NOT speculation — avoids false negatives)
 *
 * Core:        Stable, low-risk, blue chips, defensive sectors, high quality
 * Satellite:   Growth, thematic, moderate risk, mid-caps
 * Speculation: Very high risk, micro-caps, pre-revenue, turnarounds
 */

// Target allocations by risk profile (percentages)
export const TARGET_ALLOCATIONS = {
  low:    { core: 75, satellite: 20, speculation: 5 },
  medium: { core: 60, satellite: 30, speculation: 10 },
  high:   { core: 40, satellite: 35, speculation: 25 },
};

// Sector classifications
const DEFENSIVE_SECTORS = [
  "Healthcare", "Consumer Defensive", "Utilities",
  "Financial Services", "Industrials",
];

const GROWTH_SECTORS = [
  "Technology", "Communication Services", "Consumer Cyclical",
];

const SPECULATIVE_SECTORS = [
  "Crypto", "Cannabis",
];

// Name-based heuristics for unscored holdings
const CORE_NAME_HINTS = ["invest", "bank", "insurance", "försäkring", "holding"];
const SATELLITE_NAME_HINTS = ["group", "inc", "corp", "plc", "ab"];

/**
 * Compute a numeric score for bucket classification.
 * Positive = core-leaning, negative = speculation-leaning, near zero = satellite.
 *
 * This replaces the old if/else chain with a points system that accumulates
 * evidence from multiple signals rather than letting one signal override all.
 */
function classificationScore(scoreData, priceData, itemName) {
  let points = 0;
  const hasScoreData = !!scoreData;

  const beta = scoreData?.beta;
  const risk = scoreData?.risk;
  const quality = scoreData?.subScores?.qualityScore;
  const piotroski = scoreData?.subScores?.piotroski;
  const sector = scoreData?.sector || priceData?.sector || "";
  const marketCap = scoreData?.marketCap || 0;

  if (hasScoreData) {
    // — Risk rating (strong signal) —
    if (risk === "low") points += 3;
    else if (risk === "medium") points += 0;
    else if (risk === "high") points -= 2;

    // — Beta (volatility) —
    if (beta != null) {
      if (beta < 0.7) points += 3;
      else if (beta < 1.0) points += 1;
      else if (beta > 2.0) points -= 3;
      else if (beta > 1.5) points -= 2;
      else if (beta > 1.2) points -= 1;
    }

    // — Quality + Piotroski (fundamental strength) —
    if (quality >= 70) points += 2;
    else if (quality >= 50) points += 1;
    else if (quality != null && quality < 30) points -= 1;

    if (piotroski >= 7) points += 2;
    else if (piotroski >= 5) points += 1;
    else if (piotroski != null && piotroski <= 2) points -= 1;

    // — Sector —
    if (DEFENSIVE_SECTORS.includes(sector)) points += 1;
    else if (SPECULATIVE_SECTORS.includes(sector)) points -= 3;

    // — Market cap (billions) —
    if (marketCap > 100) points += 2;       // Mega cap
    else if (marketCap > 20) points += 1;   // Large cap
    else if (marketCap > 5) points += 0;    // Mid cap
    else if (marketCap > 1) points -= 1;    // Small cap
    else if (marketCap > 0) points -= 2;    // Micro cap
  } else {
    // — No score data: use price-data and name heuristics —
    // Default is 0 (satellite) — only move away with evidence

    if (sector) {
      if (DEFENSIVE_SECTORS.includes(sector)) points += 1;
      else if (SPECULATIVE_SECTORS.includes(sector)) points -= 2;
    }

    const name = (itemName || "").toLowerCase();
    if (CORE_NAME_HINTS.some(h => name.includes(h))) points += 1;
  }

  return { points, sector, beta, risk, quality, marketCap };
}

/**
 * Map points to bucket.
 * Core: >= 3, Speculation: <= -3, Satellite: everything in between.
 */
function pointsToBucket(points) {
  if (points >= 3) return "core";
  if (points <= -3) return "speculation";
  return "satellite";
}

/**
 * Classify a single holding into a bucket.
 * Uses a points-based system that accumulates evidence from multiple signals.
 */
export function classifyHolding(item, scoreData, priceData, fxRates) {
  // Calculate value for weighting
  const price = priceData?.price || 0;
  const currency = priceData?.currency || scoreData?.currency || "SEK";
  const fxRate = fxRates?.[currency] || 1;
  const shares = item.shares || 0;
  const valueSek = shares * price * fxRate;

  // Funds get special classification based on type
  if (item.type === "fund") {
    // Index/passive funds → Core (stable, diversified, low cost)
    // Active funds → Satellite (manager risk, thematic exposure)
    const bucket = item.indexFund ? "core" : "satellite";
    const points = item.indexFund ? 5 : 0;
    return {
      ticker: item.ticker,
      name: item.name,
      bucket,
      points,
      valueSek,
      shares,
      sector: "Fund",
      beta: null,
      risk: item.indexFund ? "low" : "medium",
      quality: null,
      marketCap: null,
    };
  }

  const { points, sector, beta, risk, quality, marketCap } = classificationScore(
    scoreData, priceData, item.name
  );
  const bucket = pointsToBucket(points);

  return {
    ticker: item.ticker,
    name: item.name,
    bucket,
    points,
    valueSek,
    shares,
    sector,
    beta,
    risk,
    quality,
    marketCap,
  };
}

/**
 * Analyze full portfolio allocation.
 * Returns current allocation, target, and gap analysis.
 */
export function analyzeAllocation(items, scores, prices, fxRates, riskProfile = "medium") {
  const holdings = items
    .filter(item => item.shares > 0)
    .map(item => {
      const scoreData = scores[item.ticker?.toUpperCase()];
      const priceData = prices[item.ticker];
      return classifyHolding(item, scoreData, priceData, fxRates);
    })
    .filter(h => h.valueSek > 0);

  if (holdings.length === 0) return null;

  const totalValue = holdings.reduce((s, h) => s + h.valueSek, 0);

  // Current allocation
  const buckets = { core: 0, satellite: 0, speculation: 0 };
  holdings.forEach(h => { buckets[h.bucket] += h.valueSek; });

  const current = {
    core: totalValue > 0 ? Math.round((buckets.core / totalValue) * 100) : 0,
    satellite: totalValue > 0 ? Math.round((buckets.satellite / totalValue) * 100) : 0,
    speculation: totalValue > 0 ? Math.round((buckets.speculation / totalValue) * 100) : 0,
  };

  // Ensure percentages add up to 100
  const diff = 100 - current.core - current.satellite - current.speculation;
  if (diff !== 0) {
    const largest = Object.entries(current).sort((a, b) => b[1] - a[1])[0][0];
    current[largest] += diff;
  }

  const target = TARGET_ALLOCATIONS[riskProfile] || TARGET_ALLOCATIONS.medium;

  // Gap analysis (positive = over target, negative = under target)
  const gap = {
    core: current.core - target.core,
    satellite: current.satellite - target.satellite,
    speculation: current.speculation - target.speculation,
  };

  // Group holdings by bucket
  const grouped = {
    core: holdings.filter(h => h.bucket === "core").sort((a, b) => b.valueSek - a.valueSek),
    satellite: holdings.filter(h => h.bucket === "satellite").sort((a, b) => b.valueSek - a.valueSek),
    speculation: holdings.filter(h => h.bucket === "speculation").sort((a, b) => b.valueSek - a.valueSek),
  };

  return {
    holdings,
    totalValue,
    current,
    target,
    gap,
    grouped,
    riskProfile,
    isBalanced: Math.abs(gap.core) <= 10 && Math.abs(gap.speculation) <= 5,
  };
}

/**
 * Generate a text summary for Mats chat context.
 */
export function allocationSummary(analysis) {
  if (!analysis) return "";

  const { current, target, gap, grouped, totalValue, riskProfile } = analysis;
  const riskLabel = { low: "låg", medium: "medel", high: "hög" }[riskProfile] || riskProfile;

  let summary = `PORTFÖLJALLOKERING (Core-Satellite-modellen):`;
  summary += `\nRiskprofil: ${riskLabel}`;
  summary += `\nTotalt portföljvärde: ${Math.round(totalValue).toLocaleString("sv-SE")} SEK`;
  summary += `\n\nNuvarande: Kärna ${current.core}%, Satellit ${current.satellite}%, Spekulation ${current.speculation}%`;
  summary += `\nMål:       Kärna ${target.core}%, Satellit ${target.satellite}%, Spekulation ${target.speculation}%`;
  summary += `\nAvvikelse: Kärna ${gap.core > 0 ? "+" : ""}${gap.core}pp, Satellit ${gap.satellite > 0 ? "+" : ""}${gap.satellite}pp, Spekulation ${gap.speculation > 0 ? "+" : ""}${gap.speculation}pp`;

  if (grouped.core.length > 0) {
    summary += `\n\nKÄRNA (${current.core}%): ${grouped.core.map(h => h.name).join(", ")}`;
  }
  if (grouped.satellite.length > 0) {
    summary += `\nSATELLIT (${current.satellite}%): ${grouped.satellite.map(h => h.name).join(", ")}`;
  }
  if (grouped.speculation.length > 0) {
    summary += `\nSPEKULATION (${current.speculation}%): ${grouped.speculation.map(h => h.name).join(", ")}`;
  }

  return summary;
}

export const BUCKET_META = {
  core: { label: "Kärna", color: "#089981", icon: "🛡️", desc: "Stabila blue chips, defensiva bolag, låg risk" },
  satellite: { label: "Satellit", color: "#5b9bd5", icon: "🚀", desc: "Tillväxt, tematiska satsningar, medel risk" },
  speculation: { label: "Spekulation", color: "#f23645", icon: "🎲", desc: "Hög risk, hög uppsida, turnarounds" },
};
