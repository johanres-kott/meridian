import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";

const getSections = (t) => [
  {
    title: t("scoringMethodology.intro.title"),
    body: t("scoringMethodology.intro.body"),
  },
  {
    title: t("scoringMethodology.piotroski.title"),
    body: t("scoringMethodology.piotroski.body"),
    list: [
      t("scoringMethodology.piotroski.items.0"),
      t("scoringMethodology.piotroski.items.1"),
      t("scoringMethodology.piotroski.items.2"),
      t("scoringMethodology.piotroski.items.3"),
      t("scoringMethodology.piotroski.items.4"),
      t("scoringMethodology.piotroski.items.5"),
      t("scoringMethodology.piotroski.items.6"),
      t("scoringMethodology.piotroski.items.7"),
      t("scoringMethodology.piotroski.items.8"),
    ],
    note: t("scoringMethodology.piotroski.note"),
  },
  {
    title: t("scoringMethodology.magicFormula.title"),
    body: t("scoringMethodology.magicFormula.body"),
    list: [
      t("scoringMethodology.magicFormula.items.0"),
      t("scoringMethodology.magicFormula.items.1"),
    ],
    note: t("scoringMethodology.magicFormula.note"),
  },
  {
    title: t("scoringMethodology.growth.title"),
    body: t("scoringMethodology.growth.body"),
    list: [
      t("scoringMethodology.growth.items.0"),
      t("scoringMethodology.growth.items.1"),
      t("scoringMethodology.growth.items.2"),
    ],
    note: t("scoringMethodology.growth.note"),
  },
  {
    title: t("scoringMethodology.dividend.title"),
    body: t("scoringMethodology.dividend.body"),
    list: [
      t("scoringMethodology.dividend.items.0"),
      t("scoringMethodology.dividend.items.1"),
      t("scoringMethodology.dividend.items.2"),
    ],
    note: t("scoringMethodology.dividend.note"),
  },
  {
    title: t("scoringMethodology.quality.title"),
    body: t("scoringMethodology.quality.body"),
    list: [
      t("scoringMethodology.quality.items.0"),
      t("scoringMethodology.quality.items.1"),
      t("scoringMethodology.quality.items.2"),
    ],
    note: t("scoringMethodology.quality.note"),
  },
  {
    title: t("scoringMethodology.weighting.title"),
    body: t("scoringMethodology.weighting.body"),
    table: {
      headers: [
        t("scoringMethodology.weighting.headers.model"),
        t("scoringMethodology.weighting.headers.value"),
        t("scoringMethodology.weighting.headers.growth"),
        t("scoringMethodology.weighting.headers.dividend"),
        t("scoringMethodology.weighting.headers.mixed"),
      ],
      rows: [
        ["Piotroski", "30%", "10%", "10%", "20%"],
        ["Magic Formula", "30%", "10%", "5%", "20%"],
        [t("scoringMethodology.weighting.models.growth"), "5%", "40%", "5%", "20%"],
        [t("scoringMethodology.weighting.models.dividend"), "5%", "5%", "45%", "20%"],
        [t("scoringMethodology.weighting.models.quality"), "30%", "35%", "35%", "20%"],
      ],
    },
  },
  {
    title: t("scoringMethodology.riskAdjustment.title"),
    body: t("scoringMethodology.riskAdjustment.body"),
    list: [
      t("scoringMethodology.riskAdjustment.items.0"),
      t("scoringMethodology.riskAdjustment.items.1"),
      t("scoringMethodology.riskAdjustment.items.2"),
      t("scoringMethodology.riskAdjustment.items.3"),
    ],
  },
  {
    title: t("scoringMethodology.dataSources.title"),
    body: t("scoringMethodology.dataSources.body"),
  },
  {
    title: t("scoringMethodology.disclaimer.title"),
    body: t("scoringMethodology.disclaimer.body"),
  },
];

export default function ScoringMethodology({ onBack }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const sections = getSections(t);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={onBack}
        style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
        {t("scoringMethodology.back")}
      </button>

      {sections.map((s, i) => (
        <div key={i} style={{
          background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6,
          padding: isMobile ? 16 : 24, marginBottom: 12,
        }}>
          <h2 style={{ fontSize: i === 0 ? 20 : 15, fontWeight: 600, color: "#131722", marginBottom: 8, marginTop: 0 }}>
            {s.title}
          </h2>
          <p style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6, margin: 0 }}>{s.body}</p>

          {s.list && (
            <ul style={{ fontSize: 12, color: "#131722", lineHeight: 1.7, paddingLeft: 20, marginTop: 10 }}>
              {s.list.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          )}

          {s.note && (
            <div style={{ fontSize: 11, color: "#2962ff", marginTop: 8, fontStyle: "italic" }}>{s.note}</div>
          )}

          {s.table && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
                  {s.table.headers.map(h => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "left", color: "#787b86", fontWeight: 500, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.table.rows.map((row, j) => (
                  <tr key={j} style={{ borderBottom: "1px solid #f0f3fa" }}>
                    {row.map((cell, k) => (
                      <td key={k} style={{ padding: "8px 6px", color: k === 0 ? "#131722" : "#787b86", fontWeight: k === 0 ? 500 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
