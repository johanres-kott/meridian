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
        <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
          <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
          <path d="M10 18 Q16 10 22 18 Q28 26 34 18 Q40 10 46 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/><line x1="28" y1="22" x2="28" y2="39" stroke="white" strokeWidth="3.5" strokeLinecap="round"/><circle cx="28" cy="45" r="2.5" fill="white"/>
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

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })}
            style={{
              width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4,
              background: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              color: "#131722", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#2962ff"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e3eb"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Fortsätt med Google
          </button>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin } })}
            style={{
              width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4,
              background: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              color: "#131722", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#2962ff"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e3eb"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#131722"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Fortsätt med GitHub
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#e0e3eb" }} />
          <span style={{ fontSize: 11, color: "#b2b5be" }}>eller</span>
          <div style={{ flex: 1, height: 1, background: "#e0e3eb" }} />
        </div>

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
