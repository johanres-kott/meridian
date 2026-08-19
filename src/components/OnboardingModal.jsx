import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { STEPS, PROFILE_EXPLANATIONS } from "./onboarding/steps.js";
import { Target, Shield, Compass, Layers } from "./icons.jsx";

export default function OnboardingModal({ onComplete }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(-1); // -1 = welcome, STEPS.length = summary
  const [answers, setAnswers] = useState({});

  const isSummary = step === STEPS.length;
  const current = step >= 0 && step < STEPS.length ? STEPS[step] : null;
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
    if (isSummary) {
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
      <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: isMobile ? 20 : 32, width: isMobile ? "95vw" : 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 12px 48px rgba(0,0,0,0.15)" }}>

        {step === -1 ? (
          <>
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Välkommen till Thesion</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
                Thesion bygger på en enkel idé om sparande:
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420, margin: "16px auto 0" }}>
              {[
                { n: "1", title: "Basen", text: "En billig global indexfond som grund — bred, enkel och låg avgift." },
                { n: "2", title: "Kryddan", text: "Aktier i bolag du gillar och förstår — med koll på om bolaget faktiskt går bra." },
                { n: "3", title: "Helheten", text: "Portfölj och pension samlat, så du ser hela bilden." },
              ].map(item => (
                <div key={item.n} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, background: "var(--accent)", color: "#fff",
                  }}>{item.n}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16, lineHeight: 1.6, textAlign: "center" }}>
              Fyra snabba frågor så anpassar vi appen efter dig.
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  fontSize: 14, padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "#fff", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 500,
                }}
              >
                Kom igång
              </button>
            </div>
          </>
        ) : current ? (
        <>
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--accent)" : "var(--border)", transition: "background 0.2s" }} />
          ))}
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{current.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>{current.subtitle}</div>

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
                  border: selected ? "2px solid var(--accent)" : "2px solid var(--border)",
                  background: selected ? "var(--accent-light)" : "var(--bg-card)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: selected ? "var(--accent)" : "var(--text)" }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{opt.desc}</div>}
              </button>
            );
          })}
        </div>

        {/* Extra question (geography on step 3) */}
        {current.extra && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>{current.extra.title}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {current.extra.options.map(opt => {
                const selected = answers[current.extra.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers({ ...answers, [current.extra.id]: opt.value })}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 6,
                      border: selected ? "2px solid var(--accent)" : "2px solid var(--border)",
                      background: selected ? "var(--accent-light)" : "var(--bg-card)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                      color: selected ? "var(--accent)" : "var(--text-secondary)",
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
            style={{ fontSize: 13, color: step === 0 ? "var(--text-muted)" : "var(--text-secondary)", background: "none", border: "none", cursor: step === 0 ? "default" : "pointer", fontFamily: "inherit" }}
          >
            ← Tillbaka
          </button>
          <button
            onClick={next}
            disabled={!canProceed}
            style={{
              fontSize: 13, padding: "8px 20px", borderRadius: 6, border: "none",
              background: canProceed ? "var(--accent)" : "var(--border)",
              color: canProceed ? "#fff" : "var(--text-secondary)",
              cursor: canProceed ? "pointer" : "default",
              fontFamily: "inherit", fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {isLast ? "Nästa →" : "Nästa →"}
          </button>
        </div>
        </>
        ) : null}

        {/* Summary screen */}
        {isSummary && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Din investerarprofil</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Baserat på dina svar har vi skapat en profil som anpassar hela appen åt dig.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "investorType", Icon: Target, title: "Investeringsstil" },
                { key: "riskProfile", Icon: Shield, title: "Risknivå" },
                { key: "experience", Icon: Compass, title: "Erfarenhet" },
              ].map((row) => {
                const { key, title } = row;
                const RowIcon = row.Icon;
                const val = answers[key];
                const info = PROFILE_EXPLANATIONS[key]?.[val];
                if (!info) return null;
                return (
                  <div key={key} style={{
                    padding: "12px 14px", borderRadius: 8,
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: "var(--brand)", display: "inline-flex" }}><RowIcon size={16} strokeWidth={1.5} aria-hidden /></span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{title}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginLeft: "auto" }}>{info.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, paddingLeft: 28 }}>
                      {info.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 12, padding: "12px 14px", borderRadius: 8,
              background: "rgba(15,154,108,0.08)", border: "1px solid rgba(15,154,108,0.25)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: "var(--brand)", display: "inline-flex" }}><Layers size={16} strokeWidth={1.5} aria-hidden /></span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>Första steget: din bas</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, paddingLeft: 28 }}>
                Oavsett stil är en billig global indexfond en vanlig grund att börja med — aktierna blir kryddan ovanpå.
                Du hittar globala indexfonder under Investera → Fonder. Generell information, inte personlig rådgivning.
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              Du kan ändra din profil när som helst via profilsidan.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button
                onClick={() => setStep(step - 1)}
                style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                ← Tillbaka
              </button>
              <button
                onClick={next}
                style={{
                  fontSize: 14, padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "#fff", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 500,
                }}
              >
                Starta Thesion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
