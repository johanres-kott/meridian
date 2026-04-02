import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import Login from "./Login.jsx";
import Hero from "./landing/Hero.jsx";
import Features from "./landing/Features.jsx";
import CtaAndFooter from "./landing/CtaAndFooter.jsx";

export default function LandingPage({ onShowPrivacy }) {
  const isMobile = useIsMobile();
  const [showLogin, setShowLogin] = useState(false);
  const [defaultMode, setDefaultMode] = useState("login");

  if (showLogin) {
    return (
      <div>
        <div style={{ padding: isMobile ? "12px 16px" : "12px 48px", display: "flex", alignItems: "center" }}>
          <button onClick={() => setShowLogin(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2962ff", fontFamily: "inherit" }}>
            ← Tillbaka
          </button>
        </div>
        <Login onShowPrivacy={onShowPrivacy} defaultMode={defaultMode} />
      </div>
    );
  }

  const handleLogin = () => { setDefaultMode("login"); setShowLogin(true); };
  const handleSignup = () => { setDefaultMode("signup"); setShowLogin(true); };

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

      <Hero isMobile={isMobile} onLogin={handleLogin} onSignup={handleSignup} />
      <Features isMobile={isMobile} />
      <CtaAndFooter isMobile={isMobile} onSignup={handleSignup} onShowPrivacy={onShowPrivacy} />
    </div>
  );
}
