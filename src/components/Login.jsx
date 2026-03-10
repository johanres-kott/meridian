import { useState } from "react";
import { supabase } from "../supabase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "magic"
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
      minHeight: "100vh", background: "#f8f9fd", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Mono&display=swap');`}</style>

      <div style={{ width: 380, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 40 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: "#2962ff", borderRadius: 5 }} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.02em" }}>Meridian</span>
        </div>

        <h1 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
          {mode === "login" ? "Logga in" : "Skicka inloggningslänk"}
        </h1>
        <p style={{ fontSize: 12, color: "#787b86", marginBottom: 24 }}>
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
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#787b86", display: "block", marginBottom: 6 }}>E-POST</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="din@email.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {mode === "login" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#787b86", display: "block", marginBottom: 6 }}>LÖSENORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          )}

          {mode === "magic" && <div style={{ marginBottom: 20 }} />}

          <button
            type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            {loading ? "Laddar..." : mode === "login" ? "Logga in" : "Skicka länk"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => { setMode(mode === "login" ? "magic" : "login"); setError(null); setMessage(null); }}
            style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {mode === "login" ? "Logga in med e-postlänk istället" : "Logga in med lösenord istället"}
          </button>
        </div>
      </div>
    </div>
  );
}