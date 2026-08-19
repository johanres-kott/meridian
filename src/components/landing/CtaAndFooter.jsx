import Logo from "./Logo.jsx";
import { btnPrimary } from "./buttons.js";

// Avslutande CTA (mörkgrön sektion, guld-CTA enligt designsystemet) + footer.

export default function CtaAndFooter({ isMobile, onSignup, onShowPrivacy }) {
  return (
    <>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: `${isMobile ? 56 : 96}px ${isMobile ? 20 : 40}px` }}>
        <div style={{ background: "var(--surface-dark)", borderRadius: "var(--radius-xl)", padding: isMobile ? "40px 24px" : "64px 56px", color: "var(--on-dark)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: isMobile ? 30 : 44, lineHeight: 1.1, letterSpacing: "-0.01em", maxWidth: 640, margin: "0 auto 16px" }}>
            Få koll på hela din ekonomi — gratis att börja.
          </h2>
          <p style={{ fontSize: 16, color: "var(--on-dark-secondary)", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 32px" }}>
            Lägg in portfölj, pension och bostad på några minuter. Inga bankkopplingar, inga kortuppgifter — dina egna siffror, i kronor.
          </p>
          <button onClick={onSignup} style={{ ...btnPrimary, background: "var(--gold-500)", color: "var(--green-900)", padding: "13px 30px", fontSize: 15 }}>
            Kom igång gratis
          </button>
          <div style={{ fontSize: 12.5, color: "var(--on-dark-muted)", marginTop: 16 }}>Generell information, inte personlig finansiell rådgivning.</div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `${isMobile ? 24 : 32}px ${isMobile ? 20 : 40}px`, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={24} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}>Thesion</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginLeft: 8 }}>© {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Kurser: Yahoo Finance · Fonder: Morningstar</span>
            <button onClick={onShowPrivacy} style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, borderRadius: 0 }}>
              Integritetspolicy
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
