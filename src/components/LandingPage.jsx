import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import Login from "./Login.jsx";

const FEATURES = [
  {
    icon: "📊",
    title: "Portföljhantering",
    desc: "Bevaka aktier, spåra din portfölj och se P&L i realtid. Importera direkt från Avanza.",
  },
  {
    icon: "🏢",
    title: "Investmentbolag",
    desc: "Följ 7 svenska investmentbolag — se deras innehav, ledning och strategier.",
  },
  {
    icon: "🧠",
    title: "Smart analys",
    desc: "AI-driven scoring baserad på Piotroski, Magic Formula och fler etablerade modeller.",
  },
  {
    icon: "🎯",
    title: "Personliga förslag",
    desc: "Aktieförslag anpassade efter din investerarprofil — värde, tillväxt eller utdelning.",
  },
];

export default function LandingPage({ onShowPrivacy }) {
  const isMobile = useIsMobile();
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div>
        <div style={{ padding: isMobile ? "12px 16px" : "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setShowLogin(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2962ff", fontFamily: "inherit" }}>
            ← Tillbaka
          </button>
        </div>
        <Login onShowPrivacy={onShowPrivacy} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isMobile ? "16px 20px" : "16px 48px",
        borderBottom: "1px solid #f0f3fa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="12" fill="#3B6AE6"/>
            <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white"/>
            <ellipse cx="30" cy="30" rx="14" ry="14" fill="white"/>
            <ellipse cx="30" cy="30" rx="11" ry="11" fill="#3B6AE6"/>
            <circle cx="26" cy="27" r="2.5" fill="white"/>
            <polygon points="20,38 18,48 24,44 30,48 28,38" fill="white"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thesion</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowLogin(true)}
            style={{ padding: "8px 20px", border: "1px solid #e0e3eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#131722", fontWeight: 500 }}>
            Logga in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: isMobile ? "48px 20px" : "80px 48px",
        maxWidth: 900, margin: "0 auto", textAlign: "center",
      }}>
        <h1 style={{
          fontSize: isMobile ? 32 : 48, fontWeight: 700, color: "#131722",
          fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2, marginBottom: 16,
        }}>
          Smartare investeringar,{isMobile ? " " : <br />}baserade på data
        </h1>
        <p style={{ fontSize: isMobile ? 15 : 18, color: "#787b86", lineHeight: 1.6, maxWidth: 600, margin: "0 auto 32px" }}>
          Analysera aktier med etablerade finansiella modeller. Få personliga förslag baserade på din investerarprofil. Följ svenska investmentbolag.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowLogin(true)}
            style={{ padding: "12px 32px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Kom igång gratis
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: isMobile ? "32px 20px" : "48px 48px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: 24, borderRadius: 8, border: "1px solid #e0e3eb",
              background: "#fafbfd",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#131722", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: isMobile ? "32px 20px" : "48px 48px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color: "#131722", textAlign: "center", marginBottom: 32 }}>
          Så fungerar det
        </h2>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, justifyContent: "center" }}>
          {[
            { step: "1", title: "Skapa profil", desc: "Svara på 4 frågor om din investeringsstil" },
            { step: "2", title: "Få förslag", desc: "AI-drivna rekommendationer baserat på din profil" },
            { step: "3", title: "Analysera", desc: "Djupdyk i bolag med nyckeltal, insiderhandel och risk" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: "#2962ff", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 600, margin: "0 auto 12px",
              }}>
                {s.step}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#131722", marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#787b86" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section style={{
        padding: isMobile ? "32px 20px 48px" : "48px 48px 64px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color: "#131722", textAlign: "center", marginBottom: 12 }}>
          Etablerade analysmodeller
        </h2>
        <p style={{ fontSize: 13, color: "#787b86", textAlign: "center", marginBottom: 24 }}>
          Vi använder beprövade finansiella modeller — inte gissningar
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {["Piotroski F-Score", "Magic Formula", "PEG Ratio", "Beta-riskanalys", "Kvalitetspoäng", "Utdelningsstabilitet"].map(m => (
            <span key={m} style={{
              padding: "6px 14px", borderRadius: 20, background: "#f0f3fa",
              fontSize: 12, color: "#131722", fontWeight: 500,
            }}>
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: isMobile ? "40px 20px" : "64px 48px",
        background: "#131722", textAlign: "center",
      }}>
        <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: "#fff", marginBottom: 12 }}>
          Börja analysera idag
        </h2>
        <p style={{ fontSize: 14, color: "#787b86", marginBottom: 24 }}>
          Gratis att använda. Inga kreditkort krävs.
        </p>
        <button onClick={() => setShowLogin(true)}
          style={{ padding: "12px 32px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Skapa konto
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: isMobile ? "20px 20px" : "20px 48px",
        borderTop: "1px solid #f0f3fa",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ fontSize: 11, color: "#b2b5be" }}>Thesion — thesion.tech</span>
        <button onClick={onShowPrivacy} style={{ fontSize: 11, color: "#b2b5be", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Integritetspolicy
        </button>
      </footer>
    </div>
  );
}
