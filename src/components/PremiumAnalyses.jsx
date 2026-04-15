import { useState } from "react";
import { usePremium } from "../hooks/usePremium.js";
import PremiumGate from "./PremiumGate.jsx";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// ─── Analysis data ───────────────────────────────────────────────────────────

const ANALYSES = [
  {
    id: "ag-equipment",
    title: "Jordbruksmaskiner: Deere vs CNH vs AGCO",
    subtitle: "Sektoranalys — Premium",
    date: "2026-04",
    sector: "Industrials",
    tags: ["Sektoranalys", "Jordbruk", "USA"],
    summary: "En djupanalys av de tre största tillverkarna av jordbruksmaskiner — Deere & Company, CNH Industrial och AGCO Corporation. Marknaden är i en utdragen cyklisk nedgång: kombinerade intäkter föll ~26% från 2023-toppen ($100B till $74B). Analysen jämför finansiella nyckeltal, marknadsposition, teknologisk moat och värdering baserat på FY2025-data.",
    companies: [
      {
        name: "Deere & Company",
        ticker: "DE",
        verdict: "Marknadsledare — teknikmoat värderad till $68B av marknaden",
        color: "#367c2b",
        metrics: {
          marketCap: "~$164B",
          revenue: "$45.7B",
          netIncome: "$5.03B",
          rnd: "~5.0% av omsättning",
          moat: "Bred — See & Spray AI på 5M acres",
        },
        strengths: [
          "Världens största — 2.5x CNH, 4.5x AGCO i omsättning",
          "See & Spray AI på 5M acres + autonoma traktorer (CES 2025)",
          "~60% marknadsandel i nordamerikanska stortraktor/tröskor",
          "5 000+ återförsäljare globalt med exklusivitetsavtal",
          "SOTP visar $68B teknikvärde — 41% av börsvärdet",
        ],
        risks: [
          "Teknikpremien redan inprisad — kräver >10% av intäkterna från precision ag",
          "Intäkterna -25% från FY2023-toppen, cyklisk nedgång pågår",
          "Tariffer beräknas kosta $600M 2025, $1.2B projicerat 2026",
          "Rätt-att-reparera-debatt hotar serviceintäkter",
        ],
      },
      {
        name: "CNH Industrial",
        ticker: "CNHI",
        verdict: "Billig på mid-cycle, mindre så på trough — Exor-kontrollerad",
        color: "#cc0000",
        metrics: {
          marketCap: "~$15B",
          revenue: "$18.1B",
          netIncome: "$0.51B",
          agMargin: "10.5% Ag adj. EBIT",
          moat: "Smal — dubbla varumärken kannibaliserar",
        },
        strengths: [
          "Lägst värderad — mid-cycle DCF visar +21% uppsida ($11.53)",
          "Exor/Agnelli (26.9% equity, 45.3% röster) ger långsiktig ägare",
          "Post-Iveco renodling — ren jordbruk/bygg-spel",
          "Stark position i Europa och Latinamerika via New Holland",
        ],
        risks: [
          "Explicit 10-årsmodell visar -13% nedsida genom troughåren",
          "Ag adj. EBIT-marginal 10.5% — brantare vinstfall än Deere",
          "Case IH + New Holland skapar intern konkurrens",
          "Svagare tech-plattform — halkar efter Deere i precision ag",
        ],
      },
      {
        name: "AGCO Corporation",
        ticker: "AGCO",
        verdict: "Stark recovery med asterisker — Fendt är kronjuvelen",
        color: "#e31937",
        metrics: {
          marketCap: "~$9B",
          revenue: "$10.1B",
          netIncome: "$0.73B",
          fcf: "$740M rekord-FCF (188% konvertering)",
          moat: "Smal — Fendt-premium + EM-volym",
        },
        strengths: [
          "Fendt — ledande premiumtraktor i Europa (flest registreringar i Tyskland)",
          "Rekord-FCF $740M i FY2025, 188% konvertering",
          "Högst aktieägaravkastning: ~3.8% via $250M ASR + 13 års utdelningssvit",
          "TAFE (16.8%) ger tillgång till Indiens traktormarknad — världens största",
        ],
        risks: [
          "Justerad EPS $5.28 vs rapporterad $9.84 — engångseffekter flattar bilden",
          "~50% Europa/ME-exponering — känslig för EU:s jordbrukspolitik (CAP)",
          "Brantast omsättningstapp: -30% från FY2023-toppen",
          "Svagast position i Nordamerika — saknar konkurrenskraftigt stortraktor-erbjudande",
        ],
      },
    ],
    pdfUrl: "/analyses/ag-equipment-deep-dive.pdf",
    conclusion: "Marknaden är i en cyklisk nedgång (~26% från toppen) med osäker tidslinje för recovery. Deere är marknadsledaren med bredast moat och teknikförsprång, men marknaden prisar redan in $68B teknikvärde — uppsidan kräver att precision ag skalas över 10% av intäkterna. CNH erbjuder mest värde på mid-cycle-basis (+21% DCF-uppsida) men har nedsida genom trough-åren. AGCO visar stark recovery med rekord-FCF, men justerade siffror avslöjar engångseffekter. För långsiktiga investerare: Deere för kvalitet, CNH för värde, AGCO för Fendt-premium och EM-exponering.",
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function AnalysisCard({ analysis, onSelect, isMobile }) {
  return (
    <div
      onClick={() => onSelect(analysis)}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
        padding: 20, cursor: "pointer", transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{analysis.title}</div>
        <span style={{ fontSize: 10, color: "var(--text-muted)", ...mono, flexShrink: 0 }}>{analysis.date}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
        {analysis.summary.slice(0, 150)}...
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {analysis.tags.map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 3,
            background: "var(--bg-secondary)", color: "var(--text-secondary)", fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompanyAnalysis({ company }) {
  const tdStyle = { fontSize: 12, padding: "6px 10px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
      overflow: "hidden", marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `4px solid ${company.color}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{company.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", ...mono }}>{company.ticker}</div>
          </div>
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 4,
            background: `${company.color}15`, color: company.color, fontWeight: 600,
          }}>
            {company.verdict}
          </span>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Metrics */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {Object.entries(company.metrics).map(([key, val]) => {
            const labels = { marketCap: "Market Cap", pe: "P/E", margin: "Op. Marginal", moat: "Moat", techLead: "Teknikfokus" };
            return (
              <div key={key} style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "8px 12px", minWidth: 80 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                  {labels[key] || key}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", ...mono }}>{val}</div>
              </div>
            );
          })}
        </div>

        {/* Strengths & Risks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#089981", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Styrkor</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              {company.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#f23645", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Risker</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              {company.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisDetail({ analysis, onBack }) {
  return (
    <div>
      <button onClick={onBack}
        style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
        &larr; Tillbaka till analyser
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, ...mono }}>{analysis.date} · {analysis.sector}</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>{analysis.title}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          {analysis.summary}
        </p>
      </div>

      {analysis.companies.map(c => <CompanyAnalysis key={c.ticker} company={c} />)}

      {/* Conclusion */}
      <div style={{
        background: "rgba(8,153,129,0.04)", border: "1px solid rgba(8,153,129,0.15)",
        borderRadius: 8, padding: 20, marginTop: 8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>📌 Slutsats</div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          {analysis.conclusion}
        </p>
      </div>

      {analysis.pdfUrl && (
        <a
          href={analysis.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 16, padding: "10px 24px", fontSize: 13, fontWeight: 600,
            background: "var(--accent)", color: "#fff", border: "none",
            borderRadius: 6, textDecoration: "none", cursor: "pointer",
          }}
        >
          📄 Läs hela rapporten (PDF)
        </a>
      )}

      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 12 }}>
        Denna analys är framtagen med AI-stöd och verifierad mot publika finansiella datakällor.
        Den utgör inte investeringsrådgivning. Gör alltid din egen research.
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function PremiumAnalyses({ isMobile }) {
  const { premium, loading, checkoutLoading, error, startCheckout } = usePremium();
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Analyser</h2>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            Djupanalyser och sektorrapporter
          </div>
        </div>
        {premium && (
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 4,
            background: "rgba(8,153,129,0.1)", color: "#089981", fontWeight: 600,
          }}>
            ★ Premium
          </span>
        )}
      </div>

      <PremiumGate premium={premium} loading={loading} checkoutLoading={checkoutLoading} error={error} onSubscribe={startCheckout}>
        {selected ? (
          <AnalysisDetail analysis={selected} onBack={() => setSelected(null)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ANALYSES.map(a => (
              <AnalysisCard key={a.id} analysis={a} onSelect={setSelected} isMobile={isMobile} />
            ))}
          </div>
        )}
      </PremiumGate>
    </div>
  );
}
