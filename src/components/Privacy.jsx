export default function Privacy({ onBack }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2962ff", padding: 0, marginBottom: 24, fontFamily: "inherit" }}
      >
        ← Tillbaka
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#131722", marginBottom: 8 }}>Integritetspolicy</h1>
      <p style={{ fontSize: 12, color: "#787b86", marginBottom: 32 }}>Senast uppdaterad: mars 2026</p>

      <Section title="1. Vilka vi är">
        Thesion är en portföljhanteringstjänst för aktieintresserade. Tjänsten drivs som ett
        hobbyprojekt och tillhandahålls i befintligt skick.
      </Section>

      <Section title="2. Vilken data vi samlar in">
        <ul style={ulStyle}>
          <li><strong>Kontoinformation</strong> — E-postadress och valfritt visningsnamn vid registrering.</li>
          <li><strong>Portföljdata</strong> — Aktier, grupper och inställningar du skapar i tjänsten.</li>
          <li><strong>Teknisk data</strong> — IP-adress och tidsstämplar vid inloggning (hanteras av Supabase Auth).</li>
        </ul>
        Vi samlar inte in data via tredjepartscookies, spårningspixlar eller analytics-verktyg.
      </Section>

      <Section title="3. Hur vi lagrar din data">
        All data lagras i Supabase (PostgreSQL) med servrar inom EU. Varje användare kan
        bara se och ändra sin egen data tack vare Row Level Security (RLS) på databasnivå.
        Kommunikation sker alltid över HTTPS.
      </Section>

      <Section title="4. Hur vi använder din data">
        Din data används enbart för att tillhandahålla tjänstens funktioner — visa din portfölj,
        hämta kurser och generera nyckeltal. Vi säljer aldrig din data till tredje part.
      </Section>

      <Section title="5. AI-assistenten och din portföljdata">
        Thesion har en inbyggd AI-assistent (driven av Anthropic Claude). När du använder chatten
        kan din portföljdata — inklusive aktieinnehav, antal aktier, GAV och P&L — skickas till
        Anthropic för att ge personliga svar.
        <ul style={ulStyle}>
          <li><strong>Opt-in/Opt-out</strong> — Du kan stänga av delning av portföljdata med AI:n under Profil → Integritet & AI.</li>
          <li><strong>Ingen träning</strong> — Anthropic använder inte din data för att träna sina modeller (Anthropics användningsvillkor).</li>
          <li><strong>Ingen lagring</strong> — Portföljdatan sparas inte av Anthropic efter samtalet.</li>
          <li><strong>Marknadsdata</strong> — Index, råvaror och offentliga aktiekurser delas alltid (ej personlig data).</li>
        </ul>
      </Section>

      <Section title="6. Vem har tillgång till din data">
        <ul style={ulStyle}>
          <li><strong>Du</strong> — Bara du kan se din portfölj, dina innehav och dina inställningar (skyddat av Row Level Security).</li>
          <li><strong>Administratörer</strong> — Projektägaren har teknisk tillgång till Supabase-databasen för felsökning och support. Denna åtkomst loggas.</li>
          <li><strong>Tredje parter</strong> — Supabase (datalagring, EU), Anthropic (AI-chat, vid aktiverad delning), Vercel (hosting). Ingen av dessa får tillgång utan ditt medgivande.</li>
        </ul>
      </Section>

      <Section title="7. Cookies">
        Vi använder enbart nödvändiga cookies för autentisering (Supabase Auth). Inga
        reklam- eller analyticscookies används.
      </Section>

      <Section title="8. Dina rättigheter (GDPR)">
        Du har rätt att:
        <ul style={ulStyle}>
          <li>Begära ut all data vi har om dig.</li>
          <li>Rätta felaktig information.</li>
          <li>Radera ditt konto och all tillhörande data.</li>
          <li>Invända mot behandling av din data.</li>
        </ul>
      </Section>

      <Section title="9. Kontakt">
        Har du frågor om din data eller vill utöva dina rättigheter? Kontakta oss
        på <strong>privacy@thesion.tech</strong>.
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

const ulStyle = { margin: "8px 0", paddingLeft: 20 };
