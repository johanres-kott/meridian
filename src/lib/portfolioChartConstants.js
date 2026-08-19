// Tidsspann à la Finary (1D 7D 1M 3M 6M YTD 1Y ALL). days=null = dynamiskt
// (YTD räknas från 1 jan, Allt = hela historiken). Väljs globalt på Hem/
// Portfölj via RangeBar och styr både hero-förändringen och grafen.
export const RANGES = [
  { id: "1w", label: "1V", days: 7 },
  { id: "1m", label: "1M", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "6m", label: "6M", days: 180 },
  { id: "ytd", label: "I år", days: null },
  { id: "1y", label: "1Å", days: 365 },
  { id: "all", label: "Allt", days: null },
];

export const DEFAULT_RANGE = "3m";

// Cutoff-datum (YYYY-MM-DD) för ett spann, eller null för "allt".
export function rangeCutoff(rangeId, now = new Date()) {
  const def = RANGES.find(r => r.id === rangeId);
  if (!def || rangeId === "all") return null;
  if (rangeId === "ytd") return `${now.getFullYear()}-01-01`;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (def.days || 90));
  return cutoff.toISOString().slice(0, 10);
}

export const INDEXES = [
  { id: "omxs30", ticker: "^OMX", label: "OMXS30", color: "#787b86" },
  { id: "sp500", ticker: "^GSPC", label: "S&P 500", color: "#5b9bd5" },
];
