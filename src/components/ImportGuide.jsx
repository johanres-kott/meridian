import { useIsMobile } from "../hooks/useIsMobile.js";

export default function ImportGuide({ onClose, onStartImport }) {
  const isMobile = useIsMobile();

  const steps = [
    {
      number: "1",
      title: "Logga in på Avanza",
      description: "Gå till avanza.se och logga in med BankID.",
    },
    {
      number: "2",
      title: "Gå till Rapporter",
      description: "Klicka på ditt namn uppe till höger → välj \"Rapporter & dokument\" → \"Månadsrapporter\".",
    },
    {
      number: "3",
      title: "Ladda ner senaste månadsrapporten",
      description: "Välj den senaste månadsrapporten (t.ex. \"Månadsrapport mars 2026\"). Klicka på PDF-ikonen för att ladda ner filen.",
      tip: "Välj den rapport som täcker alla dina konton om du har flera.",
    },
    {
      number: "4",
      title: "Importera i Thesion",
      description: "Klicka på \"Importera portfölj\" här i Thesion och dra in PDF-filen, eller klicka för att välja den.",
    },
    {
      number: "5",
      title: "Granska och bekräfta",
      description: "Thesion läser av alla innehav med antal aktier och GAV (genomsnittligt anskaffningsvärde). Granska listan, justera eventuella ticker-matchningar och klicka \"Importera\".",
      tip: "Aktier som redan finns i din portfölj markeras som \"Finns redan\" och hoppas över.",
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 12, padding: isMobile ? 20 : 32,
        width: isMobile ? "95vw" : 580, maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Importera från Avanza
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Steg-för-steg guide
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "var(--accent)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {step.number}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {step.description}
                </div>
                {step.tip && (
                  <div style={{
                    marginTop: 8, padding: "8px 12px", borderRadius: 6,
                    background: "var(--bg-secondary)", fontSize: 11, color: "var(--text-secondary)",
                    lineHeight: 1.5, borderLeft: "3px solid var(--accent)",
                  }}>
                    💡 {step.tip}
                  </div>
                )}
                {/* Placeholder for future screenshots */}
                {step.image && (
                  <img src={step.image} alt={step.title}
                    style={{ width: "100%", borderRadius: 6, marginTop: 10, border: "1px solid var(--border)" }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "9px 18px", fontSize: 13, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
            Stäng
          </button>
          <button onClick={() => { onClose(); onStartImport(); }}
            style={{ padding: "9px 22px", fontSize: 13, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Starta import →
          </button>
        </div>

        <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 8, background: "var(--bg-secondary)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Fungerar det inte?</strong> Se till att du laddar ner rapporten som PDF (inte öppnar den i webbläsaren).
          Filen heter vanligtvis något i stil med "Månadsrapport_2026-03.pdf".
          Kontakta oss på <a href="mailto:info@thesion.tech" style={{ color: "var(--accent)", textDecoration: "none" }}>info@thesion.tech</a> om du behöver hjälp.
        </div>
      </div>
    </div>
  );
}
