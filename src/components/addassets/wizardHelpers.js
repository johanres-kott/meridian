// Icke-komponent-hjälpare för add asset-wizards (separerade från
// wizardShared.jsx för att hålla react-refresh nöjd).

export const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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
