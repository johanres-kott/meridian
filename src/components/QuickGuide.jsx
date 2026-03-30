import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";

const jakarta = "'Plus Jakarta Sans', sans-serif";

const SLIDES = [
  {
    emoji: "👋",
    title: "Välkommen till Thesion!",
    body: "Här får du en snabb genomgång av vad du kan göra. Vi har lagt till 5 aktier baserat på din profil — du kan ändra dem när som helst.",
  },
  {
    emoji: "📊",
    title: "Översikt",
    body: "Din startsida. Här ser du portföljens utveckling, marknadsrörelser och nyheter sedan du senast var inloggad.",
  },
  {
    emoji: "💼",
    title: "Portfölj",
    body: "Alla dina aktier. Importera från Avanza (PDF), lägg till manuellt, eller gruppera i egna fonder. Här ser du också din investeringsstrategi.",
  },
  {
    emoji: "🎯",
    title: "Investera",
    body: "Personliga aktieförslag rankade med 5 etablerade modeller (Piotroski, Magic Formula m.fl.). Följ också 7 svenska investmentbolag med innehav och ledning.",
  },
  {
    emoji: "🔍",
    title: "Analys & Sök",
    body: "Jämför aktier sida vid sida, se nyckeltal, och sök på vilket bolag som helst. Varje aktie får en riskbedömning och profilmatchning.",
  },
  {
    emoji: "🤖",
    title: "Mats — din finansassistent",
    body: "Klicka på AI-knappen för att prata med Mats. Fråga om din portfölj, be om strategiråd, eller spara insikter direkt till dina aktier.",
  },
];

export default function QuickGuide({ onComplete }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, padding: isMobile ? 24 : 36,
        width: isMobile ? "92vw" : 460, maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 12px 48px rgba(0,0,0,0.2)", textAlign: "center",
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "var(--accent)" : "var(--border)",
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>{slide.emoji}</div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: jakarta, marginBottom: 10, letterSpacing: "-0.02em" }}>
          {slide.title}
        </div>

        {/* Body */}
        <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
          {slide.body}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              style={{ padding: "10px 20px", fontSize: 13, background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)" }}>
              ← Tillbaka
            </button>
          )}
          <button onClick={() => isLast ? onComplete() : setStep(step + 1)}
            style={{
              padding: "10px 28px", fontSize: 13, background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>
            {isLast ? "Starta Thesion →" : "Nästa"}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button onClick={onComplete}
            style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Hoppa över guiden
          </button>
        )}
      </div>
    </div>
  );
}
