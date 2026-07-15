import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";
import ScoringDocs from "./docs/ScoringDocs.jsx";
import AllocationDocs from "./docs/AllocationDocs.jsx";
import OwnershipDocs from "./docs/OwnershipDocs.jsx";
import PensionDocs from "./docs/PensionDocs.jsx";
import ReferenceDocs from "./docs/ReferenceDocs.jsx";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };

export default function Documentation() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>{t("documentation.title")}</h1>

      {/* Table of contents */}
      <nav style={{ ...sectionStyle, padding: isMobile ? 16 : 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{t("documentation.contents")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: t("documentation.toc.scoring"), id: "scoring", indent: 0 },
            { label: t("documentation.toc.models"), id: "models", indent: 1 },
            { label: t("documentation.toc.weighting"), id: "weighting", indent: 1 },
            { label: t("documentation.toc.risk"), id: "risk", indent: 1 },
            { label: t("documentation.toc.riskAdjust"), id: "risk-adjust", indent: 1 },
            { label: t("documentation.toc.allocation"), id: "allocation", indent: 0 },
            { label: t("documentation.toc.coreSatellite"), id: "core-satellite", indent: 1 },
            { label: t("documentation.toc.classification"), id: "classification", indent: 1 },
            { label: t("documentation.toc.targetAllocation"), id: "target-allocation", indent: 1 },
            { label: t("documentation.toc.strategies"), id: "strategies", indent: 0 },
            { label: t("documentation.toc.dcaLump"), id: "dca-lump", indent: 1 },
            { label: t("documentation.toc.ownership"), id: "ownership", indent: 0 },
            { label: t("documentation.toc.shareClass"), id: "share-class", indent: 1 },
            { label: t("documentation.toc.dualClassConsequences"), id: "dual-class-consequences", indent: 1 },
            { label: t("documentation.toc.shareClassPractical"), id: "share-class-practical", indent: 1 },
            { label: t("documentation.toc.shareClassInternational"), id: "share-class-international", indent: 1 },
            { label: t("documentation.toc.glossary"), id: "glossary", indent: 0 },
            { label: t("documentation.toc.sources"), id: "sources", indent: 0 },
            { label: t("documentation.toc.frequency"), id: "frequency", indent: 0 },
            { label: t("documentation.toc.pension"), id: "pension", indent: 0 },
            { label: t("documentation.toc.premiepension"), id: "premiepension", indent: 1 },
            { label: t("documentation.toc.itp"), id: "itp", indent: 1 },
            { label: t("documentation.toc.pensionFees"), id: "pension-fees", indent: 1 },
            { label: t("documentation.toc.pensionAllocation"), id: "pension-allocation", indent: 1 },
            { label: t("documentation.toc.disclaimer"), id: "disclaimer", indent: 0 },
          ].map((item, i) => (
            <a key={i} href={`#${item.id}`} onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              style={{ fontSize: 12, color: item.indent ? "var(--text-secondary)" : "var(--text)", textDecoration: "none", paddingLeft: item.indent * 16, cursor: "pointer", lineHeight: 1.8 }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.color = item.indent ? "var(--text-secondary)" : "var(--text)"}
            >
              {item.indent ? "— " : ""}{item.label}
            </a>
          ))}
        </div>
      </nav>

      <ScoringDocs />
      <AllocationDocs />
      <OwnershipDocs />
      <PensionDocs />
      <ReferenceDocs isMobile={isMobile} />
    </div>
  );
}
