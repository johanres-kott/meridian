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

// loans: { [id]: manual_assets-rad } — en post med loanId + rate följer lånets
// aktuella skuld (amorterar du, sjunker räntan automatiskt). Saknas lånet
// (raderat) faller vi tillbaka på senast sparade belopp.
export function monthlyAmount(row, loans = {}) {
  if (row.loanId && row.rate != null) {
    const loan = loans[row.loanId];
    // din andel av lånet (delat bolån) — metadata.ownershipShare i procent
    const share = Number(loan?.metadata?.ownershipShare);
    const owned = loan ? Number(loan.value_sek) * (Number.isFinite(share) && share > 0 && share <= 100 ? share / 100 : 1) : null;
    const m = loan ? loanInterestMonthly(owned, row.rate) : null;
    if (m != null) return m;
  }
  const per = PERIOD_BY_ID[row.period]?.perYear ?? 12;
  return (row.amount * per) / 12;
}
