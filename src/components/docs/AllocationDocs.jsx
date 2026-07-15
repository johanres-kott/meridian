import { useTranslation } from "react-i18next";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };
const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "var(--text-secondary)" };

export default function AllocationDocs() {
  const { t } = useTranslation();
  return (
    <>
      {/* Portfolio allocation — Core-Satellite */}
      <div id="allocation" style={sectionStyle}>
        <div style={h2Style}>{t("allocationDocs.title")}</div>
        <p style={pStyle}>
          {t("allocationDocs.introPre")} <strong>{t("allocationDocs.introStrong")}</strong> {t("allocationDocs.introPost")}
        </p>

        <div id="core-satellite" style={h3Style}>{t("allocationDocs.coreSatelliteTitle")}</div>
        <p style={pStyle}>
          {t("allocationDocs.coreSatelliteIntro")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <div>
              <strong style={{ color: "#089981" }}>{t("allocationDocs.coreLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                {t("allocationDocs.coreDesc")}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🚀</span>
            <div>
              <strong style={{ color: "#5b9bd5" }}>{t("allocationDocs.satelliteLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                {t("allocationDocs.satelliteDesc")}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🎲</span>
            <div>
              <strong style={{ color: "#f23645" }}>{t("allocationDocs.speculationLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                {t("allocationDocs.speculationDesc")}
              </div>
            </div>
          </div>
        </div>

        <div id="classification" style={h3Style}>{t("allocationDocs.classificationTitle")}</div>
        <p style={pStyle}>
          {t("allocationDocs.classificationIntro")}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>{t("allocationDocs.signalHeader")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("allocationDocs.coreHeader")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("allocationDocs.specHeader")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [t("allocationDocs.signals.0"), "+3", "−2"],
                [t("allocationDocs.signals.1"), "+3", "−3"],
                [t("allocationDocs.signals.2"), "+1", "−2"],
                [t("allocationDocs.signals.3"), "+2", "−1"],
                [t("allocationDocs.signals.4"), "+2", "−1"],
                [t("allocationDocs.signals.5"), "+1", "−3"],
                [t("allocationDocs.signals.6"), "+2", "−2"],
                [t("allocationDocs.signals.7"), "+1", "−1"],
              ].map(([signal, core, spec], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f3fa" }}>
                  <td style={{ ...tdStyle, color: "var(--text)" }}>{signal}</td>
                  <td style={{ ...tdStyle, textAlign: "center", color: "#089981" }}>{core}</td>
                  <td style={{ ...tdStyle, textAlign: "center", color: "#f23645" }}>{spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={pStyle}>
          <strong>{t("allocationDocs.thresholdLabel")}</strong> {t("allocationDocs.thresholdText")}
        </p>
        <p style={pStyle}>
          <strong>{t("allocationDocs.missingDataLabel")}</strong> {t("allocationDocs.missingDataText")}
        </p>

        <div id="target-allocation" style={h3Style}>{t("allocationDocs.targetAllocationTitle")}</div>
        <p style={pStyle}>
          {t("allocationDocs.targetAllocationIntro")}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>{t("allocationDocs.riskProfileHeader")}</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#089981" }}>{t("allocationDocs.coreCol")}</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#5b9bd5" }}>{t("allocationDocs.satelliteCol")}</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#f23645" }}>{t("allocationDocs.speculationCol")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [t("allocationDocs.riskProfiles.0"), "75%", "20%", "5%"],
                [t("allocationDocs.riskProfiles.1"), "60%", "30%", "10%"],
                [t("allocationDocs.riskProfiles.2"), "40%", "35%", "25%"],
              ].map(([profile, ...pcts], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f3fa" }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)" }}>{profile}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{pcts[0]}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{pcts[1]}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{pcts[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={pStyle}>
          {t("allocationDocs.balancedPre")} <strong>{t("allocationDocs.balancedStrong")}</strong> {t("allocationDocs.balancedPost")}
        </p>
      </div>

      {/* Investment strategies */}
      <div id="strategies" style={sectionStyle}>
        <div style={h2Style}>{t("allocationDocs.strategiesTitle")}</div>
        <p style={pStyle}>
          {t("allocationDocs.strategiesIntro")}
        </p>

        <div id="dca-lump" style={h3Style}>{t("allocationDocs.dcaLumpTitle")}</div>
        <p style={pStyle}>
          <strong>{t("allocationDocs.lumpSumTerm")}</strong> {t("allocationDocs.lumpSumDef")} <strong>{t("allocationDocs.dcaTerm")}</strong> {t("allocationDocs.dcaDef")}
        </p>

        <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{t("allocationDocs.researchTitle")}</div>
          <p style={{ ...pStyle, marginBottom: 8 }}>
            {t("allocationDocs.researchIntroPre")} <em>"Dollar-cost averaging just means taking risk later"</em> {t("allocationDocs.researchIntroPost")}
          </p>
          <ul style={listStyle}>
            <li>{t("allocationDocs.researchLi1Pre")} <strong>{t("allocationDocs.researchLi1Strong")}</strong> {t("allocationDocs.researchLi1Post")}</li>
            <li>{t("allocationDocs.researchLi2Pre")} <strong>{t("allocationDocs.researchLi2Strong")}</strong> {t("allocationDocs.researchLi2Post")}</li>
            <li>{t("allocationDocs.researchLi3")}</li>
          </ul>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 0, lineHeight: 1.5 }}>
            {t("allocationDocs.sourceNote")}
          </p>
        </div>

        <div style={h3Style}>{t("allocationDocs.adaptTitle")}</div>
        <p style={pStyle}>{t("allocationDocs.adaptIntro")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#089981", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>{t("allocationDocs.lowRiskLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{t("allocationDocs.lowRiskDesc")}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#ff9800", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>{t("allocationDocs.mediumRiskLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{t("allocationDocs.mediumRiskDesc")}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#f23645", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>{t("allocationDocs.highRiskLabel")}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{t("allocationDocs.highRiskDesc")}</div>
            </div>
          </div>
        </div>

        <p style={{ ...pStyle, marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          <strong>{t("allocationDocs.tipLabel")}</strong> {t("allocationDocs.tipText")}
        </p>
      </div>
    </>
  );
}
