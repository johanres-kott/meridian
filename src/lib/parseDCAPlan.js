/**
 * Parse a DCA plan from the strategy text into structured monthly steps.
 * Handles formats like:
 *   Månad 1 (nu):\n- Atlas Copco (ATCO-A.ST): 12 000 SEK
 *   Mån 1: Bolag A — 8 000 kr
 */
export default function parseDCAPlan(text, savedAt) {
  if (!text) return null;

  // Find the HUR section (or fall back to full text)
  const hurMatch = text.match(/(?:\*\*|#{1,3}\s*)Hur\b[^\n]*\n([\s\S]*?)(?=(?:\*\*|#{1,3}\s*)(?:Varf|Vad|Motivering)|\s*$)/i);
  const hurText = hurMatch ? hurMatch[1] : text;

  // Match month headers: "Månad 1", "Mån 1", "Månad 2:", "Month 1 (nu):"
  const monthRegex = /(?:Månad|Mån|Vecka)\s*(\d+)[^\n]*\n([\s\S]*?)(?=(?:Månad|Mån|Vecka)\s*\d|$)/gi;
  const months = [];
  let match;

  while ((match = monthRegex.exec(hurText)) !== null) {
    const monthNum = parseInt(match[1]);
    const content = match[2].trim();

    // Parse individual purchases: "- Bolag (TICKER): 12 000 SEK" or "- Bolag (TICKER) — 12 000 kr"
    const purchaseRegex = /[-•]\s*([^(:]+?)(?:\s*\(([^)]+)\))?\s*[:—–-]\s*([\d\s]+)\s*(?:SEK|kr)/gi;
    const purchases = [];
    let pMatch;

    while ((pMatch = purchaseRegex.exec(content)) !== null) {
      purchases.push({
        name: pMatch[1].trim(),
        ticker: pMatch[2]?.trim() || null,
        amount: parseInt(pMatch[3].replace(/\s/g, "")),
      });
    }

    // If no structured purchases found, store raw content
    if (purchases.length === 0) {
      // Try simpler format: "Bolag A — 8 000 kr, Bolag B — 2 000 kr"
      const simpleRegex = /([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s]+?)(?:\s*\(([^)]+)\))?\s*[:—–-]\s*([\d\s]+)\s*(?:SEK|kr)/gi;
      let sMatch;
      while ((sMatch = simpleRegex.exec(content)) !== null) {
        purchases.push({
          name: sMatch[1].trim(),
          ticker: sMatch[2]?.trim() || null,
          amount: parseInt(sMatch[3].replace(/\s/g, "")),
        });
      }
    }

    if (purchases.length > 0) {
      months.push({
        month: monthNum,
        purchases,
        totalAmount: purchases.reduce((s, p) => s + p.amount, 0),
      });
    }
  }

  if (months.length === 0) return null;

  // Calculate which month we're in based on savedAt
  const startDate = new Date(savedAt);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  const currentMonth = Math.min(monthsElapsed + 1, months.length); // 1-indexed

  return {
    months,
    currentMonth,
    startDate,
    totalMonths: months.length,
    totalAmount: months.reduce((s, m) => s + m.totalAmount, 0),
  };
}
