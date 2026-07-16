import { useTranslation } from "react-i18next";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

export default function OwnershipDocs() {
  const { t } = useTranslation();
  return (
    <div id="ownership" style={sectionStyle}>
      <div style={h2Style}>{t("ownershipDocs.title")}</div>
      <p style={pStyle}>
        {t("ownershipDocs.intro")}
      </p>

      <div id="share-class" style={h3Style}>{t("ownershipDocs.shareClassTitle")}</div>
      <p style={pStyle}>
        {t("ownershipDocs.shareClassP1a")}
        <strong style={{ color: "var(--text)" }}> {t("ownershipDocs.shareClassP1b")}</strong>,
        {" "}{t("ownershipDocs.shareClassP1c")} <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.shareClassP1d")}</strong>,
        {" "}{t("ownershipDocs.shareClassP1e")} <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.shareClassP1f")}</strong>. {t("ownershipDocs.shareClassP1g")}
      </p>
      <p style={pStyle}>
        {t("ownershipDocs.shareClassP2")}
      </p>

      <div id="dual-class-consequences" style={h3Style}>{t("ownershipDocs.governanceTitle")}</div>
      <p style={pStyle}>
        {t("ownershipDocs.governanceIntro")}
      </p>
      <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.sphere1Label")}</strong> {t("ownershipDocs.sphere1Text")}</li>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.sphere2Label")}</strong>: {t("ownershipDocs.sphere2Text")}</li>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.sphere3Label")}</strong>: {t("ownershipDocs.sphere3Text")}</li>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.sphere4Label")}</strong>: {t("ownershipDocs.sphere4Text")}</li>
      </ul>
      <p style={pStyle}>
        {t("ownershipDocs.governanceP2")}
      </p>

      <div id="share-class-practical" style={h3Style}>{t("ownershipDocs.practicalTitle")}</div>
      <p style={pStyle}>
        {t("ownershipDocs.practicalIntro")}
      </p>
      <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.liquidityLabel")}</strong> {t("ownershipDocs.liquidityText")}</li>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.priceLabel")}</strong> {t("ownershipDocs.priceText")}</li>
        <li><strong style={{ color: "var(--text)" }}>{t("ownershipDocs.votingLabel")}</strong> {t("ownershipDocs.votingText")}</li>
      </ul>

      <div id="share-class-international" style={h3Style}>{t("ownershipDocs.internationalTitle")}</div>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.usaLabel")}</strong> {t("ownershipDocs.usaText")}
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.ukLabel")}</strong> {t("ownershipDocs.ukText")}
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.finlandLabel")}</strong> {t("ownershipDocs.finlandText")}
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>{t("ownershipDocs.hkLabel")}</strong> {t("ownershipDocs.hkText")}
      </p>
    </div>
  );
}
