import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import Login from "./Login.jsx";
import Hero from "./landing/Hero.jsx";
import Features from "./landing/Features.jsx";
import CtaAndFooter from "./landing/CtaAndFooter.jsx";

export default function LandingPage({ onShowPrivacy, onShowTerms }) {
  const isMobile = useIsMobile();
  const [showLogin, setShowLogin] = useState(false);
  const [defaultMode, setDefaultMode] = useState("login");

  if (showLogin) {
    return (
      <div>
        <div style={{ padding: isMobile ? "12px 16px" : "12px 48px", display: "flex", alignItems: "center" }}>
          <button onClick={() => setShowLogin(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--brand)", fontFamily: "inherit" }}>
            ← Tillbaka
          </button>
        </div>
        <Login onShowPrivacy={onShowPrivacy} onShowTerms={onShowTerms} defaultMode={defaultMode} />
      </div>
    );
  }

  const handleLogin = () => { setDefaultMode("login"); setShowLogin(true); };
  const handleSignup = () => { setDefaultMode("signup"); setShowLogin(true); };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", background: "var(--bg)", color: "var(--ink)", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      <Hero isMobile={isMobile} onLogin={handleLogin} onSignup={handleSignup} />
      <Features isMobile={isMobile} />
      <CtaAndFooter isMobile={isMobile} onSignup={handleSignup} onShowPrivacy={onShowPrivacy} onShowTerms={onShowTerms} />
    </div>
  );
}
