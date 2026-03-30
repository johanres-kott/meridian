import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutPage() {
  const isMobile = useIsMobile();

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const labelStyle = { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 };
  const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>Om Thesion</h1>

      <div style={cardStyle}>
        <div style={labelStyle}>Om projektet</div>
        <p style={pStyle}>
          Thesion är ett hobbyprojekt skapat av Johan Resare för att utforska hur man kan bygga en produktionsapp med Claude Code (AI-assisterad utveckling). Appen analyserar aktier med etablerade finansiella modeller och ger personliga investeringsförslag.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Teknik</div>
        <p style={pStyle}>
          Hela appen är byggd med AI-assisterad utveckling via Claude Code (Anthropic). Tech-stacken inkluderar React för frontend, Vercel för hosting, Supabase för databas och autentisering, Yahoo Finance för marknadsdata och Claude AI för chattassistenten.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {["React", "Vercel", "Supabase", "Yahoo Finance", "Claude AI"].map(tech => (
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
