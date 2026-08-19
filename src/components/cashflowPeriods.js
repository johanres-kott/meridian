// Period per kassaflödespost: belopp lagras som inmatat + period, allt räknas
// om till kr/mån (statrad, fördelning, sparutrymme). Default = month.
export const PERIODS = [
  { id: "month", label: "mån", perYear: 12 },
  { id: "quarter", label: "kvartal", perYear: 4 },
  { id: "year", label: "år", perYear: 1 },
];
export const PERIOD_BY_ID = Object.fromEntries(PERIODS.map(p => [p.id, p]));
export function monthlyAmount(row) {
  const per = PERIOD_BY_ID[row.period]?.perYear ?? 12;
  return (row.amount * per) / 12;
}
