import { useIsMobile } from "../hooks/useIsMobile.js";

const sections = [
  {
    title: "Hur fungerar poängsättningen?",
    body: `Thesion använder en sammansatt modell baserad på fem etablerade finansiella metoder.
Varje aktie poängsätts på en skala 0-100. Din investerarprofil avgör hur de fem delmodellerna viktas.`,
  },
  {
    title: "1. Piotroski F-Score (Finansiell hälsa)",
    body: `Utvecklad av professor Joseph Piotroski vid Stanford. Testar 9 binära kriterier för att bedöma ett bolags finansiella styrka:`,
    list: [
      "Positiv avkastning på eget kapital (ROE)",
      "Positivt EBITDA (kassaflödesproxy)",
      "Rörelsemarginal över 10%",
      "EBITDA överstiger rörelsemarginal (kvalitetscheck)",
      "Skuldsättning under 3x EBITDA",
      "Bruttomarginal över 30%",
      "Börsvärde över 5 Mdkr (ej micro-cap)",
      "Positiv omsättningstillväxt",
      "Bruttomarginal över 40% (prissättningskraft)",
    ],
    note: "Poäng 0-9. Bolag med 7-9 anses finansiellt starka. Viktas tungt för värdeinvesterare.",
  },
  {
    title: "2. Magic Formula (Värde)",
    body: `Utvecklad av Joel Greenblatt. Kombinerar två nyckeltal för att hitta undervärderade kvalitetsbolag:`,
    list: [
      "Earnings Yield — vinstavkastning (inverterat P/E-tal). Högre = billigare aktie.",
      "ROIC — avkastning på investerat kapital. Högre = bättre kapitalallokering.",
    ],
    note: "Summerar earnings yield och ROIC till en gemensam poäng. Viktas tungt för värdeinvesterare.",
  },
  {
    title: "3. Tillväxtpoäng",
    body: `Bedömer bolagets tillväxtpotential genom tre komponenter:`,
    list: [
      "PEG-kvot — P/E delat med tillväxttakt. Under 1.0 indikerar rimligt värderad tillväxt.",
      "Omsättningstillväxt — procentuell intäktstillväxt. Över 15% anses starkt.",
      "Rörelsemarginal — hög marginal indikerar skalbarhet och operationell hävstång.",
    ],
    note: "Viktas tungt för tillväxtinvesterare.",
  },
  {
    title: "4. Utdelningspoäng",
    body: `Bedömer kvaliteten och hållbarheten i bolagets utdelning:`,
    list: [
      "Direktavkastning — aktuell utdelning relativt aktiekurs. Över 3% ger höga poäng.",
      "Hållbarhet — låg skuldsättning + god rörelsemarginal indikerar att utdelningen kan upprätthållas.",
      "Stabilitet — låg beta (volatilitet) tyder på stabil utdelningsbetalare.",
    ],
    note: "Viktas tungt för utdelningsinvesterare.",
  },
  {
    title: "5. Kvalitetspoäng",
    body: `Universell kvalitetsindikator som fungerar oavsett investeringsstil:`,
    list: [
      "Marginalkvalitet — kombinerar rörelse- och bruttomarginal. Höga marginaler = konkurrensfördelar.",
      "ROIC-kvalitet — avkastning på investerat kapital visar hur effektivt bolaget använder sitt kapital.",
      "Skuldsättning — låg skuld/EBITDA indikerar finansiell styrka och flexibilitet.",
    ],
    note: "Viktas jämnt för alla profiler men extra tungt för tillväxt- och utdelningsinvesterare.",
  },
  {
    title: "Din profil styr viktningen",
    body: `Beroende på din investerarprofil viktas de fem modellerna olika:`,
    table: {
      headers: ["Modell", "Värde", "Tillväxt", "Utdelning", "Blandat"],
      rows: [
        ["Piotroski", "30%", "10%", "10%", "20%"],
        ["Magic Formula", "30%", "10%", "5%", "20%"],
        ["Tillväxt", "5%", "40%", "5%", "20%"],
        ["Utdelning", "5%", "5%", "45%", "20%"],
        ["Kvalitet", "30%", "35%", "35%", "20%"],
      ],
    },
  },
  {
    title: "Riskjustering",
    body: `Slutpoängen justeras baserat på hur aktiens risk matchar din riskprofil:`,
    list: [
      "Risk bedöms via Beta (volatilitet relativt marknaden). Beta < 0.8 = låg risk, 0.8-1.2 = medel, > 1.2 = hög.",
      "Om aktiens risk matchar din profil: ingen justering.",
      "1 steg avvikelse (t.ex. du vill låg risk men aktien har medel): -8 poäng.",
      "2 steg avvikelse (t.ex. du vill låg risk men aktien har hög): -20 poäng.",
    ],
  },
  {
    title: "Datakällor & uppdatering",
    body: `All finansiell data hämtas från Yahoo Finance och Financial Modeling Prep (FMP). Poängen beräknas dagligen kl 07:00 CET på vardagar. Aktierna i universumet inkluderar Nasdaq Stockholm Large Cap, Mid Cap samt de 50 största bolagen i S&P 500.`,
  },
  {
    title: "Ansvarsfriskrivning",
    body: `Thesions poängsättning är ett analysverktyg, inte finansiell rådgivning. Modellerna baseras på historisk och aktuell finansiell data och kan inte förutsäga framtida kursutveckling. Gör alltid din egen research innan du investerar. Thesion tar inget ansvar för investeringsbeslut baserade på denna information.`,
  },
];

export default function ScoringMethodology({ onBack }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={onBack}
        style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
        ← Tillbaka
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
