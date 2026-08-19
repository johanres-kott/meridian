import { useIsMobile } from "../hooks/useIsMobile.js";
import { Ban, Lock, EyeOff, ShieldCheck, KeyRound, RefreshCw, Fingerprint, MailWarning, Database } from "lucide-react";

// "Din data & säkerhet" — förtroendesida i appen (Finarys säkerhetsmail som
// förebild, men i vår ton och med vårt starkare utgångsläge: inga bank-
// kopplingar, ingen handel). Bara påståenden vi kan stå för idag; 2FA
// markeras ärligt som "på väg" tills det är byggt.

const PROMISES = [
  {
    Icon: Ban,
    title: "Vi ber aldrig om dina bankuppgifter",
    text: "Thesion har inga bankkopplingar. Du matar in dina egna siffror — bostad, lån, pension, sparande — och ingen tredje part får tillgång till dina konton. Det finns helt enkelt inget att läcka.",
  },
  {
    Icon: EyeOff,
    title: "Vi kan inte röra dina pengar",
    text: "Thesion är inte kopplat till något konto och kan inte handla, flytta eller ta ut pengar. Vi visar och räknar — det är allt. Inget courtage, ingen handel, inga överföringar.",
  },
  {
    Icon: Lock,
    title: "Din data är krypterad",
    text: "All trafik mellan din webbläsare och Thesion går över TLS. Databasen (Supabase) har radnivå-säkerhet: varje fråga filtreras på ditt användar-id i databasen själv, så ingen annan användare kan se dina rader — inte ens genom ett fel i appen.",
  },
  {
    Icon: ShieldCheck,
    title: "Vi säljer aldrig din data",
    text: "Thesions affärsmodell är prenumeration (Premium), inte din information. Vi delar inte, säljer inte och berikar inte dina uppgifter åt någon annan.",
  },
  {
    Icon: Database,
    title: "Du äger din data",
    text: "Du kan när som helst exportera din portfölj (CSV under Portfölj) och radera poster. Marknadsdata kommer från Yahoo Finance och Morningstar — din egen inmatning lämnar aldrig Thesion.",
  },
];

const RECOMMENDATIONS = [
  { Icon: Fingerprint, title: "Tvåfaktorsautentisering (2FA)", text: "Ett andra lås om ditt lösenord skulle läcka. Vi bygger in det i Thesion — tills dess: använd ett starkt, unikt lösenord.", soon: true },
  { Icon: KeyRound, title: "Unika, starka lösenord", text: "Om ett konto läcker ska det inte dra med sig fler. En lösenordshanterare gör det enkelt." },
  { Icon: RefreshCw, title: "Håll allt uppdaterat", text: "Operativsystem, webbläsare och mobil — uppdateringar täpper kända hål." },
  { Icon: MailWarning, title: "Se upp för phishing", text: "Thesion ber aldrig om ditt lösenord i mail eller chatt. Misstänker du något: logga in direkt via adressen du känner igen, klicka inte på länken." },
];

export default function SecurityPage() {
  const isMobile = useIsMobile();
  const card = { background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: isMobile ? 16 : 22 };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? 24 : 30, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)", marginBottom: 6 }}>Din data & säkerhet</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24, maxWidth: 620 }}>
        Du lägger in hela din ekonomi i Thesion. Det ställer krav på oss — här är vad vi lovar, och vad vi gör för att hålla det.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 32 }}>
        {PROMISES.map(p => {
          const Icon = p.Icon;
          return (
            <div key={p.title} style={card}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-tint)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={17} strokeWidth={1.5} aria-hidden />
              </span>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{p.text}</div>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? 20 : 24, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }}>Våra rekommendationer till dig</h2>
      <div style={{ ...card, padding: 0, marginBottom: 24 }}>
        {RECOMMENDATIONS.map((r, i) => {
          const Icon = r.Icon;
          return (
            <div key={r.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: isMobile ? "14px 16px" : "16px 22px", borderBottom: i < RECOMMENDATIONS.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <span style={{ color: "var(--brand)", display: "inline-flex", paddingTop: 2, flexShrink: 0 }}><Icon size={17} strokeWidth={1.5} aria-hidden /></span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.title}</span>
                  {r.soon && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--gold-100)", color: "var(--gold-700)", letterSpacing: "0.04em", textTransform: "uppercase" }}>På väg</span>}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Inloggning och databas: Supabase (EU). Hosting: Vercel. Marknadsdata: Yahoo Finance, Finnhub, Morningstar. Thesion ger generell information — inte personlig finansiell rådgivning. Frågor om din data? Hör av dig via Om Thesion.
      </div>
    </div>
  );
}
