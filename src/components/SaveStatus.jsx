import { useUser } from "../contexts/UserContext.jsx";

// Sparstatus + Spara igen-knapp för inställningssidor. Allt sparas
// automatiskt — det här är den ärliga bekräftelsen (och räddningen när en
// skrivning inte nådde servern): idle → "sparas automatiskt", saving →
// "Sparar…", saved → "Allt sparat", error → varning + riktig omsändning
// av exakt de ändringar som misslyckades (retrySave i UserContext).
export default function SaveStatus() {
  const { saveStatus, retrySave } = useUser();

  if (saveStatus === "error") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <span style={{ color: "var(--neg)" }}>Ändringar kunde inte sparas</span>
        <button onClick={retrySave}
          style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          Spara igen
        </button>
      </span>
    );
  }
  if (saveStatus === "saving") {
    return <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Sparar…</span>;
  }
  if (saveStatus === "saved") {
    return <span style={{ fontSize: 12, color: "var(--pos)" }}>Allt sparat</span>;
  }
  return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Alla ändringar sparas automatiskt</span>;
}
