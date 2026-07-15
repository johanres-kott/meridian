import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";

const jakarta = "'Plus Jakarta Sans', sans-serif";

const getSlides = (t) => [
  {
    emoji: "👋",
    title: t("quickGuide.slides.welcome.title"),
    body: t("quickGuide.slides.welcome.body"),
  },
  {
    emoji: "📊",
    title: t("quickGuide.slides.overview.title"),
    body: t("quickGuide.slides.overview.body"),
  },
  {
    emoji: "💼",
    title: t("quickGuide.slides.portfolio.title"),
    body: t("quickGuide.slides.portfolio.body"),
  },
  {
    emoji: "🎯",
    title: t("quickGuide.slides.invest.title"),
    body: t("quickGuide.slides.invest.body"),
  },
  {
    emoji: "🔍",
    title: t("quickGuide.slides.analysis.title"),
    body: t("quickGuide.slides.analysis.body"),
  },
  {
    emoji: "🤖",
    title: t("quickGuide.slides.mats.title"),
    body: t("quickGuide.slides.mats.body"),
  },
];

export default function QuickGuide({ onComplete }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);

  const SLIDES = getSlides(t);
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
              ← {t("quickGuide.back")}
            </button>
          )}
          <button onClick={() => isLast ? onComplete() : setStep(step + 1)}
            style={{
              padding: "10px 28px", fontSize: 13, background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>
            {isLast ? t("quickGuide.start") : t("quickGuide.next")}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button onClick={onComplete}
            style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t("quickGuide.skip")}
          </button>
        )}
      </div>
    </div>
  );
}
