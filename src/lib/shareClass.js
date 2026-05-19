// Share-class helpers for Swedish tickers.
//
// Swedish dual-class structure: most large-cap Swedish companies issue A-shares
// (typically 1 or 10 votes) and B-shares (typically 1/10 vote). Same company,
// same dividend, same earnings — but different voting power. The Wallenberg,
// Stenbeck, Lundberg, and Douglas families control their groups through A-shares
// that give them voting majority despite holding a minority of equity capital.
//
// Other markets handle this differently:
// - US: tech founders (Meta, Alphabet, Snap) use dual-class structures too, but
//   ticker conventions vary (GOOG vs GOOGL). Non-tech US large-cap is mostly
//   single-class with one-share-one-vote.
// - UK/Germany: mostly single-class. Berkshire Hathaway and a few exceptions.
// - Finland (.HE): uses different encoding (e.g. WRT1V.HE).
//
// We only normalize Swedish (.ST) tickers — others pass through unchanged.

const SE_SHARE_CLASS_RE = /^([A-Z0-9]+)-(A|B|C|D|PREF)\.ST$/;

// "INVE-B.ST" → "INVE.ST", "ATCO-A.ST" → "ATCO.ST".
// Pass-through for non-Swedish or single-class tickers.
export function baseTicker(ticker) {
  if (!ticker) return ticker;
  const match = ticker.toUpperCase().match(SE_SHARE_CLASS_RE);
  return match ? `${match[1]}.ST` : ticker.toUpperCase();
}

// Returns "A", "B", "C", "D", "PREF" or null for tickers without a share-class suffix.
export function shareClass(ticker) {
  const match = (ticker || "").toUpperCase().match(SE_SHARE_CLASS_RE);
  return match ? match[2] : null;
}
