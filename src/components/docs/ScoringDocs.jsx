import { useTranslation } from "react-i18next";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };
const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "var(--text-secondary)" };

export default function ScoringDocs() {
  const { t } = useTranslation();
  return (
    <>
      {/* Scoring overview */}
      <div id="scoring" style={sectionStyle}>
        <div style={h2Style}>{t("scoringDocs.title")}</div>
        <p style={pStyle}>
          {t("scoringDocs.intro")}
        </p>
      </div>

      {/* 5 models */}
      <div id="models" style={sectionStyle}>
        <div style={h2Style}>{t("scoringDocs.modelsTitle")}</div>

        <div style={h3Style}>{t("scoringDocs.piotroskiTitle")}</div>
        <p style={pStyle}>
          {t("scoringDocs.piotroskiIntro")}
        </p>
        <ol style={listStyle}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <li key={i}>{t(`scoringDocs.piotroskiItems.${i}`)}</li>)}
        </ol>
        <p style={pStyle}>{t("scoringDocs.piotroskiNote")}</p>

        <div style={h3Style}>{t("scoringDocs.magicTitle")}</div>
        <p style={pStyle}>
          {t("scoringDocs.magicIntro")}
        </p>
        <ul style={listStyle}>
          <li><strong>Earnings Yield</strong> {t("scoringDocs.magicEy")}</li>
          <li><strong>ROIC</strong> {t("scoringDocs.magicRoic")}</li>
        </ul>

        <div style={h3Style}>{t("scoringDocs.growthTitle")}</div>
        <p style={pStyle}>{t("scoringDocs.growthIntro")}</p>
        <ul style={listStyle}>
          <li><strong>{t("scoringDocs.growthPegLabel")}</strong> {t("scoringDocs.growthPegText")}</li>
          <li><strong>{t("scoringDocs.growthRevLabel")}</strong> {t("scoringDocs.growthRevText")}</li>
          <li><strong>{t("scoringDocs.growthMarginLabel")}</strong> {t("scoringDocs.growthMarginText")}</li>
        </ul>

        <div style={h3Style}>{t("scoringDocs.dividendTitle")}</div>
        <p style={pStyle}>{t("scoringDocs.dividendIntro")}</p>
        <ul style={listStyle}>
          <li><strong>{t("scoringDocs.dividendYieldLabel")}</strong> {t("scoringDocs.dividendYieldText")}</li>
          <li><strong>{t("scoringDocs.dividendSustLabel")}</strong> {t("scoringDocs.dividendSustText")}</li>
          <li><strong>{t("scoringDocs.dividendStabLabel")}</strong> {t("scoringDocs.dividendStabText")}</li>
        </ul>

        <div style={h3Style}>{t("scoringDocs.qualityTitle")}</div>
        <p style={pStyle}>{t("scoringDocs.qualityIntro")}</p>
        <ul style={listStyle}>
          <li><strong>{t("scoringDocs.qualityMarginLabel")}</strong> {t("scoringDocs.qualityMarginText")}</li>
          <li><strong>{t("scoringDocs.qualityCapitalLabel")}</strong> {t("scoringDocs.qualityCapitalText")}</li>
          <li><strong>{t("scoringDocs.qualityStrengthLabel")}</strong> {t("scoringDocs.qualityStrengthText")}</li>
        </ul>
      </div>

      {/* Profile weighting */}
      <div id="weighting" style={sectionStyle}>
        <div style={h2Style}>{t("scoringDocs.weightingTitle")}</div>
        <p style={pStyle}>
          {t("scoringDocs.weightingIntro")}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>{t("scoringDocs.colModel")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("scoringDocs.colValue")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("scoringDocs.colGrowth")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("scoringDocs.colDividend")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("scoringDocs.colMixed")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Piotroski F-Score", "30%", "10%", "10%", "20%"],
                ["Magic Formula", "30%", "10%", "5%", "20%"],
                [t("scoringDocs.rowGrowth"), "5%", "40%", "5%", "20%"],
                [t("scoringDocs.rowDividend"), "5%", "5%", "45%", "20%"],
                [t("scoringDocs.rowQuality"), "30%", "35%", "35%", "20%"],
              ].map(([model, ...weights], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f3fa" }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)" }}>{model}</td>
                  {weights.map((w, j) => (
                    <td key={j} style={{ ...tdStyle, textAlign: "center" }}>{w}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk */}
      <div id="risk" style={sectionStyle}>
        <div style={h2Style}>{t("scoringDocs.riskTitle")}</div>
        <p style={pStyle}>
          {t("scoringDocs.riskIntro")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#089981", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>{t("scoringDocs.riskLowLabel")}</strong>
            <span style={{ color: "var(--text-secondary)" }}>{t("scoringDocs.riskLowText")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#ff9800", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>{t("scoringDocs.riskMediumLabel")}</strong>
            <span style={{ color: "var(--text-secondary)" }}>{t("scoringDocs.riskMediumText")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#f23645", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>{t("scoringDocs.riskHighLabel")}</strong>
            <span style={{ color: "var(--text-secondary)" }}>{t("scoringDocs.riskHighText")}</span>
          </div>
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          {t("scoringDocs.riskFallback")}
        </p>
      </div>

      {/* Riskjustering */}
      <div id="risk-adjust" style={sectionStyle}>
        <div style={h2Style}>{t("scoringDocs.adjustTitle")}</div>
        <p style={pStyle}>
          {t("scoringDocs.adjustIntro")}
        </p>
        <ul style={listStyle}>
          <li><strong>{t("scoringDocs.adjustMatchLabel")}</strong> {t("scoringDocs.adjustMatchText")}</li>
          <li><strong>{t("scoringDocs.adjustOneLabel")}</strong> {t("scoringDocs.adjustOneText")}</li>
          <li><strong>{t("scoringDocs.adjustTwoLabel")}</strong> {t("scoringDocs.adjustTwoText")}</li>
        </ul>
      </div>
    </>
  );
}
