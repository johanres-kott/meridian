export default function Terms({ onBack }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--brand)", padding: 0, marginBottom: 24, fontFamily: "inherit" }}
      >
        ← Tillbaka
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#131722", marginBottom: 8 }}>Användarvillkor</h1>
      <p style={{ fontSize: 12, color: "#787b86", marginBottom: 32 }}>Senast uppdaterad: augusti 2026</p>

      <Section title="1. Om tjänsten">
        Thesion är ett verktyg för att följa din privatekonomi — portfölj, pension, bostad
        och andra tillgångar. De här villkoren gäller mellan dig och Thesion när du skapar
        ett konto och använder tjänsten.
      </Section>

      <Section title="2. Inte finansiell rådgivning">
        Allt innehåll i tjänsten — poäng, hälsosignaler, avgiftsjämförelser, fondlistor och
        nyckeltal — är generell information och räkneexempel, aldrig personliga
        investeringsrekommendationer. Thesion har inte tillstånd från Finansinspektionen och
        tillhandahåller inte investeringsrådgivning enligt lagen (2007:528) om
        värdepappersmarknaden. Alla investeringsbeslut fattar du själv, på eget ansvar.
        Historisk avkastning är ingen garanti för framtida avkastning.
      </Section>

      <Section title="3. Datakällor och riktighet">
        Kurser, fonddata och annan marknadsinformation kommer från tredje parter (bland
        annat Yahoo Finance, Morningstar och Booli) och kan vara försenad, ofullständig
        eller felaktig. Vi garanterar inte att uppgifterna stämmer, och du bör alltid
        kontrollera dem mot din bank eller mäklare innan du fattar beslut.
      </Section>

      <Section title="4. Ansvarsbegränsning">
        Tjänsten tillhandahålls i befintligt skick, utan garantier om tillgänglighet eller
        felfrihet. Thesion ansvarar inte för indirekta skador eller för utfallet av
        investeringsbeslut som fattas med stöd av tjänsten. Ingenting i de här villkoren
        begränsar ansvar som följer av tvingande svensk lag, till exempel konsumentskydd
        eller ansvar vid uppsåt eller grov vårdslöshet.
      </Section>

      <Section title="5. Ditt konto">
        Du ansvarar för att uppgifterna du matar in är dina egna, för att inte missbruka
        tjänsten (till exempel intrångsförsök, skrapning eller vidareförsäljning av data)
        och för aktiviteten på ditt konto.
      </Section>

      <Section title="6. Pris och framtida betalfunktioner">
        Tjänsten är i nuläget gratis. Om betalfunktioner införs presenteras pris och villkor
        separat innan du köper något, med den ångerrätt (14 dagar) som följer av
        distansavtalslagen.
      </Section>

      <Section title="7. Immateriella rättigheter">
        Tjänstens kod, design och innehåll tillhör Thesion. Din egen inmatade data är din.
      </Section>

      <Section title="8. Ändringar och uppsägning">
        Villkoren kan uppdateras; väsentliga ändringar meddelas i appen. Du kan när som
        helst radera ditt konto (under Profil), varvid din data raderas enligt
        integritetspolicyn. Vi kan stänga konton som bryter mot villkoren.
      </Section>

      <Section title="9. Tillämplig lag och tvist">
        Svensk rätt gäller för villkoren. Tvist prövas av svensk allmän domstol, och som
        konsument kan du även vända dig till Allmänna reklamationsnämnden (ARN).
      </Section>

      <Section title="10. Kontakt">
        Har du frågor om villkoren? Kontakta oss på <strong>kontakt@thesion.tech</strong>.
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#131722", marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#434651", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
