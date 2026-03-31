import { useIsMobile } from "../hooks/useIsMobile.js";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 };

const GLOSSARY = [
  { term: "DCA (Dollar Cost Averaging)", def: "En investeringsstrategi där du sprider ut dina köp över tid — till exempel lika mycket varje månad. Minskar risken att köpa allt på toppen.", example: "Du vill investera 60 000 kr. Istället för allt på en gång köper du för 20 000 kr per månad i tre månader." },
  { term: "Lump Sum (Engångsinsats)", def: "Att investera hela beloppet direkt istället för att sprida ut det. Historiskt ger detta bättre avkastning i ungefär två av tre fall, eftersom marknaden tenderar att gå uppåt över tid.", example: "Du har 60 000 kr att investera och köper för hela beloppet idag istället för att dela upp det." },
  { term: "Beta", def: "Mäter hur mycket en akties kurs svänger jämfört med marknaden. Beta 1.0 = samma som index. Under 0.8 = stabilare, över 1.2 = mer volatil.", example: "AstraZeneca har beta 0.29 (väldigt stabil), Sinch har 1.72 (svänger mycket)." },
  { term: "Bruttomarginal", def: "Hur mycket av varje intjänad krona som blir kvar efter att varukostnaden dragits av. Bruttomarginal = (Omsättning − Varukostnad) / Omsättning.", example: "Ett bolag med 40% bruttomarginal behåller 40 öre av varje intjänad krona efter varukostnader." },
  { term: "Direktavkastning", def: "Årlig utdelning delat med aktiekursen. Visar hur mycket pengar du får tillbaka varje år bara för att äga aktien.", example: "Om aktien kostar 100 kr och utdelningen är 4 kr per år → 4% direktavkastning." },
  { term: "EBITDA", def: "Earnings Before Interest, Taxes, Depreciation and Amortization — vinst före räntor, skatt och avskrivningar. Visar bolagets operativa lönsamhet utan påverkan av finansiering och bokföringsmässiga avskrivningar.", example: "Används för att jämföra lönsamhet mellan bolag oavsett skuldsättning." },
  { term: "EBITDA-marginal", def: "EBITDA delat med omsättning. Visar hur stor andel av varje intjänad krona som blir operativ vinst.", example: "25% EBITDA-marginal = 25 öre av varje krona blir vinst före räntor och skatt." },
  { term: "EPS", def: "Earnings Per Share — vinst per aktie. Nettovinsten delat med antal utestående aktier.", example: "Om bolaget tjänar 1 miljard och har 100 miljoner aktier → EPS = 10 kr." },
  { term: "F-Score (Piotroski)", def: "En poäng mellan 0 och 9 som mäter ett bolags finansiella hälsa. Utvecklad av professor Joseph Piotroski vid Stanford. Baseras på 9 kriterier kring lönsamhet, skuldsättning och effektivitet. Högre = friskare bolag.", example: "F-Score 8 eller 9 = starkt bolag. Under 3 = potentiella problem." },
  { term: "GAV", def: "Genomsnittligt Anskaffningsvärde — det genomsnittliga priset du betalat för dina aktier. Används för att beräkna P&L (vinst/förlust).", example: "Om du köpt 100 aktier à 50 kr och 100 aktier à 60 kr → GAV = 55 kr." },
  { term: "Magic Formula", def: "Joel Greenblatts investeringsstrategi som rankar bolag efter kombinationen av hög earnings yield (billig aktie) och hög ROIC (effektiv verksamhet).", example: "Ett bolag med lågt P/E OCH hög ROIC hamnar högt på listan." },
  { term: "Nettoskuld/EBITDA", def: "Nettoskulden (räntebärande skulder minus kassa) delat med EBITDA. Visar hur många års vinst det tar att betala av skulden. Över 3x anses högt belånat.", example: "Nettoskuld 6 miljarder / EBITDA 2 miljarder = 3x. Bolaget behöver 3 års vinst för att betala skulden." },
  { term: "P&L", def: "Profit & Loss — vinst eller förlust. I Thesion: skillnaden mellan nuvarande värde och ditt anskaffningsvärde (GAV).", example: "Köpt för 10 000 kr, värt 12 000 kr idag → P&L = +2 000 kr (+20%)." },
  { term: "P/E Forward", def: "Price/Earnings Forward — aktiekursen delat med förväntad vinst per aktie nästa år. Lägre P/E = billigare aktie relativt sin vinst.", example: "Aktiekurs 100 kr, förväntad EPS 10 kr → P/E Forward = 10x. Du betalar 10 gånger vinsten." },
  { term: "P/E Trailing", def: "Price/Earnings Trailing — aktiekursen delat med senaste 12 månadernas faktiska vinst per aktie.", example: "Skillnaden mot Forward: trailing tittar bakåt (vad bolaget tjänade), forward tittar framåt (vad analytiker tror)." },
  { term: "PEG Ratio", def: "P/E delat med förväntad tillväxt. Under 1 = aktien kan vara undervärderad givet sin tillväxt. Över 2 = kan vara dyr.", example: "P/E 20 och tillväxt 20% → PEG = 1.0. P/E 30 och tillväxt 10% → PEG = 3.0 (dyrt)." },
  { term: "ROIC", def: "Return on Invested Capital — avkastning på investerat kapital. Visar hur effektivt bolaget använder pengar som investerats i verksamheten.", example: "ROIC 15% = varje investerad krona genererar 15 öre i vinst per år. Över 10% anses bra." },
  { term: "ROE", def: "Return on Equity — avkastning på eget kapital. Nettovinst delat med eget kapital.", example: "ROE 20% = aktieägarna får 20% avkastning på sitt investerade kapital." },
  { term: "Rörelsemarginal", def: "Rörelseresultat delat med omsättning. Visar hur stor del av intäkterna som blir vinst efter alla operativa kostnader (men före räntor och skatt).", example: "15% rörelsemarginal = 15 öre av varje intjänad krona blir rörelsevinst." },
  { term: "Substansvärde (NAV)", def: "Net Asset Value — det verkliga värdet av ett investmentbolags tillgångar. Ofta jämförs aktiekursen med substansvärdet — handlas det med rabatt eller premie?", example: "Investors substansvärde = 350 kr/aktie, aktiekurs 300 kr → 14% substansrabatt." },
  { term: "Tillväxt (Revenue Growth)", def: "Omsättningstillväxt jämfört med föregående år. Visar om bolaget växer eller krymper.", example: "+15% tillväxt = omsättningen ökade med 15% jämfört med förra året. Negativt = bolaget krymper." },
];

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

      {/* Data sources */}
      <div id="sources" style={sectionStyle}>
        <div style={h2Style}>Datakällor</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {[
            { name: "Yahoo Finance", desc: "Aktiekurser, nyckeltal, beta, utdelning, analytikermål" },
            { name: "Finnhub", desc: "Nyheter, bolags-sök" },
            { name: "Financial Modeling Prep", desc: "Kompletterande nyckeltal (ROIC)" },
            { name: "Finansinspektionen", desc: "Insidertransaktioner (insynsregistret)" },
            { name: "Investmentbolagens hemsidor", desc: "Portföljinnehav, vikter, värden" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ ...pStyle, marginTop: 12 }}>
          Data uppdateras dagligen via automatiserade scrapers. Aktiekurser hämtas i realtid vid varje sidladdning.
        </p>
      </div>

      {/* Uppdateringsfrekvens */}
      <div id="frequency" style={sectionStyle}>
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
              <span style={{ fontSize: 12, color: "var(--text)" }}>{item.what}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.freq}</span>
            </div>
          ))}
        </div>
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

      {/* Glossary */}
      <div id="glossary" style={sectionStyle}>
        <div style={h2Style}>Nyckeltal A–Ö</div>
        <p style={pStyle}>
          Här förklaras alla nyckeltal och begrepp som används i Thesion — på ett pedagogiskt sätt med exempel.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 12 }}>
          {GLOSSARY.map((g, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: i < GLOSSARY.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{g.term}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 6 }}>{g.def}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic", paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
                Exempel: {g.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div id="disclaimer" style={{ ...sectionStyle, background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.2)" }}>
        <div style={{ ...h2Style, color: "#e65100" }}>Ansvarsfriskrivning</div>
        <p style={{ ...pStyle, color: "var(--text-secondary)" }}>
          Thesion tillhandahåller verktyg för aktieanalys och portföljhantering. Informationen och
          rekommendationerna utgör inte finansiell rådgivning. Alla investeringsbeslut fattas av
          användaren själv. Historisk avkastning är ingen garanti för framtida resultat.
          Rådgör med en auktoriserad finansrådgivare vid behov.
        </p>
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px", fontSize: 12, color: "var(--text-secondary)" };
