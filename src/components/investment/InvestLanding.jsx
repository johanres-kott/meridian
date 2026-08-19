import { Layers, Sparkles, Egg } from "../icons.jsx";

// Startvyn på Investera-fliken — produktkort i Finary-stil (se PIVOT.md),
// men med Thesions berättelse: basen (indexfonder), kryddan (aktier), pension.
// Korten säljer inga produkter, de är pedagogiska ingångar till undervyerna.

const CHECK = "✓";

function Card({ icon, title, headline, text, points, ctaLabel, onCta, secondary, gradient, isMobile }) {
  const IconCmp = icon.Cmp;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: isMobile ? "14px 16px" : "18px 20px", background: gradient }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0, color: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-card)", border: "1px solid var(--border-light)",
          }}><IconCmp size={17} strokeWidth={1.5} aria-hidden /></span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{headline}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{text}</div>
      </div>
      <div style={{ padding: isMobile ? "12px 16px 14px" : "14px 20px 18px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text)" }}>
            <span style={{ color: "var(--pos)", fontWeight: 700, flexShrink: 0 }}>{CHECK}</span>
            <span style={{ lineHeight: 1.5 }}>{p}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10 }}>
          <button onClick={onCta}
            style={{
              fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 18,
              border: "none", background: "var(--accent)", color: "#fff",
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {ctaLabel}
          </button>
          {secondary && (
            <button onClick={secondary.onClick}
              style={{
                fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 18,
                border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              {secondary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestLanding({ isMobile, onFunds, onStocks, onPension, onNavigate }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Så investerar du med Thesion</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
        Basen först, kryddan sen — och pensionen med i helheten. Generell information, inte personlig rådgivning.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, alignItems: "stretch" }}>
        <Card
          isMobile={isMobile}
          icon={{ Cmp: Layers }}
          title="Basen"
          headline="Globala indexfonder"
          text="En billig, bred grund för sparandet — hela världen i en fond."
          points={[
            "Jämför avgifter, betyg och historik från Morningstar",
            "Indexfilter förvalt — se de billiga alternativen direkt",
            "Avgiftskollen visar vad aktiva fonder kostar dig per år",
          ]}
          ctaLabel="Utforska fonder"
          onCta={onFunds}
          secondary={null}
          gradient="linear-gradient(135deg, rgba(15,122,92,0.10), rgba(15,122,92,0.02))"
        />
        <Card
          isMobile={isMobile}
          icon={{ Cmp: Sparkles }}
          title="Kryddan"
          headline="Aktier i bolag du tror på"
          text="Älskar du produkterna? Kolla om bolaget faktiskt går bra."
          points={[
            "Produktsida med hälsosignal: ”Går bolaget bra?”",
            "Förslag utifrån dina intressen och din profil",
            "Nyheter, insiderhandel och ägare samlat per bolag",
          ]}
          ctaLabel="Se aktieförslag"
          onCta={onStocks}
          secondary={{ label: "Sök bolag", onClick: () => onNavigate?.("search") }}
          gradient="linear-gradient(135deg, rgba(156,39,176,0.10), rgba(156,39,176,0.02))"
        />
        <Card
          isMobile={isMobile}
          icon={{ Cmp: Egg }}
          title="Helheten"
          headline="Pension & nettoförmögenhet"
          text="Tjänstepensionen är ofta din största tillgång — ha den med i bilden."
          points={[
            "Följ din ITP och jämför fondval hos leverantören",
            "Pensionen räknas in i din nettoförmögenhet",
            "Lägg till bostad, fordon och lån under Min ekonomi",
          ]}
          ctaLabel="Till pensionen"
          onCta={onPension}
          secondary={{ label: "Min ekonomi", onClick: () => onNavigate?.("markets") }}
          gradient="linear-gradient(135deg, rgba(15,154,108,0.10), rgba(15,154,108,0.02))"
        />
      </div>
    </div>
  );
}
