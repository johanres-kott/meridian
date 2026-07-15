import { useTranslation } from "react-i18next";
import Logo from "./Logo.jsx";

const jakarta = "'Plus Jakarta Sans', sans-serif";

export default function CtaAndFooter({ isMobile, onSignup, onShowPrivacy }) {
  const { t } = useTranslation();
  return (
    <>
      {/* ─── DARK CTA ─── */}
      <section style={{
        padding: isMobile ? "64px 20px" : "100px 56px",
        background: "linear-gradient(165deg, #0a0f1e 0%, #0f1a2e 50%, #0d1f2d 100%)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(41,98,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 800, color: "#fff", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 16 }}>
            {t("ctaAndFooter.ctaTitle")}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 36, lineHeight: 1.6 }}>
            {t("ctaAndFooter.ctaSubtitle")}
          </p>
          <button onClick={onSignup}
            style={{
              padding: "15px 44px", background: "#2962ff", color: "#fff", border: "none",
              borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 0 50px rgba(41,98,255,0.35)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {t("ctaAndFooter.ctaButton")} →
          </button>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section style={{ padding: isMobile ? "56px 20px" : "80px 56px", background: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "var(--text)", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 20 }}>
            {t("ctaAndFooter.aboutTitle")}
          </h2>
          <div style={{ fontSize: 15, color: "#5a5d65", lineHeight: 1.8 }}>
            <p style={{ marginBottom: 16 }}>
              {t("ctaAndFooter.aboutP1Pre")} <strong style={{ color: "var(--text)" }}>Johan Resare</strong> {t("ctaAndFooter.aboutP1Post")}
            </p>
            <p style={{ marginBottom: 16 }}>
              {t("ctaAndFooter.aboutP2Pre")} <strong style={{ color: "var(--text)" }}>Claude Code</strong> {t("ctaAndFooter.aboutP2Post")}
            </p>
            <p style={{ marginBottom: 24 }}>
              {t("ctaAndFooter.aboutP3")}
            </p>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f8f9fd", border: "1px solid #eceef1" }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Stack</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>React · Vercel · Supabase</div>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f8f9fd", border: "1px solid #eceef1" }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{t("ctaAndFooter.builtWith")}</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Claude Code (Anthropic)</div>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f8f9fd", border: "1px solid #eceef1" }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{t("ctaAndFooter.createdBy")}</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Johan Resare</div>
            </div>
            <a href="mailto:info@thesion.tech" style={{ padding: "12px 16px", borderRadius: 8, background: "#f8f9fd", border: "1px solid #eceef1", textDecoration: "none", display: "block" }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{t("ctaAndFooter.contact")}</div>
              <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>info@thesion.tech</div>
            </a>
          </div>
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
        <div style={{ display: "flex", gap: 16 }}>
          <a href="mailto:info@thesion.tech" style={{ fontSize: 12, color: "#b2b5be", textDecoration: "none" }}>
            {t("ctaAndFooter.contact")}
          </a>
          <button onClick={onShowPrivacy} style={{ fontSize: 12, color: "#b2b5be", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t("ctaAndFooter.privacyPolicy")}
          </button>
          <a href="https://github.com/johanres-kott/meridian" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#b2b5be", textDecoration: "none" }}>
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
