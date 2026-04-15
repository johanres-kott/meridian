export default function PremiumGate({ premium, loading, checkoutLoading, error, onSubscribe, children }) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        Laddar...
      </div>
    );
  }

  if (premium) return children;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
      padding: 40, textAlign: "center",
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
        Thesion Premium
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 20px" }}>
        Få tillgång till djupanalyser, sektorrapporter och premium-innehåll.
        Analyserna görs med AI och verifieras mot riktiga datakällor.
      </p>

      <div style={{
        background: "var(--bg-secondary)", borderRadius: 8, padding: 20,
        maxWidth: 300, margin: "0 auto 20px",
      }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
          49 <span style={{ fontSize: 14, fontWeight: 400 }}>kr/mån</span>
        </div>
        <ul style={{
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 2,
          textAlign: "left", paddingLeft: 20, margin: "12px 0 0",
        }}>
          <li>Djupanalyser av bolag och sektorer</li>
          <li>Jämförande sektorrapporter</li>
          <li>Uppdateras löpande med ny data</li>
          <li>Avsluta när som helst</li>
        </ul>
      </div>

      <button
        onClick={onSubscribe}
        disabled={checkoutLoading}
        style={{
          padding: "10px 32px", fontSize: 14, fontWeight: 600,
          background: checkoutLoading ? "var(--text-muted)" : "var(--accent)", color: "#fff", border: "none",
          borderRadius: 6, cursor: checkoutLoading ? "wait" : "pointer", fontFamily: "inherit",
          opacity: checkoutLoading ? 0.7 : 1,
        }}
      >
        {checkoutLoading ? "Laddar..." : "Prenumerera"}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: "#f23645", marginTop: 8 }}>{error}</div>
      )}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Säker betalning via Stripe · Avsluta när som helst
      </div>
    </div>
  );
}
