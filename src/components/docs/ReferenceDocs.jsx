const GLOSSARY = [
  { term: "Core-Satellite-modellen", def: "En portföljstrategi som delar upp innehaven i en stabil Kärna (core) för trygghet, en Satellit-del för tillväxt, och en liten Spekulationsdel för hög risk/hög uppsida. Thesion analyserar din portfölj automatiskt med denna modell.", example: "En medel-risk-profil siktar på 60% Kärna, 30% Satellit, 10% Spekulation." },
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

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

export default function ReferenceDocs({ isMobile }) {
  return (
    <>
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
    </>
  );
}
