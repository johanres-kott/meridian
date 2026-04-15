import { useState } from "react";
import GapAnalysis from "./GapAnalysis.jsx";
import PremiumAnalyses from "./PremiumAnalyses.jsx";

const SUB_TABS = [
  { id: "nyckeltal", label: "Nyckeltal" },
  { id: "rapporter", label: "Rapporter ★" },
];

export default function AnalysisTab({ onNavigate, isMobile }) {
  const [sub, setSub] = useState("nyckeltal");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: sub === t.id ? "var(--accent)" : "var(--bg-card)",
              color: sub === t.id ? "#fff" : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "nyckeltal" && <GapAnalysis onNavigate={onNavigate} />}
      {sub === "rapporter" && <PremiumAnalyses isMobile={isMobile} />}
    </div>
  );
}
