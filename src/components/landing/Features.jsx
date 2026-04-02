const jakarta = "'Plus Jakarta Sans', sans-serif";
const mono = "'IBM Plex Mono', monospace";

export default function Features({ isMobile }) {
  return (
    <>
      {/* ─── STATS BAR ─── */}
      <section style={{ padding: isMobile ? "0 20px" : "0 56px", maxWidth: 1200, margin: "-20px auto 0" }}>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 1, background: "#e0e3eb", borderRadius: 14, overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}>
          {[
            { value: "200+", label: "Analyserade aktier" },
            { value: "5", label: "Scoringmodeller" },
            { value: "7", label: "Investmentbolag" },
            { value: "Realtid", label: "Marknadsdata" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", padding: isMobile ? "22px 16px" : "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: "var(--text)", fontFamily: jakarta, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#787b86", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BENTO FEATURES ─── */}
      <section id="features" style={{ padding: isMobile ? "64px 20px" : "100px 56px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: "var(--text)", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Allt du behöver för att investera smartare
          </h2>
          <p style={{ fontSize: 16, color: "#787b86", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Från portföljöversikt till djupanalys — byggt för svenska investerare.
          </p>
        </div>

        {/* Bento grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gridTemplateRows: isMobile ? "auto" : "auto auto",
          gap: 16,
        }}>
          {/* Large card — spans 2 cols */}
          <div style={{
            gridColumn: isMobile ? "1" : "1 / 3",
            background: "linear-gradient(135deg, #0f1a2e 0%, #162035 100%)",
            borderRadius: 16, padding: isMobile ? 28 : 36, color: "#fff",
            display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: isMobile ? 200 : 240,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Smart analys</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, fontFamily: jakarta, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                Scoring baserad på<br />5 etablerade modeller
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 400 }}>
                Piotroski F-Score, Magic Formula, PEG Ratio, kvalitets- och utdelningsanalys — kombinerat till en composite score.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {["Piotroski", "Magic Formula", "Quality", "Dividend", "Growth"].map(m => (
                <span key={m} style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, background: "rgba(41,98,255,0.2)", color: "#5b9aff", fontWeight: 600, fontFamily: mono }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div style={{
            background: "#f8f9fd", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1", display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Personligt</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Anpassat efter dig
              </div>
              <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
                Värdeinvesterare? Tillväxt? Utdelning? Dina förslag viktas efter din profil.
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#e8f5e9", color: "#1b5e20", fontWeight: 600 }}>Låg risk</span>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#fff8e1", color: "#e65100", fontWeight: 600 }}>Medel</span>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#fce4ec", color: "#c62828", fontWeight: 600 }}>Hög</span>
            </div>
          </div>

          {/* Bottom left */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Portfölj</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Importera från Avanza
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Ladda upp din Avanza-PDF och få hela portföljen importerad på sekunder. Spåra P&L i realtid.
            </div>
          </div>

          {/* Bottom center */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Investmentbolag</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
              7 bolag, en vy
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Investor, Industrivärden, Öresund, Latour, Lundbergs, Svolder och Creades — innehav, ledning och nyheter.
            </div>
          </div>

          {/* Bottom right */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: isMobile ? 28 : 32,
            border: "1px solid #eceef1",
          }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Insiders</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: jakarta, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Se vad insiders gör
            </div>
            <div style={{ fontSize: 13, color: "#787b86", lineHeight: 1.6 }}>
              Insidertransaktioner från Finansinspektionen — se vad ledningen köper och säljer.
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: isMobile ? "48px 20px" : "80px 56px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: "var(--text)", fontFamily: jakarta, letterSpacing: "-0.03em", marginBottom: 14 }}>
              Tre steg till bättre investeringar
            </h2>
            <p style={{ fontSize: 15, color: "#787b86" }}>Kom igång på under en minut</p>
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 36 : 56, justifyContent: "center" }}>
            {[
              { step: "01", title: "Berätta vem du är", desc: "Fyra snabba frågor om din investeringsstil, riskprofil och intressen.", color: "#2962ff" },
              { step: "02", title: "Utforska förslag", desc: "En personlig topplista med aktier rankade med etablerade analysmodeller.", color: "#089981" },
              { step: "03", title: "Analysera på djupet", desc: "Nyckeltal, insiderhandel, risk, kursmål och AI-assistent — allt på ett ställe.", color: "#e65100" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: isMobile ? "center" : "left", maxWidth: 300 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: jakarta, marginBottom: 12, opacity: 0.2 }}>{s.step}</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", marginBottom: 8, fontFamily: jakarta }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#787b86", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
