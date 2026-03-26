import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import Login from "./Login.jsx";

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="18" width="5" height="10" rx="1" fill="#2962ff" opacity="0.3"/>
        <rect x="11" y="12" width="5" height="16" rx="1" fill="#2962ff" opacity="0.5"/>
        <rect x="18" y="8" width="5" height="20" rx="1" fill="#2962ff" opacity="0.7"/>
        <rect x="25" y="4" width="5" height="24" rx="1" fill="#2962ff"/>
      </svg>
    ),
    title: "Portföljhantering",
    desc: "Bevaka aktier, spåra din portfölj och se P&L i realtid. Importera direkt från Avanza.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#2962ff" opacity="0.1"/>
        <rect x="6" y="6" width="20" height="20" rx="3" fill="#2962ff" opacity="0.2"/>
        <path d="M10 16L14 20L22 12" stroke="#2962ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Investmentbolag",
    desc: "Följ 7 svenska investmentbolag — se deras innehav, ledning och strategier.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#2962ff" opacity="0.1"/>
        <circle cx="16" cy="16" r="8" fill="#2962ff" opacity="0.2"/>
        <circle cx="16" cy="16" r="3.5" fill="#2962ff"/>
      </svg>
    ),
    title: "Smart analys",
    desc: "Scoring baserad på Piotroski F-Score, Magic Formula och fler etablerade modeller.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L20 12H28L22 18L24 26L16 21L8 26L10 18L4 12H12L16 4Z" fill="#2962ff" opacity="0.15"/>
        <path d="M16 8L18.5 14H25L20 18L21.5 24L16 20.5L10.5 24L12 18L7 14H13.5L16 8Z" fill="#2962ff"/>
      </svg>
    ),
    title: "Personliga förslag",
    desc: "Aktieförslag anpassade efter din investerarprofil — värde, tillväxt eller utdelning.",
  },
];

const STATS = [
  { value: "200+", label: "Analyserade aktier" },
  { value: "5", label: "Scoringmodeller" },
  { value: "7", label: "Investmentbolag" },
  { value: "Realtid", label: "Marknadsdata" },
];

export default function LandingPage({ onShowPrivacy }) {
  const isMobile = useIsMobile();
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div>
        <div style={{ padding: isMobile ? "12px 16px" : "12px 48px", display: "flex", alignItems: "center" }}>
          <button onClick={() => setShowLogin(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2962ff", fontFamily: "inherit" }}>
            ← Tillbaka
          </button>
        </div>
        <Login onShowPrivacy={onShowPrivacy} />
      </div>
    );
  }

  const maxW = { maxWidth: 1080, margin: "0 auto" };
  const pad = isMobile ? "0 20px" : "0 48px";

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out both; }
        .fade-up-d1 { animation-delay: 0.1s; }
        .fade-up-d2 { animation-delay: 0.2s; }
        .fade-up-d3 { animation-delay: 0.3s; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isMobile ? "16px 20px" : "18px 48px",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
            <path d="M8 32 L18 32 L22 22 L28 38 L32 18 L36 32 L48 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontSize: 21, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>Thesion</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setShowLogin(true)}
            style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#131722", fontWeight: 500 }}>
            Logga in
          </button>
          <button onClick={() => setShowLogin(true)}
            style={{ padding: "8px 20px", background: "#131722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}>
            Kom igång
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: isMobile ? "56px 20px 40px" : "100px 48px 72px",
        ...maxW, textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Premium layered wave background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {/* Soft gradient orbs */}
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(41,98,255,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "10%", left: "-15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,153,129,0.05) 0%, transparent 70%)", filter: "blur(40px)" }} />
          {/* Layered waves */}
          <svg style={{ position: "absolute", bottom: isMobile ? -60 : -100, left: 0, width: "100%", opacity: 0.08 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2962ff"/>
                <stop offset="100%" stopColor="#089981"/>
              </linearGradient>
            </defs>
            <path d="M0,192L48,186.7C96,181,192,171,288,186.7C384,203,480,245,576,240C672,235,768,181,864,165.3C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z" fill="url(#waveGrad1)"/>
          </svg>
          <svg style={{ position: "absolute", bottom: isMobile ? -80 : -120, left: 0, width: "100%", opacity: 0.05 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,256C672,267,768,245,864,218.7C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L0,320Z" fill="#2962ff"/>
          </svg>
          {/* Subtle grid lines */}
          <svg style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 900, opacity: 0.03 }} viewBox="0 0 800 300" fill="none">
            <path d="M0 250 Q100 200 200 220 T400 180 T600 140 T800 100" stroke="#2962ff" strokeWidth="1.5" fill="none"/>
            <path d="M0 270 Q150 230 300 250 T600 200 T800 150" stroke="#089981" strokeWidth="1" fill="none"/>
            <path d="M0 230 Q200 180 400 200 T800 120" stroke="#2962ff" strokeWidth="0.5" fill="none" strokeDasharray="4 6"/>
          </svg>
        </div>
        <div className="fade-up" style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
          <span style={{
            display: "inline-block", padding: "5px 14px", borderRadius: 20,
            background: "linear-gradient(135deg, #eef2ff 0%, #e8f5e9 100%)",
            fontSize: 12, fontWeight: 500, color: "#2962ff", letterSpacing: "0.02em",
          }}>
            Investeringsanalys driven av data
          </span>
        </div>
        <h1 className="fade-up fade-up-d1" style={{ position: "relative", zIndex: 1,
          fontSize: isMobile ? 36 : 56, fontWeight: 800, color: "#131722",
          fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.1,
          marginBottom: 20, letterSpacing: "-0.03em",
        }}>
          Analysera smartare.{isMobile ? " " : <br />}
          <span style={{ background: "linear-gradient(135deg, #2962ff 0%, #1e88e5 50%, #089981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Investera tryggare.
          </span>
        </h1>
        <p className="fade-up fade-up-d2" style={{ position: "relative", zIndex: 1,
          fontSize: isMobile ? 16 : 19, color: "#5a5d65", lineHeight: 1.7,
          maxWidth: 580, margin: "0 auto 36px", fontWeight: 400,
        }}>
          Få aktieförslag baserade på etablerade finansiella modeller, anpassade efter din investerarprofil. Följ svenska investmentbolag i realtid.
        </p>
        <div className="fade-up fade-up-d3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <button onClick={() => setShowLogin(true)}
            style={{
              padding: "14px 36px", background: "#2962ff", color: "#fff", border: "none",
              borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(41,98,255,0.3)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(41,98,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(41,98,255,0.3)"; }}
          >
            Kom igång gratis
          </button>
          <button onClick={() => {
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
          }}
            style={{ padding: "14px 28px", background: "none", border: "1px solid #e0e3eb", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "inherit", color: "#5a5d65", fontWeight: 500 }}>
            Läs mer ↓
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ padding: pad, ...maxW }}>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 1, background: "#e0e3eb", borderRadius: 12, overflow: "hidden",
          marginBottom: isMobile ? 48 : 80,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "#fafbfd", padding: isMobile ? "20px 16px" : "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#787b86", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: pad, ...maxW, marginBottom: isMobile ? 48 : 80 }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", marginBottom: 12 }}>
            Allt du behöver för att investera smartare
          </h2>
          <p style={{ fontSize: 15, color: "#787b86", maxWidth: 500, margin: "0 auto" }}>
            Från portföljöversikt till djupanalys — ett verktyg byggt för svenska investerare.
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 16 : 20,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: isMobile ? 24 : 32, borderRadius: 16, border: "1px solid #eceef1",
              background: "#fff",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#2962ff"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(41,98,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#eceef1"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#131722", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#787b86", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: isMobile ? "48px 20px" : "80px 48px",
        background: "#fafbfd",
      }}>
        <div style={maxW}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", marginBottom: 12 }}>
              Tre steg till bättre investeringar
            </h2>
            <p style={{ fontSize: 15, color: "#787b86" }}>
              Kom igång på under en minut
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 32 : 48, justifyContent: "center", alignItems: isMobile ? "center" : "flex-start" }}>
            {[
              { step: "01", title: "Berätta vem du är", desc: "Svara på fyra snabba frågor om din investeringsstil, riskprofil och intressen.", color: "#2962ff" },
              { step: "02", title: "Utforska förslag", desc: "Få en personlig topplista med aktier rankade med etablerade analysmodeller.", color: "#089981" },
              { step: "03", title: "Analysera på djupet", desc: "Djupdyk i bolag med nyckeltal, insiderhandel, risk och AI-assistent.", color: "#e65100" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: isMobile ? "center" : "left", maxWidth: 280 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: s.color,
                  fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: "0.05em",
                }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#131722", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#787b86", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models */}
      <section style={{ padding: isMobile ? "48px 20px" : "80px 48px" }}>
        <div style={maxW}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 700, color: "#131722", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", marginBottom: 12 }}>
              Beprövade modeller, inte gissningar
            </h2>
            <p style={{ fontSize: 15, color: "#787b86", maxWidth: 500, margin: "0 auto" }}>
              Vi kombinerar fem etablerade finansiella modeller till en composite score anpassad efter din profil.
            </p>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 12,
          }}>
            {[
              { name: "Piotroski F-Score", desc: "9 kriterier för finansiell hälsa", score: "0–9" },
              { name: "Magic Formula", desc: "Earnings yield + ROIC", score: "0–100" },
              { name: "PEG Ratio", desc: "P/E i förhållande till tillväxt", score: "Ratio" },
              { name: "Beta-riskanalys", desc: "Volatilitet vs marknaden", score: "0–2+" },
              { name: "Kvalitetspoäng", desc: "Marginaler, ROIC, skuldsättning", score: "0–100" },
              { name: "Utdelningsstabilitet", desc: "Yield, hållbarhet, beta", score: "0–100" },
            ].map((m, i) => (
              <div key={i} style={{
                padding: "18px 20px", borderRadius: 10, border: "1px solid #eceef1",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#131722" }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>{m.desc}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#2962ff", background: "#eef2ff", padding: "3px 8px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: isMobile ? "56px 20px" : "88px 48px",
        background: "linear-gradient(135deg, #131722 0%, #1a2332 100%)", textAlign: "center",
      }}>
        <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", marginBottom: 14 }}>
          Redo att investera smartare?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
          Skapa ett konto gratis. Inga kreditkort. Inga bindningstider.
        </p>
        <button onClick={() => setShowLogin(true)}
          style={{
            padding: "14px 40px", background: "#2962ff", color: "#fff", border: "none",
            borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 20px rgba(41,98,255,0.4)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          Kom igång gratis →
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: isMobile ? "24px 20px" : "28px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
        borderTop: "1px solid #f0f3fa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
            <path d="M8 32 L18 32 L22 22 L28 38 L32 18 L36 32 L48 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontSize: 12, color: "#b2b5be" }}>Thesion — thesion.tech</span>
        </div>
        <button onClick={onShowPrivacy} style={{ fontSize: 12, color: "#b2b5be", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Integritetspolicy
        </button>
      </footer>
    </div>
  );
}
