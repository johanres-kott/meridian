import Logo from "./Logo.jsx";

const jakarta = "'Plus Jakarta Sans', sans-serif";
const mono = "'IBM Plex Mono', monospace";

export default function Hero({ isMobile, onLogin, onSignup }) {
  return (
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
          <button onClick={onLogin}
            style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
            Logga in
          </button>
          <button onClick={onSignup}
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
          <button onClick={onSignup}
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
  );
}
