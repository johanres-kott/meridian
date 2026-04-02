const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };
const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "var(--text-secondary)" };

export default function ScoringDocs() {
  return (
    <>
      {/* Scoring overview */}
      <div id="scoring" style={sectionStyle}>
        <div style={h2Style}>Hur vi poängsätter bolag</div>
        <p style={pStyle}>
          Thesion använder en sammansatt modell med fem etablerade värderingsmetoder. Varje bolag
          får en poäng mellan 0 och 100 där högre är bättre. Poängen viktas baserat på din investerarprofil
          så att rekommendationerna passar just dig.
        </p>
      </div>

      {/* 5 models */}
      <div id="models" style={sectionStyle}>
        <div style={h2Style}>De fem delmodellerna</div>

        <div style={h3Style}>1. Piotroski F-Score (0–9)</div>
        <p style={pStyle}>
          Utvecklad av professor Joseph Piotroski vid Stanford. Mäter finansiell hälsa genom 9 binära kriterier.
          Vi använder en anpassad version:
        </p>
        <ol style={listStyle}>
          <li>Positivt ROE (avkastning på eget kapital)</li>
          <li>Positiv EBITDA-marginal</li>
          <li>Rörelsemarginal över 10%</li>
          <li>EBITDA-marginal större än rörelsemarginal (intjäningskvalitet)</li>
          <li>Nettoskuld/EBITDA under 3x (rimlig skuldsättning)</li>
          <li>Bruttomarginal över 30%</li>
          <li>Börsvärde över 5 miljarder SEK (ej micro-cap)</li>
          <li>Positiv omsättningstillväxt</li>
          <li>Bruttomarginal över 40% (stark prissättning)</li>
        </ol>
        <p style={pStyle}>Normaliserat till 0–100: (F-Score / 9) × 100. F-Score 7+ anses vara stark finansiell kvalitet.</p>

        <div style={h3Style}>2. Magic Formula (Greenblatt)</div>
        <p style={pStyle}>
          Joel Greenblatts "Magic Formula" rankar bolag efter kombinationen av hög avkastning (ROIC)
          och låg värdering (Earnings Yield = 1/P/E):
        </p>
        <ul style={listStyle}>
          <li><strong>Earnings Yield</strong> — hög vinst relativt aktiekursen (0–50 poäng)</li>
          <li><strong>ROIC</strong> — hög avkastning på investerat kapital (0–50 poäng)</li>
        </ul>

        <div style={h3Style}>3. Tillväxtpoäng</div>
        <p style={pStyle}>Mäter tillväxtpotential genom tre komponenter:</p>
        <ul style={listStyle}>
          <li><strong>PEG-ratio</strong> — P/E delat med tillväxt. Under 1 = billig tillväxt (0–40 poäng)</li>
          <li><strong>Omsättningstillväxt</strong> — senaste årets tillväxt (0–35 poäng)</li>
          <li><strong>Marginalexpansion</strong> — operativ marginal (0–25 poäng)</li>
        </ul>

        <div style={h3Style}>4. Utdelningspoäng</div>
        <p style={pStyle}>Utvärderar utdelningskvalitet och hållbarhet:</p>
        <ul style={listStyle}>
          <li><strong>Direktavkastning</strong> — årlig utdelning relativt aktiekurs (0–40 poäng)</li>
          <li><strong>Hållbarhet</strong> — låg skuld + bra marginaler (0–30 poäng)</li>
          <li><strong>Stabilitet</strong> — låg beta = jämnare utdelning (0–30 poäng)</li>
        </ul>

        <div style={h3Style}>5. Kvalitetspoäng</div>
        <p style={pStyle}>Bedömer bolagets fundamentala kvalitet:</p>
        <ul style={listStyle}>
          <li><strong>Marginalkvalitet</strong> — brutto-, rörelse- och EBITDA-marginal (0–35 poäng)</li>
          <li><strong>Kapitaleffektivitet</strong> — ROIC/ROE (0–35 poäng)</li>
          <li><strong>Finansiell styrka</strong> — låg skuldsättning (0–30 poäng)</li>
        </ul>
      </div>

      {/* Profile weighting */}
      <div id="weighting" style={sectionStyle}>
        <div style={h2Style}>Profilviktning</div>
        <p style={pStyle}>
          Totalpoängen beräknas genom att vikta de fem delmodellerna baserat på din investerarprofil.
          Olika profiler prioriterar olika aspekter:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>Modell</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Värde</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Tillväxt</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Utdelning</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Blandat</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Piotroski F-Score", "30%", "10%", "10%", "20%"],
                ["Magic Formula", "30%", "10%", "5%", "20%"],
                ["Tillväxt", "5%", "40%", "5%", "20%"],
                ["Utdelning", "5%", "5%", "45%", "20%"],
                ["Kvalitet", "30%", "35%", "35%", "20%"],
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
        <div style={h2Style}>Riskbedömning (Beta)</div>
        <p style={pStyle}>
          Vi mäter risk genom Beta — ett mått på hur mycket en aktie rör sig jämfört med
          marknaden (S&P 500). Beta 1.0 betyder att aktien rör sig exakt som index.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#089981", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>Låg risk</strong>
            <span style={{ color: "var(--text-secondary)" }}>Beta &lt; 0.8 — aktien rör sig mindre än marknaden</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#ff9800", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>Medel risk</strong>
            <span style={{ color: "var(--text-secondary)" }}>Beta 0.8–1.2 — följer marknaden relativt nära</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#f23645", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "var(--text)" }}>Hög risk</strong>
            <span style={{ color: "var(--text-secondary)" }}>Beta &gt; 1.2 — större kurssvängningar än marknaden</span>
          </div>
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          Om beta saknas (vanligt för svenska small caps) faller vi tillbaka på börsvärde:
          Large Cap = låg risk, Mid Cap = medel, Small Cap = hög.
          Investmentbolag klassas alltid som låg risk (diversifierade portföljer).
        </p>
      </div>

      {/* Riskjustering */}
      <div id="risk-adjust" style={sectionStyle}>
        <div style={h2Style}>Riskjustering av poäng</div>
        <p style={pStyle}>
          Totalpoängen justeras baserat på hur väl aktiens risknivå matchar din profil:
        </p>
        <ul style={listStyle}>
          <li><strong>Risk matchar profil:</strong> ingen justering (0 poäng)</li>
          <li><strong>1 steg avvikelse:</strong> −8 poäng (t.ex. medel risk för låg risk-profil)</li>
          <li><strong>2 steg avvikelse:</strong> −20 poäng (t.ex. hög risk för låg risk-profil)</li>
        </ul>
      </div>
    </>
  );
}
