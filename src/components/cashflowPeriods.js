// Period per kassaflödespost: belopp lagras som inmatat + period, allt räknas
// om till kr/mån (statrad, fördelning, sparutrymme). Default = month.
export const PERIODS = [
  { id: "month", label: "mån", perYear: 12 },
  { id: "quarter", label: "kvartal", perYear: 4 },
  { id: "year", label: "år", perYear: 1 },
];
export const PERIOD_BY_ID = Object.fromEntries(PERIODS.map(p => [p.id, p]));
// Räntekostnad per månad för ett lån: skuld × årsränta / 12.
export function loanInterestMonthly(loanValueSek, ratePct) {
  const v = Number(loanValueSek), r = Number(ratePct);
  if (!Number.isFinite(v) || !Number.isFinite(r)) return null;
  return (v * r) / 100 / 12;
}

// Din andel av ett lån (metadata.ownershipShare, %) — samma klampning som
// effectiveValueSek i lib/manualAssets.js. Kassaflödet är personligt: lägger
// du in DIN lön ska lånekopplade rader visa DIN del av ränta/amortering,
// precis som nettoförmögenheten redan räknar din andel av lånet.
export function loanSharePct(loan) {
  const raw = Number(loan?.metadata?.ownershipShare ?? 100);
  return Number.isFinite(raw) ? Math.min(100, Math.max(1, raw)) : 100;
}

// Din andel av lånets saldo — basen för lånekopplade kassaflödesrader.
export function loanShareValue(loan) {
  const v = Number(loan?.value_sek);
  if (!Number.isFinite(v)) return null;
  return v * loanSharePct(loan) / 100;
}

// loans: { [id]: manual_assets-rad } — en post med loanId + rate följer lånets
// aktuella skuld (amorterar du, sjunker räntan automatiskt). Saknas lånet
// (raderat) faller vi tillbaka på senast sparade belopp.
export function monthlyAmount(row, loans = {}) {
  if (row.loanId && row.rate != null) {
    const loan = loans[row.loanId];
    const m = loan ? loanInterestMonthly(loanShareValue(loan), row.rate) : null;
    if (m != null) return m;
  }
  const per = PERIOD_BY_ID[row.period]?.perYear ?? 12;
  return (row.amount * per) / 12;
}
