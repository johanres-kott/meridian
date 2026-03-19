import { useState } from "react";
import { supabase } from "../supabase.js";

export default function Login({ onShowPrivacy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setMessage(`Inloggningslänk skickad till ${email}`);
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      position: "fixed",
      top: 0, left: 0,
      background: "#f8f9fd",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Mono&family=Plus+Jakarta+Sans:wght@700&display=swap');`}</style>

      {/* Logo above card */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <svg width="36" height="36" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="12" fill="#3B6AE6"/>
          <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white"/>
          <polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85"/>
          <circle cx="38" cy="17" r="1.5" fill="#3B6AE6"/>
          <polygon points="32,18 34,24 28,32 26,24" fill="white"/>
          <polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white"/>
          <polygon points="12,36 8,28 10,26 14,32" fill="white"/>
          <line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <polygon points="22,44 20,48 24,48 26,44" fill="white"/>
          <polygon points="28,42 27,48 31,48 30,42" fill="white"/>
          <line x1="38" y1="22" x2="37" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
          <line x1="40" y1="22" x2="39.5" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
          <line x1="42" y1="22" x2="41" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
        </svg>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "#131722" }}>Thesion</span>
      </div>

      {/* Card */}
      <div style={{
        width: "min(400px, 90vw)",
        background: "#fff",
        border: "1px solid #e0e3eb",
        borderRadius: 8,
        padding: "40px 40px 32px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: "#131722" }}>
          {mode === "login" ? "Logga in" : "Skicka inloggningslänk"}
        </h1>
        <p style={{ fontSize: 12, color: "#787b86", marginBottom: 28 }}>
          {mode === "login" ? "Ange dina uppgifter för att fortsätta" : "Vi skickar en länk till din e-post"}
        </p>

        {message && (
          <div style={{ padding: "12px 14px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: 4, fontSize: 13, color: "#2e7d32", marginBottom: 16 }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: "12px 14px", background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: 4, fontSize: 13, color: "#f23645", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : handleMagicLink}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#787b86", display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>E-POST</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="din@email.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#131722" }}
            />
          </div>

          {mode === "login" && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#787b86", display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>LÖSENORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#131722" }}
              />
            </div>
          )}

          {mode === "magic" && <div style={{ marginBottom: 24 }} />}

          <button
            type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Laddar..." : mode === "login" ? "Logga in" : "Skicka länk"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px solid #f0f3fa", paddingTop: 20 }}>
          <button
            onClick={() => { setMode(mode === "login" ? "magic" : "login"); setError(null); setMessage(null); }}
            style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {mode === "login" ? "Logga in med e-postlänk istället →" : "← Logga in med lösenord istället"}
          </button>
        </div>
      </div>

      {onShowPrivacy && (
        <button
          onClick={onShowPrivacy}
          style={{ marginTop: 16, fontSize: 11, color: "#787b86", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Integritetspolicy
        </button>
      )}
    </div>
  );
}
