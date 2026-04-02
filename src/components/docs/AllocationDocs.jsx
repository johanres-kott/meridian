const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };
const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "var(--text-secondary)" };

export default function AllocationDocs() {
  return (
    <>
      {/* Portfolio allocation — Core-Satellite */}
      <div id="allocation" style={sectionStyle}>
        <div style={h2Style}>Portföljallokering</div>
        <p style={pStyle}>
          Thesion analyserar din portfölj med <strong>Core-Satellite-modellen</strong> — en vedertagen strategi
          som delar upp portföljen i tre delar med olika syften. Analysen visas som ett allokeringskort
          på Portföljsidan och Mats kan kommentera din allokering i chatten.
        </p>

        <div id="core-satellite" style={h3Style}>Core-Satellite-modellen</div>
        <p style={pStyle}>
          Modellen bygger på att ha en stabil kärna som grund, och komplettera med mer offensiva satsningar:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <div>
              <strong style={{ color: "#089981" }}>Kärna (Core)</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                Stabila blue chips, defensiva bolag, låg beta (&lt;0.8), hög kvalitet.
                Dessa ger trygghet och stabilitet till portföljen. Exempel: stora banker, telekombolag,
                hälsovårdsjättar, investmentbolag.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🚀</span>
            <div>
              <strong style={{ color: "#5b9bd5" }}>Satellit (Satellite)</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                Tillväxtbolag, tematiska satsningar, medelstor risk.
                Här tar du positioner i trender och sektorer du tror på. Exempel: SaaS-bolag,
                e-handel, fintech, mid-caps med tillväxt.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🎲</span>
            <div>
              <strong style={{ color: "#f23645" }}>Spekulation (Speculation)</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                Hög risk, hög uppsida, turnarounds. Små positioner i bolag
                med asymmetrisk potential. Exempel: micro-caps, pre-revenue-bolag, kryptorelaterade.
              </div>
            </div>
          </div>
        </div>

        <div id="classification" style={h3Style}>Klassificeringslogik</div>
        <p style={pStyle}>
          Varje innehav klassificeras med ett poängbaserat system som ackumulerar signaler.
          Positiva poäng drar mot Kärna, negativa mot Spekulation, och mittemellan hamnar som Satellit.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>Signal</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Kärna (+)</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Spekulation (−)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Risk (låg/hög)", "+3", "−2"],
                ["Beta < 0.7 / > 2.0", "+3", "−3"],
                ["Beta < 1.0 / > 1.5", "+1", "−2"],
                ["Kvalitetspoäng ≥ 70 / < 30", "+2", "−1"],
                ["Piotroski F-Score ≥ 7 / ≤ 2", "+2", "−1"],
                ["Defensiv / Spekulativ sektor", "+1", "−3"],
                ["Mega-cap (>100B) / Micro-cap (<1B)", "+2", "−2"],
                ["Large-cap (>20B) / Small-cap (<5B)", "+1", "−1"],
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
          <strong>Tröskel:</strong> Totalpoäng ≥ 3 → Kärna. Totalpoäng ≤ −3 → Spekulation. Allt däremellan → Satellit.
        </p>
        <p style={pStyle}>
          <strong>Saknas scoredata?</strong> Innehavet hamnar som Satellit (inte Spekulation) och klassificeras
          utifrån sektor och namn. Detta undviker att bolag felaktigt pekas ut som spekulativa bara
          för att de inte finns i vår scoredatabas.
        </p>

        <div id="target-allocation" style={h3Style}>Målallokering per riskprofil</div>
        <p style={pStyle}>
          Allokeringskortet jämför din nuvarande fördelning mot en målallokering baserad på din riskprofil:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>Riskprofil</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#089981" }}>Kärna</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#5b9bd5" }}>Satellit</th>
                <th style={{ ...thStyle, textAlign: "center", color: "#f23645" }}>Spekulation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Låg risk", "75%", "20%", "5%"],
                ["Medel risk", "60%", "30%", "10%"],
                ["Hög risk", "40%", "35%", "25%"],
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
          Avvikelser visas i procentenheter (pp). Portföljen räknas som <strong>balanserad</strong> om
          Kärna avviker max ±10pp och Spekulation max ±5pp från målet.
        </p>
      </div>

      {/* Investment strategies */}
      <div id="strategies" style={sectionStyle}>
        <div style={h2Style}>Investeringsstrategier</div>
        <p style={pStyle}>
          När du har pengar att investera finns det två huvudstrategier för hur du lägger in dem på marknaden.
          Thesion anpassar sin rekommendation baserat på din riskprofil.
        </p>

        <div id="dca-lump" style={h3Style}>DCA vs Lump Sum</div>
        <p style={pStyle}>
          <strong>Lump Sum</strong> innebär att du investerar hela beloppet direkt. <strong>DCA (Dollar Cost Averaging)</strong> innebär
          att du sprider ut köpen över tid — till exempel lika mycket varje vecka eller månad.
        </p>

        <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Vad säger forskningen?</div>
          <p style={{ ...pStyle, marginBottom: 8 }}>
            Vanguards studie <em>"Dollar-cost averaging just means taking risk later"</em> (2012) analyserade data
            från USA, Storbritannien och Australien mellan 1926–2011. Resultaten visar att:
          </p>
          <ul style={listStyle}>
            <li>Lump Sum slog DCA i cirka <strong>två av tre fall</strong> (66% av alla 12-månadersperioder)</li>
            <li>Genomsnittlig fördel för Lump Sum: <strong>2,3 procentenheter</strong> högre avkastning över 12 månader</li>
            <li>Anledningen: marknaden tenderar att gå uppåt över tid, så pengar som ligger och väntar missar avkastning</li>
          </ul>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 0, lineHeight: 1.5 }}>
            Källa: Vanguard Research, "Dollar-cost averaging just means taking risk later" (Juli 2012).
            Författare: Georgianni, Shtekhman &amp; Tasopoulos.
          </p>
        </div>

        <div style={h3Style}>Hur Thesion anpassar strategin</div>
        <p style={pStyle}>Baserat på din riskprofil rekommenderar Mats olika strategier:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#089981", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>Låg risk-profil → DCA 3–4 månader</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>Sprider risken maximalt. Du slipper oroa dig för tajming och marknadens svängningar.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#ff9800", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>Medel risk-profil → DCA 2–3 månader</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>Balans mellan riskspridning och att komma in i marknaden snabbt.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#f23645", fontSize: 14 }}>◉</span>
            <div>
              <strong style={{ color: "var(--text)" }}>Hög risk-profil → Lump Sum (engångsinsats)</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>Historiskt bäst avkastning. Passar dig som tål svängningar och tror på marknaden långsiktigt.</div>
            </div>
          </div>
        </div>

        <p style={{ ...pStyle, marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          <strong>Tips:</strong> Oavsett strategi — det viktigaste är att du investerar regelbundet och håller dig till din plan.
          Att vänta på "rätt tillfälle" brukar ge sämre resultat än att bara komma igång.
        </p>
      </div>
    </>
  );
}
