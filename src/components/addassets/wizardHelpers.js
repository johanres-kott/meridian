// Icke-komponent-hjälpare för add asset-wizards (separerade från
// wizardShared.jsx för att hålla react-refresh nöjd).

export const mono = { fontFamily: "var(--font-mono)" };

export const inputStyle = {
  width: "100%", fontSize: 14, padding: "8px 0", border: "none",
  borderBottom: "1px solid var(--border)", background: "none",
  color: "var(--text)", fontFamily: "inherit", outline: "none",
};

export function parseAmount(v) {
  if (v == null || String(v).trim() === "") return null;
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function fmtKr(v) {
  return `${v.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
}

// Amorteringskravets grundregel: belåningsgrad över 70 % → 2 %/år,
// 50–70 % → 1 %, annars 0. Skuldkvotsregeln (+1 % över 4,5 × bruttoinkomst)
// kräver inkomstuppgift och lämnas utanför förslaget.
export function suggestedAmortizationRate(ltvPct) {
  if (ltvPct == null || !Number.isFinite(Number(ltvPct))) return null;
  const ltv = Number(ltvPct);
  if (ltv > 70) return 2;
  if (ltv > 50) return 1;
  return 0;
}
