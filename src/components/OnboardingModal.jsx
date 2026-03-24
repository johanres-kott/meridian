import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";

const STEPS = [
  {
    id: "investorType",
    title: "Vilken typ av investerare är du?",
    subtitle: "Välj den stil som bäst beskriver dig.",
    options: [
      { value: "value", label: "Värdeinvesterare", desc: "Köper undervärderade bolag med stark fundamental" },
      { value: "growth", label: "Tillväxtinvesterare", desc: "Fokus på snabbväxande bolag och framtida potential" },
      { value: "dividend", label: "Utdelningsinvesterare", desc: "Stabil avkastning genom utdelningar" },
      { value: "index", label: "Indexinvesterare", desc: "Bred marknadsexponering, låga avgifter" },
      { value: "mixed", label: "Blandat", desc: "Kombinerar flera strategier" },
    ],
  },
  {
    id: "riskProfile",
    title: "Hur ser din riskprofil ut?",
    subtitle: "Hur mycket svängningar klarar du av?",
    options: [
      { value: "low", label: "Låg risk", desc: "Stabilitet och kapitalbevarande. Föredrar stora, etablerade bolag" },
      { value: "medium", label: "Medel", desc: "Balanserad portfölj med mix av stabilt och tillväxt" },
      { value: "high", label: "Hög risk", desc: "Okej med stora svängningar för högre potential. Small caps, tillväxtbolag" },
    ],
  },
  {
    id: "focus",
    title: "Vad fokuserar du på?",
    subtitle: "Välj det som passar dig bäst.",
    options: [
      { value: "dividends", label: "Utdelning", desc: "Kassaflöde och passiv inkomst" },
      { value: "appreciation", label: "Kursökning", desc: "Kapitalvinst och tillväxt" },
      { value: "both", label: "Båda", desc: "Totalavkastning — utdelning + kursökning" },
    ],
    extra: {
      id: "geography",
      title: "Geografiskt fokus?",
      options: [
        { value: "nordic", label: "Sverige/Norden" },
        { value: "global", label: "Globalt" },
        { value: "both", label: "Blandat" },
      ],
    },
  },
  {
    id: "interests",
    title: "Vad intresserar dig?",
    subtitle: "Välj allt som stämmer — vi hittar bolag som matchar.",
    multi: true,
    options: [
      { value: "tech", label: "Tech & AI" },
      { value: "finance", label: "Bank & Finans" },
      { value: "industry", label: "Industri & Tillverkning" },
      { value: "healthcare", label: "Hälsovård & Läkemedel" },
      { value: "realestate", label: "Fastigheter" },
      { value: "food", label: "Mat & Livsmedel" },
      { value: "energy", label: "Energi & Olja" },
      { value: "gold", label: "Guld & Ädelmetaller" },
      { value: "sustainability", label: "Hållbarhet & Klimat" },
      { value: "gaming", label: "Gaming & Underhållning" },
      { value: "fashion", label: "Mode & Retail" },
      { value: "defense", label: "Försvar & Säkerhet" },
      { value: "ev", label: "Elbilar & Mobilitet" },
      { value: "crypto", label: "Krypto & Blockchain" },
    ],
  },
];

export default function OnboardingModal({ onComplete }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(-1); // -1 = welcome screen
  const [answers, setAnswers] = useState({});

  const current = step >= 0 ? STEPS[step] : null;
  const isLast = step === STEPS.length - 1;
  const canProceed = current
    ? (current.multi ? (answers[current.id] || []).length > 0 : !!answers[current.id])
    : false;

  function selectOption(value) {
    if (current.multi) {
      const prev = answers[current.id] || [];
      const next = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
      setAnswers({ ...answers, [current.id]: next });
    } else {
      setAnswers({ ...answers, [current.id]: value });
    }
  }

  function next() {
    if (isLast) {
      onComplete(answers);
    } else {
      setStep(step + 1);
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: isMobile ? 20 : 32, width: isMobile ? "95vw" : 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 12px 48px rgba(0,0,0,0.15)" }}>

        {step === -1 ? (
          <>
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#131722", marginBottom: 8 }}>Välkommen till Thesion</div>
              <div style={{ fontSize: 14, color: "#787b86", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
                För att kunna ge dig relevanta insikter och förslag behöver vi förstå dig lite bättre som investerare.
              </div>
              <div style={{ fontSize: 13, color: "#787b86", marginTop: 12, lineHeight: 1.6 }}>
                Det tar bara en minut — fyra snabba frågor om din investeringsstil, riskprofil och intressen.
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  fontSize: 14, padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "#2962ff", color: "#fff", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 500,
                }}
              >
                Kom igång
              </button>
            </div>
          </>
        ) : (
        <>
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "#2962ff" : "#e0e3eb", transition: "background 0.2s" }} />
          ))}
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 600, color: "#131722", marginBottom: 4 }}>{current.title}</div>
        <div style={{ fontSize: 13, color: "#787b86", marginBottom: 20 }}>{current.subtitle}</div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: current.extra ? 20 : 0 }}>
          {current.options.map(opt => {
            const selected = current.multi
              ? (answers[current.id] || []).includes(opt.value)
              : answers[current.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectOption(opt.value)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "12px 16px", borderRadius: 8,
                  border: selected ? "2px solid #2962ff" : "2px solid #e0e3eb",
                  background: selected ? "#f0f4ff" : "#fff",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: selected ? "#2962ff" : "#131722" }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>{opt.desc}</div>}
              </button>
            );
          })}
        </div>

        {/* Extra question (geography on step 3) */}
        {current.extra && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#131722", marginBottom: 8 }}>{current.extra.title}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {current.extra.options.map(opt => {
                const selected = answers[current.extra.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers({ ...answers, [current.extra.id]: opt.value })}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 6,
                      border: selected ? "2px solid #2962ff" : "2px solid #e0e3eb",
                      background: selected ? "#f0f4ff" : "#fff",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                      color: selected ? "#2962ff" : "#787b86",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button
            onClick={back}
            disabled={step === 0}
            style={{ fontSize: 13, color: step === 0 ? "#c0c3cb" : "#787b86", background: "none", border: "none", cursor: step === 0 ? "default" : "pointer", fontFamily: "inherit" }}
          >
            ← Tillbaka
          </button>
          <button
            onClick={next}
            disabled={!canProceed}
            style={{
              fontSize: 13, padding: "8px 20px", borderRadius: 6, border: "none",
              background: canProceed ? "#2962ff" : "#e0e3eb",
              color: canProceed ? "#fff" : "#787b86",
              cursor: canProceed ? "pointer" : "default",
              fontFamily: "inherit", fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {isLast ? "Klar!" : "Nästa →"}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
