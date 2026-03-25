import { useIsMobile } from "../hooks/useIsMobile.js";

const sectionStyle = { background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "#131722", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "#131722", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "#787b86", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "#787b86", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };

export default function Documentation() {
  const isMobile = useIsMobile();

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "#131722", marginBottom: 20 }}>Dokumentation</h1>

      {/* Scoring overview */}
      <div style={sectionStyle}>
        <div style={h2Style}>Hur vi poängsätter bolag</div>
        <p style={pStyle}>
          Thesion använder en sammansatt modell med fem etablerade värderingsmetoder. Varje bolag
          får en poäng mellan 0 och 100 där högre är bättre. Poängen viktas baserat på din investerarprofil
          så att rekommendationerna passar just dig.
        </p>
      </div>

      {/* 5 models */}
      <div style={sectionStyle}>
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
      <div style={sectionStyle}>
        <div style={h2Style}>Profilviktning</div>
        <p style={pStyle}>
          Totalpoängen beräknas genom att vikta de fem delmodellerna baserat på din investerarprofil.
          Olika profiler prioriterar olika aspekter:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
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
                  <td style={{ ...tdStyle, fontWeight: 500, color: "#131722" }}>{model}</td>
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
      <div style={sectionStyle}>
        <div style={h2Style}>Riskbedömning (Beta)</div>
        <p style={pStyle}>
          Vi mäter risk genom Beta — ett mått på hur mycket en aktie rör sig jämfört med
          marknaden (S&P 500). Beta 1.0 betyder att aktien rör sig exakt som index.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#089981", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "#131722" }}>Låg risk</strong>
            <span style={{ color: "#787b86" }}>Beta &lt; 0.8 — aktien rör sig mindre än marknaden</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#ff9800", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "#131722" }}>Medel risk</strong>
            <span style={{ color: "#787b86" }}>Beta 0.8–1.2 — följer marknaden relativt nära</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#f23645", fontSize: 14 }}>◉</span>
            <strong style={{ width: 80, color: "#131722" }}>Hög risk</strong>
            <span style={{ color: "#787b86" }}>Beta &gt; 1.2 — större kurssvängningar än marknaden</span>
          </div>
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          Om beta saknas (vanligt för svenska small caps) faller vi tillbaka på börsvärde:
          Large Cap = låg risk, Mid Cap = medel, Small Cap = hög.
          Investmentbolag klassas alltid som låg risk (diversifierade portföljer).
        </p>
      </div>

      {/* Riskjustering */}
      <div style={sectionStyle}>
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

      {/* Data sources */}
      <div style={sectionStyle}>
        <div style={h2Style}>Datakällor</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {[
            { name: "Yahoo Finance", desc: "Aktiekurser, nyckeltal, beta, utdelning, analytikermål" },
            { name: "Finnhub", desc: "Nyheter, bolags-sök" },
            { name: "Financial Modeling Prep", desc: "Kompletterande nyckeltal (ROIC)" },
            { name: "Finansinspektionen", desc: "Insidertransaktioner (insynsregistret)" },
            { name: "Investmentbolagens hemsidor", desc: "Portföljinnehav, vikter, värden" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#f8f9fd", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#131722" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#787b86", marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          Data uppdateras dagligen via automatiserade scrapers. Aktiekurser hämtas i realtid vid varje sidladdning.
        </p>
      </div>

      {/* Uppdateringsfrekvens */}
      <div style={sectionStyle}>
        <div style={h2Style}>Uppdateringsfrekvens</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {[
            { what: "Aktiekurser", freq: "Realtid vid sidladdning" },
            { what: "Poängberäkning", freq: "Dagligen (nattetid)" },
            { what: "Insidertransaktioner", freq: "Dagligen" },
            { what: "Investmentbolagsinnehav", freq: "Dagligen" },
            { what: "Nyheter", freq: "Realtid vid sidladdning" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f3fa" }}>
              <span style={{ fontSize: 12, color: "#131722" }}>{item.what}</span>
              <span style={{ fontSize: 12, color: "#787b86" }}>{item.freq}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ ...sectionStyle, background: "#fff8e1", border: "1px solid #ffe082" }}>
        <div style={{ ...h2Style, color: "#e65100" }}>Ansvarsfriskrivning</div>
        <p style={{ ...pStyle, color: "#795548" }}>
          Thesion tillhandahåller verktyg för aktieanalys och portföljhantering. Informationen och
          rekommendationerna utgör inte finansiell rådgivning. Alla investeringsbeslut fattas av
          användaren själv. Historisk avkastning är ingen garanti för framtida resultat.
          Rådgör med en auktoriserad finansrådgivare vid behov.
        </p>
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "#787b86", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "#787b86" };
