// Knappstilar för landningssidan (designsystemets Button-varianter, pill).
const base = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  borderRadius: "var(--radius-pill)", fontWeight: 600, letterSpacing: "0.01em",
  cursor: "pointer", fontFamily: "inherit", transition: "all var(--duration-base) var(--ease-out)", whiteSpace: "nowrap",
};
export const btnPrimary = { ...base, background: "var(--brand)", color: "#fff", border: "1px solid transparent" };
export const btnSecondary = { ...base, background: "var(--surface-card)", color: "var(--ink)", border: "1px solid var(--border)" };
export const btnGhost = { ...base, background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" };
