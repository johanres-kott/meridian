import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutPage({ onNavigate }) {
  const isMobile = useIsMobile();

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: isMobile ? 16 : 24, marginBottom: 16 };
  const labelStyle = { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 };
  const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>Om Thesion</h1>

      <div style={cardStyle}>
        <div style={labelStyle}>Om projektet</div>
        <p style={pStyle}>
          Thesion hjälper dig få koll på hela din ekonomi — portfölj, pension, bostad, fordon, sparande och lån i en samlad bild av din nettoförmögenhet. Grundidén är enkel: en billig global indexfond som bas, aktier i bolag du tror på som krydda, och mål du faktiskt når. Thesion är skapat av Johan Resare och byggt med AI-assisterad utveckling (Claude Code). Generell information, inte personlig finansiell rådgivning.
        </p>
        <button onClick={() => onNavigate?.("security")} style={{ fontSize: 12, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: 600 }}>
          Läs om din data & säkerhet →
        </button>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Teknik</div>
        <p style={pStyle}>
          Hela appen är byggd med AI-assisterad utveckling via Claude Code (Anthropic). Tech-stacken: React för frontend, Vercel för hosting, Supabase för databas och autentisering, Yahoo Finance och Finnhub för kurser, Morningstar för fonddata.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {["React", "Vercel", "Supabase", "Yahoo Finance", "Morningstar", "Claude Code"].map(tech => (
            <span key={tech} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 3, background: "var(--border-light)", color: "var(--accent)", fontWeight: 500 }}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Kontakt</div>
        <p style={pStyle}>
          Har du frågor, feedback eller förslag? Hör av dig!
        </p>
        <a href="mailto:info@thesion.tech" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
          info@thesion.tech
        </a>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Ansvarsfriskrivning</div>
        <p style={pStyle}>
          Thesion ger inte finansiell rådgivning. All information är för utbildningssyfte. Gör alltid din egen research innan du investerar.
        </p>
      </div>
    </div>
  );
}
