import { useState } from "react";

// Produktsida-sektionen: vad bolaget faktiskt gör och säljer.
// Beskrivningen kommer från Yahoo Finance (engelska) — visas som den är.

function fmtEmployees(n) {
  if (!n) return null;
  return n.toLocaleString("sv-SE");
}

export default function AboutCompany({ company }) {
  const [expanded, setExpanded] = useState(false);
  if (!company?.description && !company?.website) return null;

  const desc = company.description;
  const isLong = desc && desc.length > 420;
  const shown = desc && !expanded && isLong ? `${desc.slice(0, 420).trimEnd()}…` : desc;

  const facts = [
    company.sector && company.sector !== "—" ? { label: "Sektor", value: company.industry && company.industry !== "—" ? `${company.sector} · ${company.industry}` : company.sector } : null,
    company.headquarters ? { label: "Huvudkontor", value: company.headquarters } : null,
    company.employees ? { label: "Anställda", value: fmtEmployees(company.employees) } : null,
  ].filter(Boolean);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>Om bolaget</div>
      {shown && (
        <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text)" }}>
          {shown}
          {isLong && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginLeft: 6 }}>
              {expanded ? "Visa mindre" : "Läs mer"}
            </button>
          )}
        </div>
      )}
      {facts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginTop: shown ? 14 : 0 }}>
          {facts.map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</div>
              <div style={{ fontSize: 12, color: "var(--text)", marginTop: 2 }}>{f.value}</div>
            </div>
          ))}
          {company.website && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Webbplats</div>
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", marginTop: 2, display: "inline-block" }}>
                {company.website.replace(/^https?:\/\/(www\.)?/, "")} ↗
              </a>
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 12 }}>Källa: Yahoo Finance</div>
    </div>
  );
}
