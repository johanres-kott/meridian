import { useIsMobile } from "../hooks/useIsMobile.js";
import ScoringDocs from "./docs/ScoringDocs.jsx";
import AllocationDocs from "./docs/AllocationDocs.jsx";
import ReferenceDocs from "./docs/ReferenceDocs.jsx";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };

export default function Documentation() {
  const isMobile = useIsMobile();

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>Dokumentation</h1>

      {/* Table of contents */}
      <nav style={{ ...sectionStyle, padding: isMobile ? 16 : 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>Innehåll</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: "Hur vi poängsätter bolag", id: "scoring", indent: 0 },
            { label: "De fem delmodellerna", id: "models", indent: 1 },
            { label: "Profilviktning", id: "weighting", indent: 1 },
            { label: "Riskbedömning (Beta)", id: "risk", indent: 1 },
            { label: "Riskjustering av poäng", id: "risk-adjust", indent: 1 },
            { label: "Portföljallokering", id: "allocation", indent: 0 },
            { label: "Core-Satellite-modellen", id: "core-satellite", indent: 1 },
            { label: "Klassificeringslogik", id: "classification", indent: 1 },
            { label: "Målallokering per riskprofil", id: "target-allocation", indent: 1 },
            { label: "Investeringsstrategier", id: "strategies", indent: 0 },
            { label: "DCA vs Lump Sum", id: "dca-lump", indent: 1 },
            { label: "Nyckeltal A–Ö", id: "glossary", indent: 0 },
            { label: "Datakällor", id: "sources", indent: 0 },
            { label: "Uppdateringsfrekvens", id: "frequency", indent: 0 },
            { label: "Ansvarsfriskrivning", id: "disclaimer", indent: 0 },
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
      <ReferenceDocs isMobile={isMobile} />
    </div>
  );
}
