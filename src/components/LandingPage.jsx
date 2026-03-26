import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import Login from "./Login.jsx";

const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
    <path d="M12 22 Q19 14 26 22 Q33 30 40 22 Q43 19 46 22" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M12 34 Q19 26 26 34 Q33 42 40 34 Q43 31 46 34" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </svg>
);

const jakarta = "'Plus Jakarta Sans', sans-serif";
const mono = "'IBM Plex Mono', monospace";

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

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .fu { animation: fadeUp 0.7s ease-out both; }
        .fu1 { animation-delay: 0.15s; }
        .fu2 { animation-delay: 0.3s; }
        .fu3 { animation-delay: 0.45s; }
        .fu4 { animation-delay: 0.6s; }
      `}</style>

      {/* ─── DARK HERO ─── */}
      <div style={{ background: "linear-gradient(165deg, #0a0f1e 0%, #0f1a2e 40%, #0d1f2d 70%, #0a1628 100%)", position: "relative", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(41,98,255,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,153,129,0.10) 0%, transparent 60%)", pointerEvents: "none" }} />

        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: isMobile ? "16px 20px" : "20px 56px",
          position: "relative", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={28} />
            <span style={{ fontSize: 19, fontWeight: 700, color: "#fff", fontFamily: jakarta, letterSpacing: "-0.02em" }}>Thesion</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowLogin(true)}
              style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              Logga in
            </button>
            <button onClick={() => setShowLogin(true)}
              style={{ padding: "9px 22px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#3d72ff"}
              onMouseLeave={e => e.currentTarget.style.background = "#2962ff"}
            >
              Kom igång
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ padding: isMobile ? "48px 20px 0" : "80px 56px 0", maxWidth: 1200, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="fu" style={{ marginBottom: 24 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", letterSpacing: "0.03em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#089981" }} />
              Investeringsanalys driven av data
            </span>
          </div>

          <h1 className="fu fu1" style={{
            fontSize: isMobile ? 40 : 72, fontWeight: 800, color: "#fff",
            fontFamily: jakarta, lineHeight: 1.05,
            marginBottom: 24, letterSpacing: "-0.04em",
          }}>
            Analysera smartare.{isMobile ? " " : <br />}
            <span style={{ background: "linear-gradient(135deg, #5b9aff 0%, #2962ff 40%, #089981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Investera tryggare.
            </span>
          </h1>

          <p className="fu fu2" style={{
            fontSize: isMobile ? 15 : 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
            maxWidth: 540, margin: "0 auto 40px", fontWeight: 400,
          }}>
            Aktieförslag baserade på Piotroski, Magic Formula och fler etablerade modeller — personligt anpassade efter din investerarprofil.
          </p>

          <div className="fu fu3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: isMobile ? 48 : 72 }}>
            <button onClick={() => setShowLogin(true)}
              style={{
                padding: "14px 36px", background: "#2962ff", color: "#fff", border: "none",
                borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 0 40px rgba(41,98,255,0.3)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(41,98,255,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(41,98,255,0.3)"; }}
            >
              Kom igång gratis →
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 28px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "inherit", color: "rgba(255,255,255,0.6)", fontWeight: 500, transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            >
              Läs mer
            </button>
          </div>

          {/* App screenshot */}
          <div className="fu fu4" style={{
            maxWidth: isMobile ? "100%" : 960, margin: "0 auto",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            borderRadius: "12px 12px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
            padding: "12px 12px 0", position: "relative",
          }}>
            {/* Browser chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "0 4px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
              <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.05)", marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: mono }}>thesion.tech</span>
              </div>
            </div>
            {/* Real app screenshot */}
            <img
              src="/app-screenshot.png"
              alt="Thesion — Översikt"
              style={{ width: "100%", borderRadius: "8px 8px 0 0", display: "block" }}
            />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div style={{ height: 80, background: "linear-gradient(180deg, transparent, #fff)", position: "relative", zIndex: 3, marginTop: -1 }} />
      </div>

      {/* ─── STATS BAR ─── */}
      <section style={{ padding: isMobile ? "0 20px" : "0 56px", maxWidth: 1200, margin: "-20px auto 0" }}>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 1, background: "#e0e3eb", borderRadius: 14, overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}>
          {[
            { value: "200+", label: "Analyserade aktier" },
            { value: "5", label: "Scoringmodeller" },
            { value: "7", label: "Investmentbolag" },
            { value: "Realtid", label: "Marknadsdata" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", padding: isMobile ? "22px 16px" : "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: "#131722", fontFamily: jakarta, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#787b86", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BENTO FEATURES ─── */}
      <section id="features" style={{ padding: isMobile ? "64px 20px" : "100px 56px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: "#131722", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Allt du behöver för att investera smartare
          </h2>
          <p style={{ fontSize: 16, color: "#787b86", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Från portföljöversikt till djupanalys — byggt för svenska investerare.
          </p>
        </div>

        {/* Bento grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gridTemplateRows: isMobile ? "auto" : "auto auto",
          gap: 16,
        }}>
          {/* Large card — spans 2 cols */}
          <div style={{
            gridColumn: isMobile ? "1" : "1 / 3",
            background: "linear-gradient(135deg, #0f1a2e 0%, #162035 100%)",
            borderRadius: 16, padding: isMobile ? 28 : 36, color: "#fff",
            display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: isMobile ? 200 : 240,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Smart analys</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, fontFamily: jakarta, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                Scoring baserad på<br />5 etablerade modeller
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 400 }}>
                Piotroski F-Score, Magic Formula, PEG Ratio, kvalitets- och utdelningsanalys — kombinerat till en composite score.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {["Piotroski", "Magic Formula", "Quality", "Dividend", "Growth"].map(m => (
                <span key={m} style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, background: "rgba(41,98,255,0.2)", color: "#5b9aff", fontWeight: 600, fontFamily: mono }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div style={{
            background: "#f8f9fd", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1", display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Personligt</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "#131722", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Anpassat efter dig
              </div>
              <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
                Värdeinvesterare? Tillväxt? Utdelning? Dina förslag viktas efter din profil.
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#e8f5e9", color: "#1b5e20", fontWeight: 600 }}>Låg risk</span>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#fff8e1", color: "#e65100", fontWeight: 600 }}>Medel</span>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#fce4ec", color: "#c62828", fontWeight: 600 }}>Hög</span>
            </div>
          </div>

          {/* Bottom left */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Portfölj</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "#131722", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Importera från Avanza
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Ladda upp din Avanza-PDF och få hela portföljen importerad på sekunder. Spåra P&L i realtid.
            </div>
          </div>

          {/* Bottom center */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Investmentbolag</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "#131722", letterSpacing: "-0.02em", marginBottom: 8 }}>
              7 bolag, en vy
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Investor, Industrivärden, Öresund, Latour, Lundbergs, Svolder och Creades — innehav, ledning och nyheter.
            </div>
          </div>

          {/* Bottom right */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Insiders</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "#131722", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Se vad insiders gör
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Insidertransaktioner från Finansinspektionen — se vad ledningen köper och säljer.
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: isMobile ? "48px 20px" : "80px 56px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: "#131722", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 14 }}>
              Tre steg till bättre investeringar
            </h2>
            <p style={{ fontSize: 15, color: "#787b86" }}>Kom igång på under en minut</p>
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 36 : 56, justifyContent: "center" }}>
            {[
              { step: "01", title: "Berätta vem du är", desc: "Fyra snabba frågor om din investeringsstil, riskprofil och intressen.", color: "#2962ff" },
              { step: "02", title: "Utforska förslag", desc: "En personlig topplista med aktier rankade med etablerade analysmodeller.", color: "#089981" },
              { step: "03", title: "Analysera på djupet", desc: "Nyckeltal, insiderhandel, risk, kursmål och AI-assistent — allt på ett ställe.", color: "#e65100" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: isMobile ? "center" : "left", maxWidth: 300 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: jakarta, marginBottom: 12, opacity: 0.2 }}>{s.step}</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#131722", marginBottom: 8, fontFamily: jakarta }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#787b86", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DARK CTA ─── */}
      <section style={{
        padding: isMobile ? "64px 20px" : "100px 56px",
        background: "linear-gradient(165deg, #0a0f1e 0%, #0f1a2e 50%, #0d1f2d 100%)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(41,98,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 800, color: "#fff", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Redo att investera smartare?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 36, lineHeight: 1.6 }}>
            Skapa ett konto gratis. Inga kreditkort. Inga bindningstider.
          </p>
          <button onClick={() => setShowLogin(true)}
            style={{
              padding: "15px 44px", background: "#2962ff", color: "#fff", border: "none",
              borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 0 50px rgba(41,98,255,0.35)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Kom igång gratis →
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        padding: isMobile ? "24px 20px" : "28px 56px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8, background: "#fff",
        borderTop: "1px solid #f0f3fa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={16} />
          <span style={{ fontSize: 12, color: "#b2b5be" }}>Thesion — thesion.tech</span>
        </div>
        <button onClick={onShowPrivacy} style={{ fontSize: 12, color: "#b2b5be", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Integritetspolicy
        </button>
      </footer>
    </div>
  );
}
