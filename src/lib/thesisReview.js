// Pure logic for the thesis review (disposition effect) feature.
// Kept side-effect-free so it can be unit-tested without React or Supabase.

export const DEFAULT_THRESHOLD_PCT = 20;
export const DEFAULT_REVIEW_MONTHS = 6;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MONTH = 30 * MS_PER_DAY; // 30-day month is precise enough for "stale review" UX

/**
 * Compute return % from purchase price (gav) and current price.
 * Returns null if either value is missing or gav is non-positive.
 */
export function computeReturnPct(gav, currentPrice) {
  if (!gav || gav <= 0 || currentPrice == null) return null;
  return ((currentPrice - gav) / gav) * 100;
}

/**
 * Months between two dates. Always non-negative. Returns null on bad input.
 */
export function monthsBetween(from, to = new Date()) {
  if (!from) return null;
  const fromMs = from instanceof Date ? from.getTime() : new Date(from).getTime();
  if (Number.isNaN(fromMs)) return null;
  const toMs = to instanceof Date ? to.getTime() : new Date(to).getTime();
  return Math.max(0, (toMs - fromMs) / MS_PER_MONTH);
}

/**
 * Classify a holding given its return and review state.
 *
 * Categories (mutually exclusive):
 *   - "winner_stale"  — up >= threshold AND review is stale (or never done)
 *   - "winner_fresh"  — up >= threshold AND recently reviewed
 *   - "loser_stale"   — down <= -threshold AND review is stale AND thesis still 'active'
 *   - "loser_fresh"   — down <= -threshold AND either reviewed recently or thesis is weakening/broken
 *   - "neutral"       — return between -threshold and +threshold, or no return data
 *
 * thesisStatus defaults to "active" when missing — matches user intent of "just bought, no review yet".
 */
export function classifyHolding({ returnPct, thesisStatus, monthsSinceReview }, opts = {}) {
  const threshold = opts.thresholdPct ?? DEFAULT_THRESHOLD_PCT;
  const reviewMonths = opts.reviewMonths ?? DEFAULT_REVIEW_MONTHS;
  const status = thesisStatus || "active";
  const isStale = monthsSinceReview == null || monthsSinceReview >= reviewMonths;

  if (returnPct == null) return "neutral";

  if (returnPct >= threshold) {
    return isStale ? "winner_stale" : "winner_fresh";
  }
  if (returnPct <= -threshold) {
    // A loser whose owner has already flagged thesis as weakening/broken is "fresh" —
    // they've acknowledged the situation. The disposition trap is the unreviewed
    // loser with an "active" thesis the holder hasn't actually re-validated.
    if (status !== "active") return "loser_fresh";
    return isStale ? "loser_stale" : "loser_fresh";
  }
  return "neutral";
}

/**
 * Summarize a portfolio for the disposition-effect nudge.
 *
 * Input: array of { item, returnPct, monthsSinceReview }
 * Output: counts + weighted return aggregates, suitable for direct display.
 */
export function summarizePortfolio(rows, opts = {}) {
  const counts = {
    winner_stale: 0, winner_fresh: 0,
    loser_stale: 0, loser_fresh: 0,
    neutral: 0,
  };

  let winnerWeightedReturn = 0;
  let winnerWeight = 0;
  let loserWeightedReturn = 0;
  let loserWeight = 0;

  for (const row of rows) {
    const category = classifyHolding({
      returnPct: row.returnPct,
      thesisStatus: row.item?.thesis_status,
      monthsSinceReview: row.monthsSinceReview,
    }, opts);
    counts[category]++;

    // Weight by position size (shares * gav) so a 50% pop on a 1-share position
    // does not drown out a 5% gain on a meaningful holding.
    const positionValue = (row.item?.shares ?? 0) * (row.item?.gav ?? 0);
    if (positionValue > 0 && row.returnPct != null) {
      if (category === "winner_stale" || category === "winner_fresh") {
        winnerWeightedReturn += row.returnPct * positionValue;
        winnerWeight += positionValue;
      } else if (category === "loser_stale" || category === "loser_fresh") {
        loserWeightedReturn += row.returnPct * positionValue;
        loserWeight += positionValue;
      }
    }
  }

  return {
    counts,
    avgWinnerReturnPct: winnerWeight > 0 ? winnerWeightedReturn / winnerWeight : null,
    avgLoserReturnPct: loserWeight > 0 ? loserWeightedReturn / loserWeight : null,
  };
}
