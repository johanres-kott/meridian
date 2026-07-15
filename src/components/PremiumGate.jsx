import { useTranslation } from "react-i18next";

export default function PremiumGate({ premium, loading, checkoutLoading, error, onSubscribe, children }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        {t("premiumGate.loading")}
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
        {t("premiumGate.pitch")}
      </p>

      <div style={{
        background: "var(--bg-secondary)", borderRadius: 8, padding: 20,
        maxWidth: 300, margin: "0 auto 20px",
      }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
          49 <span style={{ fontSize: 14, fontWeight: 400 }}>{t("premiumGate.priceSuffix")}</span>
        </div>
        <ul style={{
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 2,
          textAlign: "left", paddingLeft: 20, margin: "12px 0 0",
        }}>
          <li>{t("premiumGate.features.deepAnalyses")}</li>
          <li>{t("premiumGate.features.sectorReports")}</li>
          <li>{t("premiumGate.features.continuousUpdates")}</li>
          <li>{t("premiumGate.features.cancelAnytime")}</li>
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
        {checkoutLoading ? t("premiumGate.loading") : t("premiumGate.subscribe")}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: "#f23645", marginTop: 8 }}>{error}</div>
      )}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        {t("premiumGate.securePayment")}
      </div>
    </div>
  );
}
