import { useState } from "react";
import { useTranslation } from "react-i18next";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 16, marginBottom: 6 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 20, marginBottom: 8 };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const calloutStyle = (color) => ({
  background: `rgba(${color},0.06)`, border: `1px solid rgba(${color},0.15)`,
  borderRadius: 6, padding: 16, marginTop: 12, marginBottom: 12,
});

function PensionPillar({ icon, title, share, desc, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 160, background: `rgba(${color},0.06)`,
      border: `1px solid rgba(${color},0.15)`, borderRadius: 6, padding: 16,
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: `rgb(${color})`, fontWeight: 600, marginBottom: 6, ...mono }}>{share}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function AgeAllocationTable() {
  const { t } = useTranslation();
  const rows = [
    { age: "25–35", stocks: "90–100%", bonds: "0–10%", note: t("pensionDocs.ageNote1") },
    { age: "35–45", stocks: "80–90%", bonds: "10–20%", note: t("pensionDocs.ageNote2") },
    { age: "45–55", stocks: "60–80%", bonds: "20–40%", note: t("pensionDocs.ageNote3") },
    { age: "55–65", stocks: "40–60%", bonds: "40–60%", note: t("pensionDocs.ageNote4") },
    { age: "65+", stocks: "20–40%", bonds: "60–80%", note: t("pensionDocs.ageNote5") },
  ];
  const thStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };

  return (
    <div style={{ overflowX: "auto", marginTop: 8, marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          <th style={thStyle}>{t("pensionDocs.colAge")}</th>
          <th style={thStyle}>{t("pensionDocs.colStocks")}</th>
          <th style={thStyle}>{t("pensionDocs.colBonds")}</th>
          <th style={thStyle}>{t("pensionDocs.colNote")}</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.age}>
              <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)", ...mono }}>{r.age}</td>
              <td style={{ ...tdStyle, color: "#089981", ...mono }}>{r.stocks}</td>
              <td style={{ ...tdStyle, color: "#5b9bd5", ...mono }}>{r.bonds}</td>
              <td style={tdStyle}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PensionFeeImpact() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const years = 35;
  const monthly = 2500;
  const returnPct = 7;
  const fees = [0, 0.2, 0.5, 1.0, 1.5];

  const calc = (fee) => {
    const r = (returnPct - fee) / 100 / 12;
    const n = years * 12;
    return r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
  };

  const maxVal = calc(0);

  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      <div style={{ ...pStyle, marginBottom: 12 }}>
        {t("pensionDocs.simPre")} <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {t("pensionDocs.simMonthly", { amount: monthly.toLocaleString(numberLocale) })}</span> {t("pensionDocs.simIn")} <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {t("pensionDocs.simYears", { years })}</span> {t("pensionDocs.simWith")} <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {t("pensionDocs.simReturn", { pct: returnPct })}</span>
      </div>
      {fees.map(fee => {
        const val = calc(fee);
        const lost = calc(0) - val;
        const pct = (val / maxVal) * 100;
        const color = fee <= 0.2 ? "#089981" : fee <= 0.5 ? "#2196f3" : fee <= 1.0 ? "#ff9800" : "#f23645";
        return (
          <div key={fee} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: "var(--text-secondary)" }}>
                {t("pensionDocs.feeLabel")} <span style={{ ...mono, fontWeight: 500, color }}>{fee.toFixed(1)}%</span>
              </span>
              <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
                {t("pensionDocs.valueKr", { value: Math.round(val).toLocaleString(numberLocale) })}
                {lost > 0 && <span style={{ color: "#f23645", fontSize: 10, marginLeft: 6 }}>
                  {t("pensionDocs.lostKr", { value: Math.round(lost).toLocaleString(numberLocale) })}
                </span>}
              </span>
            </div>
            <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        {t("pensionDocs.feeEats", { amount: Math.round(calc(0) - calc(1.0)).toLocaleString(numberLocale) })}
      </div>
    </div>
  );
}

export default function PensionDocs() {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);
  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  return (
    <>
      {/* Pensionens tre pelare */}
      <div id="pension" style={sectionStyle}>
        <div style={h2Style}>{t("pensionDocs.title")}</div>
        <p style={pStyle}>
          {t("pensionDocs.intro")}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, marginBottom: 16 }}>
          <PensionPillar
            icon="🏛️"
            title={t("pensionDocs.pillar1Title")}
            share={t("pensionDocs.pillar1Share")}
            desc={t("pensionDocs.pillar1Desc")}
            color="8,153,129"
          />
          <PensionPillar
            icon="🏢"
            title={t("pensionDocs.pillar2Title")}
            share={t("pensionDocs.pillar2Share")}
            desc={t("pensionDocs.pillar2Desc")}
            color="91,155,213"
          />
          <PensionPillar
            icon="🏦"
            title={t("pensionDocs.pillar3Title")}
            share={t("pensionDocs.pillar3Share")}
            desc={t("pensionDocs.pillar3Desc")}
            color="156,39,176"
          />
        </div>

        <div style={calloutStyle("8,153,129")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>💡 {t("pensionDocs.importantTitle")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("pensionDocs.importantBody")}
          </div>
        </div>
      </div>

      {/* Premiepensionen */}
      <div id="premiepension" style={sectionStyle}>
        <div style={h2Style}>{t("pensionDocs.premiumTitle")}</div>
        <p style={pStyle}>
          {t("pensionDocs.premiumIntro")}
        </p>

        <div id="ap7" style={h3Style}>{t("pensionDocs.ap7Title")}</div>
        <p style={pStyle}>
          {t("pensionDocs.ap7Intro")}
        </p>
        <ul style={listStyle}>
          <li><strong>AP7 Aktiefond</strong> {t("pensionDocs.ap7Item1")}</li>
          <li><strong>AP7 Räntefond</strong> {t("pensionDocs.ap7Item2")}</li>
          <li>{t("pensionDocs.ap7Item3")}</li>
        </ul>

        <div style={calloutStyle("91,155,213")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>📊 {t("pensionDocs.ap7HistTitle")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("pensionDocs.ap7HistBody")}
          </div>
        </div>

        <div id="premie-strategy" style={h3Style}>{t("pensionDocs.strategyTitle")}</div>
        <ol style={listStyle}>
          <li><strong>{t("pensionDocs.strategy1Label")}</strong> {t("pensionDocs.strategy1Text")}</li>
          <li><strong>{t("pensionDocs.strategy2Label")}</strong> {t("pensionDocs.strategy2Text")}</li>
          <li><strong>{t("pensionDocs.strategy3Label")}</strong> {t("pensionDocs.strategy3Text")}</li>
        </ol>

        <div id="premie-how" style={h3Style}>{t("pensionDocs.howTitle")}</div>
        <ol style={listStyle}>
          <li>{t("pensionDocs.how1Pre")} <strong>minpension.se</strong> {t("pensionDocs.how1Mid")} <strong>pensionsmyndigheten.se</strong> {t("pensionDocs.how1Post")}</li>
          <li>{t("pensionDocs.how2")}</li>
          <li>{t("pensionDocs.how3")}</li>
          <li>{t("pensionDocs.how4")}</li>
        </ol>
      </div>

      {/* Tjänstepension — ITP */}
      <div id="itp" style={sectionStyle}>
        <div style={h2Style}>{t("pensionDocs.itpTitle")}</div>
        <p style={pStyle}>
          {t("pensionDocs.itpIntro")}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200, background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{t("pensionDocs.itp1Title")}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{t("pensionDocs.itp1Sub")}</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              {[0, 1, 2, 3, 4].map(i => <li key={i}>{t(`pensionDocs.itp1Items.${i}`)}</li>)}
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 200, background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{t("pensionDocs.itp2Title")}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{t("pensionDocs.itp2Sub")}</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              {[0, 1, 2, 3, 4].map(i => <li key={i}>{t(`pensionDocs.itp2Items.${i}`)}</li>)}
            </ul>
          </div>
        </div>

        <div id="itp-collectum" style={h3Style}>{t("pensionDocs.collectumTitle")}</div>
        <p style={pStyle}>
          {t("pensionDocs.collectumIntro")}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, minWidth: 200, padding: 16, borderRadius: 6,
            border: "1px solid rgba(8,153,129,0.2)", background: "rgba(8,153,129,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 6 }}>{t("pensionDocs.fundInsTitle")}</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              {[0, 1, 2, 3, 4].map(i => <li key={i}>{t(`pensionDocs.fundInsItems.${i}`)}</li>)}
            </ul>
          </div>
          <div style={{
            flex: 1, minWidth: 200, padding: 16, borderRadius: 6,
            border: "1px solid rgba(91,155,213,0.2)", background: "rgba(91,155,213,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5b9bd5", marginBottom: 6 }}>{t("pensionDocs.tradInsTitle")}</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              {[0, 1, 2, 3, 4].map(i => <li key={i}>{t(`pensionDocs.tradInsItems.${i}`)}</li>)}
            </ul>
          </div>
        </div>

        <div id="itp-tips" style={h3Style}>{t("pensionDocs.chooseTitle")}</div>
        <ol style={listStyle}>
          <li>{t("pensionDocs.choose1Pre")} <strong>collectum.se</strong> {t("pensionDocs.choose1Post")}</li>
          <li>{t("pensionDocs.choose2")}</li>
          <li>{t("pensionDocs.choose3")}</li>
          <li>{t("pensionDocs.choose4")}</li>
          <li>{t("pensionDocs.choose5")}</li>
        </ol>

        <div style={calloutStyle("255,152,0")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>⚠️ {t("pensionDocs.activeChoiceTitle")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("pensionDocs.activeChoiceBody")}
          </div>
        </div>
      </div>

      {/* Avgiftens påverkan */}
      <div id="pension-fees" style={sectionStyle}>
        <div style={h2Style}>{t("pensionDocs.feesTitle")}</div>
        <p style={pStyle}>
          {t("pensionDocs.feesIntro")}
        </p>
        <PensionFeeImpact />
      </div>

      {/* Åldersanpassad allokering */}
      <div id="pension-allocation" style={sectionStyle}>
        <div style={h2Style}>{t("pensionDocs.allocationTitle")}</div>
        <p style={pStyle}>
          {t("pensionDocs.allocationIntro")}
        </p>
        <AgeAllocationTable />
        <p style={pStyle}>
          {t("pensionDocs.allocationAp7")}
        </p>

        <div id="pension-rules" style={h3Style}>{t("pensionDocs.rulesTitle")}</div>
        <ul style={listStyle}>
          <li><strong>{t("pensionDocs.rule1Label")}</strong> {t("pensionDocs.rule1Text")}</li>
          <li><strong>{t("pensionDocs.rule2Label")}</strong> {t("pensionDocs.rule2Text")}</li>
          <li><strong>{t("pensionDocs.rule3Label")}</strong> {t("pensionDocs.rule3Text")}</li>
          <li><strong>{t("pensionDocs.rule4Label")}</strong> {t("pensionDocs.rule4Text")}</li>
          <li><strong>{t("pensionDocs.rule5Label")}</strong> {t("pensionDocs.rule5Text")}</li>
          <li><strong>{t("pensionDocs.rule6Label")}</strong> {t("pensionDocs.rule6Text")}</li>
        </ul>

        <div style={calloutStyle("8,153,129")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>📌 {t("pensionDocs.summaryTitle")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>{t("pensionDocs.sum1Label")}</strong> {t("pensionDocs.sum1Text")}<br />
            <strong>{t("pensionDocs.sum2Label")}</strong> {t("pensionDocs.sum2Text")}<br />
            <strong>{t("pensionDocs.sum3Label")}</strong> {t("pensionDocs.sum3Text")}<br />
            <strong>{t("pensionDocs.sum4Label")}</strong> {t("pensionDocs.sum4Text")}
          </div>
        </div>
      </div>
    </>
  );
}
