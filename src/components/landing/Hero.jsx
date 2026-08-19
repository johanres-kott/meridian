import Logo from "./Logo.jsx";

// Landningssidans hero i nya brandet (designsystemet: ui_kits/marketing som
// förebild) — men med pivotens berättelse: helhetssyn på ekonomin,
// nettoförmögenhet, basen + kryddan. Inga gradienter, Newsreader-rubrik,
// mockup byggd av riktiga komponenter (ingen skärmdump).

import { btnPrimary, btnSecondary, btnGhost } from "./buttons.js";

function MiniDashboard() {
  const rows = [
    { label: "Portfölj", value: "183 823", pct: 2.13 },
    { label: "Tjänstepension (ITP)", value: "267 575", pct: null },
    { label: "Bostad", value: "3 000 000", pct: null },
    { label: "Bolån", value: "−1 500 000", pct: null, neg: true },
  ];
  const mono = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" };
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-raised)", overflow: "hidden", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={22} />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>Thesion</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "var(--brand-tint)", color: "var(--green-700)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-500)" }} />Live
        </span>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Nettoförmögenhet</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
          <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em" }}>
            1 951 398 <span style={{ fontSize: 16, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>SEK</span>
          </span>
          <span style={{ ...mono, fontSize: 14, fontWeight: 500, color: "var(--pos)" }}>+1,93%</span>
        </div>
        <svg viewBox="0 0 300 64" style={{ width: "100%", height: 64, marginTop: 12, display: "block" }} aria-hidden>
          <polyline points="0,50 30,44 60,47 90,38 120,41 150,30 180,33 210,22 240,27 270,14 300,18" fill="none" stroke="var(--green-500)" strokeWidth="2" />
          <polyline points="0,50 30,44 60,47 90,38 120,41 150,30 180,33 210,22 240,27 270,14 300,18 300,64 0,64" fill="var(--green-050)" stroke="none" />
        </svg>
        <div style={{ display: "flex", gap: 2, marginTop: 10 }}>
          {["1M", "3M", "I år", "Allt"].map((r, i) => (
            <span key={r} style={{ fontSize: 11, fontWeight: i === 1 ? 600 : 500, padding: "4px 10px", borderRadius: 999, background: i === 1 ? "var(--brand-tint)" : "transparent", color: i === 1 ? "var(--brand)" : "var(--text-secondary)" }}>{r}</span>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-light)" }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ ...mono, fontSize: 13, fontWeight: 500, color: r.neg ? "var(--neg)" : "var(--ink)" }}>{r.value} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>SEK</span></div>
              {r.pct != null && <div style={{ ...mono, fontSize: 11.5, color: "var(--pos)" }}>+{r.pct.toLocaleString("sv-SE", { minimumFractionDigits: 2 })}%</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero({ isMobile, onLogin, onSignup }) {
  return (
    <>
      {/* Nav */}
      <nav style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 20px" : "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={30} />
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}>Thesion</span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, alignItems: "center", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
            <a href="#funktioner" style={{ color: "inherit", fontWeight: 500 }}>Funktioner</a>
            <a href="#sa-funkar-det" style={{ color: "inherit", fontWeight: 500 }}>Så funkar det</a>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onLogin} style={{ ...btnGhost, padding: "10px 18px", fontSize: 14 }}>Logga in</button>
          <button onClick={onSignup} style={{ ...btnPrimary, padding: "10px 22px", fontSize: 14 }}>Kom igång</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "40px 20px 56px" : "72px 40px 96px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? 40 : 72, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, background: "var(--brand-tint)", color: "var(--green-700)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-500)" }} />Hela din ekonomi på ett ställe
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: isMobile ? 42 : 68, lineHeight: 1.02, letterSpacing: "-0.015em", color: "var(--ink)", margin: "22px 0 24px" }}>
            Följ. Förstå.<br />
            <span style={{ color: "var(--green-600)" }}>Bygg <em style={{ fontWeight: 400 }}>tryggt</em>.</span>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1.65, color: "var(--text-secondary)", maxWidth: 480, marginBottom: 36 }}>
            Portfölj, pension, bostad och lån i en samlad bild av din nettoförmögenhet. En billig global indexfond som bas — och aktier i bolag du tror på som krydda.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onSignup} style={{ ...btnPrimary, padding: "13px 30px", fontSize: 15 }}>Kom igång gratis</button>
            <a href="#funktioner" style={{ ...btnSecondary, padding: "13px 30px", fontSize: 15, textDecoration: "none" }}>Läs mer</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)", gap: isMobile ? "20px 24px" : 32, marginTop: isMobile ? 36 : 56, justifyContent: "start" }}>
            {[["Allt", "i SEK, på ett ställe"], ["0 kr", "courtage — vi säljer inget"], ["Dagligen", "sparad nettoförmögenhet"], ["Svenskt", "ISK, ITP och bolån"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "var(--ink)" }}>{v}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <MiniDashboard />
      </section>
    </>
  );
}
