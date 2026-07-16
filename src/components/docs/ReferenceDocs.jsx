import { useTranslation } from "react-i18next";

const GLOSSARY_COUNT = 22;
const SOURCE_NAMES = ["Yahoo Finance", "Finnhub", "Financial Modeling Prep", "Finansinspektionen", null];

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

export default function ReferenceDocs({ isMobile }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Data sources */}
      <div id="sources" style={sectionStyle}>
        <div style={h2Style}>{t("referenceDocs.sourcesTitle")}</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {SOURCE_NAMES.map((name, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{name || t(`referenceDocs.sources.${i}.name`)}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{t(`referenceDocs.sources.${i}.desc`)}</div>
            </div>
          ))}
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          {t("referenceDocs.sourcesNote")}
        </p>
      </div>

      {/* Uppdateringsfrekvens */}
      <div id="frequency" style={sectionStyle}>
        <div style={h2Style}>{t("referenceDocs.frequencyTitle")}</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f3fa" }}>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{t(`referenceDocs.frequency.${i}.what`)}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t(`referenceDocs.frequency.${i}.freq`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div id="glossary" style={sectionStyle}>
        <div style={h2Style}>{t("referenceDocs.glossaryTitle")}</div>
        <p style={pStyle}>
          {t("referenceDocs.glossaryIntro")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 12 }}>
          {Array.from({ length: GLOSSARY_COUNT }, (_, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: i < GLOSSARY_COUNT - 1 ? "1px solid var(--border-light)" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{t(`referenceDocs.glossary.${i}.term`)}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 6 }}>{t(`referenceDocs.glossary.${i}.def`)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic", paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
                {t("referenceDocs.exampleLabel")} {t(`referenceDocs.glossary.${i}.example`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div id="disclaimer" style={{ ...sectionStyle, background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.2)" }}>
        <div style={{ ...h2Style, color: "#e65100" }}>{t("referenceDocs.disclaimerTitle")}</div>
        <p style={{ ...pStyle, color: "var(--text-secondary)" }}>
          {t("referenceDocs.disclaimerBody")}
        </p>
      </div>
    </>
  );
}
