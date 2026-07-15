import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const labelStyle = { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 };
  const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>{t("aboutPage.title")}</h1>

      <div style={cardStyle}>
        <div style={labelStyle}>{t("aboutPage.aboutProject")}</div>
        <p style={pStyle}>
          {t("aboutPage.aboutProjectText")}
        </p>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>{t("aboutPage.technology")}</div>
        <p style={pStyle}>
          {t("aboutPage.technologyText")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {["React", "Vercel", "Supabase", "Yahoo Finance", "Claude AI"].map(tech => (
            <span key={tech} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 3, background: "var(--border-light)", color: "var(--accent)", fontWeight: 500 }}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>{t("aboutPage.contact")}</div>
        <p style={pStyle}>
          {t("aboutPage.contactText")}
        </p>
        <a href="mailto:info@thesion.tech" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
          info@thesion.tech
        </a>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>{t("aboutPage.disclaimer")}</div>
        <p style={pStyle}>
          {t("aboutPage.disclaimerText")}
        </p>
      </div>
    </div>
  );
}
