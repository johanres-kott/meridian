import { useTranslation } from "react-i18next";

export default function Privacy({ onBack }) {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2962ff", padding: 0, marginBottom: 24, fontFamily: "inherit" }}
      >
        ← {t("privacy.back")}
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#131722", marginBottom: 8 }}>{t("privacy.title")}</h1>
      <p style={{ fontSize: 12, color: "#787b86", marginBottom: 32 }}>{t("privacy.lastUpdated")}</p>

      <Section title={t("privacy.section1.title")}>
        {t("privacy.section1.body")}
      </Section>

      <Section title={t("privacy.section2.title")}>
        <ul style={ulStyle}>
          <li><strong>{t("privacy.section2.item1Label")}</strong> — {t("privacy.section2.item1Text")}</li>
          <li><strong>{t("privacy.section2.item2Label")}</strong> — {t("privacy.section2.item2Text")}</li>
          <li><strong>{t("privacy.section2.item3Label")}</strong> — {t("privacy.section2.item3Text")}</li>
        </ul>
        {t("privacy.section2.footer")}
      </Section>

      <Section title={t("privacy.section3.title")}>
        {t("privacy.section3.body")}
      </Section>

      <Section title={t("privacy.section4.title")}>
        {t("privacy.section4.body")}
      </Section>

      <Section title={t("privacy.section5.title")}>
        {t("privacy.section5.body")}
        <ul style={ulStyle}>
          <li><strong>{t("privacy.section5.item1Label")}</strong> — {t("privacy.section5.item1Text")}</li>
          <li><strong>{t("privacy.section5.item2Label")}</strong> — {t("privacy.section5.item2Text")}</li>
          <li><strong>{t("privacy.section5.item3Label")}</strong> — {t("privacy.section5.item3Text")}</li>
          <li><strong>{t("privacy.section5.item4Label")}</strong> — {t("privacy.section5.item4Text")}</li>
        </ul>
      </Section>

      <Section title={t("privacy.section6.title")}>
        <ul style={ulStyle}>
          <li><strong>{t("privacy.section6.item1Label")}</strong> — {t("privacy.section6.item1Text")}</li>
          <li><strong>{t("privacy.section6.item2Label")}</strong> — {t("privacy.section6.item2Text")}</li>
          <li><strong>{t("privacy.section6.item3Label")}</strong> — {t("privacy.section6.item3Text")}</li>
        </ul>
      </Section>

      <Section title={t("privacy.section7.title")}>
        {t("privacy.section7.body")}
      </Section>

      <Section title={t("privacy.section8.title")}>
        {t("privacy.section8.intro")}
        <ul style={ulStyle}>
          <li>{t("privacy.section8.item1")}</li>
          <li>{t("privacy.section8.item2")}</li>
          <li>{t("privacy.section8.item3")}</li>
          <li>{t("privacy.section8.item4")}</li>
        </ul>
      </Section>

      <Section title={t("privacy.section9.title")}>
        {t("privacy.section9.body")} <strong>privacy@thesion.tech</strong>.
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#131722", marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#434651", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

const ulStyle = { margin: "8px 0", paddingLeft: 20 };
