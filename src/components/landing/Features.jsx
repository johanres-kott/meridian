import { Layers, Sparkles, Home, Target, Landmark, TrendingUp } from "lucide-react";

// Funktioner + "Så funkar det" i nya brandet (designsystemets bento-layout:
// en mörkgrön storruta + vita kort, radie 20, Newsreader-rubriker). Innehållet
// följer pivoten: helheten, basen, kryddan, mål.

const display = "var(--font-display)";

const bento = [
  { Icon: Home, tag: "Helheten", title: "Bostad, lån, pension och portfölj", body: "Lägg in det du äger och det du är skyldig. Bostaden med bolån och belåningsgrad, bilen, sparkontot, tjänstepensionen — allt räknas ihop till din nettoförmögenhet, i kronor." },
  { Icon: Layers, tag: "Basen", title: "Billiga globala indexfonder", body: "Vi börjar där alla borde börja. Avgiftskollen visar vad dina aktiva fonder kostar dig per år jämfört med ett billigt indexalternativ." },
  { Icon: Sparkles, tag: "Kryddan", title: "Går bolaget bra?", body: "Älskar du produkterna? Bolagssidan svarar i vardagsspråk på om bolaget faktiskt mår bra — byggt på etablerade modeller som Piotroski och Magic Formula." },
  { Icon: Target, tag: "Mål", title: "Spara till saker", body: "Lön in, utgifter ut, sparutrymme kvar. Sätt mål för buffert, resa eller kontantinsats och se hur många månader det tar." },
];

const steps = [
  ["01", "Lägg in din ekonomi", "Portfölj, pension, bostad, fordon, sparkonton och lån — wizardar som tar två minuter per tillgång. Inga bankkopplingar, dina egna siffror."],
  ["02", "Se helheten", "Nettoförmögenhet, fördelning per tillgångsslag och utveckling över tid. Sparas dagligen så historiken byggs upp framåt."],
  ["03", "Bygg tryggt", "Basen i indexfonder, kryddan i bolag du förstår, mål du faktiskt når. Generell vägledning — aldrig personlig rådgivning."],
];

export default function Features({ isMobile }) {
  const pad = isMobile ? "0 20px" : "0 40px";
  return (
    <>
      {/* ─── Bento ─── */}
      <section id="funktioner" style={{ maxWidth: 1200, margin: "0 auto", padding: `${isMobile ? 16 : 0}px ${isMobile ? 20 : 40}px ${isMobile ? 64 : 96}px` }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
          <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: isMobile ? 30 : 44, lineHeight: 1.1, letterSpacing: "-0.01em", color: "var(--ink)" }}>Hela din ekonomi. Inte bara börsen.</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 14, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            De flesta appar visar din portfölj. Thesion visar vad du äger, vad du är skyldig och vart du är på väg — byggt för svenska hushåll.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          {/* Mörkgrön storruta */}
          <div style={{ gridColumn: isMobile ? "auto" : "1 / 3", background: "var(--surface-dark)", borderRadius: "var(--radius-xl)", padding: isMobile ? 28 : 40, color: "var(--on-dark)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-dark-secondary)", marginBottom: 14 }}>Nettoförmögenhet</div>
              <div style={{ fontFamily: display, fontSize: isMobile ? 26 : 30, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>En siffra som visar<br />hur du faktiskt ligger till</div>
              <div style={{ fontSize: 14, color: "var(--on-dark-secondary)", lineHeight: 1.6, maxWidth: 420 }}>
                Portfölj + pension + tillgångar − skulder. Följ den dag för dag, se fördelningen per tillgångsslag och vad varje del väger.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
              {["Portfölj", "ITP", "Bostad", "Fordon", "Sparkonto", "Bolån"].map(m => (
                <span key={m} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "rgba(195,154,94,0.16)", color: "var(--gold-300)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{m}</span>
              ))}
            </div>
          </div>
          {bento.map(b => (
            <div key={b.tag} style={{ background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", padding: isMobile ? 24 : 28, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-tint)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <b.Icon size={17} strokeWidth={1.5} aria-hidden />
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>{b.tag}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{b.title}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{b.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Så funkar det ─── */}
      <section id="sa-funkar-det" style={{ background: "var(--bg-raised)", padding: isMobile ? "56px 0" : "88px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: pad }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
            <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: isMobile ? 28 : 40, lineHeight: 1.1, letterSpacing: "-0.01em", color: "var(--ink)" }}>Så funkar det</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {steps.map(([n, title, body]) => (
              <div key={n} style={{ background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 28 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--gold-700)", marginBottom: 12 }}>{n}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: isMobile ? 28 : 40, flexWrap: "wrap" }}>
            {[{ Icon: Landmark, txt: "Svenskt: ISK, ITP, bolån" }, { Icon: TrendingUp, txt: "Kurser från Yahoo, fonder från Morningstar" }, { Icon: Target, txt: "Generell information — inte rådgivning" }].map(item => {
              const ItemIcon = item.Icon;
              return (
                <span key={item.txt} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <ItemIcon size={15} strokeWidth={1.5} style={{ color: "var(--brand)" }} aria-hidden />{item.txt}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
