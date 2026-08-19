// Utgiftskategorier (Finary-mönstret: fördelning av "Money out")
export const EXPENSE_CATEGORIES = [
  { id: "boende",    label: "Boende",         color: "#7c4dff", hint: "Hyra, avgift, bolåneränta, el" },
  { id: "mat",       label: "Mat",            color: "var(--warn)", hint: "Mat, restaurang" },
  { id: "transport", label: "Transport",      color: "#26a69a", hint: "Bil, bensin, kollektivtrafik" },
  { id: "barn",      label: "Barn & familj",  color: "#ec407a", hint: "Förskola, aktiviteter" },
  { id: "lan",       label: "Lån & räntor",   color: "var(--neg)", hint: "Ränta på bolån, billån, CSN" },
  { id: "amortering",label: "Amortering",     color: "var(--green-400)", hint: "Minskar lånet — räknas som sparande", saving: true },
  { id: "abonnemang",label: "Abonnemang",     color: "#5c6bc0", hint: "Mobil, streaming, gym" },
  { id: "forsakring",label: "Försäkringar",   color: "#8d6e63", hint: "Hem, bil, liv" },
  { id: "ovrigt",    label: "Övrigt",         color: "#78909c", hint: "Allt annat" },
];
export const CAT_BY_ID = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c]));
// Amortering lämnar kontot men bygger nettoförmögenhet (lånet minskar) — vi
// räknar den som sparande, inte konsumtion, i statrad, stapel och sparkvot.
export const isSaving = row => !!CAT_BY_ID[row.category]?.saving;
