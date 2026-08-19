import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { STEPS, PROFILE_EXPLANATIONS, GOAL_LABELS, SITUATION_LABELS, deriveLegacyProfile } from "./onboarding/steps.js";
import { Layers, Home, Egg, Target, Compass, Shield, Wallet } from "lucide-react";

// Onboarding = ekonomiprofil. Fyra steg (livsskede → situation → mål → stil)
// och en summering som landar i "ditt första steg" — konkreta handlingar ur
// svaren, inte en investerartyp. Designsystemet: Newsreader-rubriker,
// pill-knappar, radie 14, inga emoji. Generell vägledning, inte rådgivning.

const pill = (active) => ({
  fontSize: 13, fontWeight: active ? 600 : 500, padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
  border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
  background: active ? "var(--brand-tint)" : "var(--surface-card)",
  color: active ? "var(--brand)" : "var(--text)",
  transition: "all var(--duration-fast) var(--ease-out)",
});

// Första steg ur svaren — pedagogiskt, aldrig "du borde köpa X".
function firstSteps(answers) {
  const s = new Set(answers.situation || []);
  const g = new Set(answers.goals || []);
  const steps = [];
  if (!s.has("hasSavings") || g.has("buffer")) steps.push({ Icon: Wallet, title: "Lägg in din buffert", text: "Sparkonto eller buffert under + Lägg till — så syns den i helheten från dag ett." });
  if (s.has("ownsHome") || s.has("hasMortgage") || g.has("home")) steps.push({ Icon: Home, title: "Lägg in bostaden", text: "Värde, bolån och pantbrev — då får du belåningsgrad och eget kapital direkt i Min ekonomi." });
  if (s.has("hasPension") || g.has("longTerm") || answers.lifeStage === "preRetire") steps.push({ Icon: Egg, title: "Lägg in tjänstepensionen", text: "Pensionen är ofta den största tillgången. Med den på plats blir nettoförmögenheten sann." });
  if (!s.has("hasFunds") || g.has("invest")) steps.push({ Icon: Layers, title: "Titta på basen", text: "Under Investera → Start: billiga globala indexfonder och avgiftskollen. Generell information, inte rådgivning." });
  if (g.has("dream") || g.has("kids") || g.has("payDown")) steps.push({ Icon: Target, title: "Sätt ett mål", text: "Under Mål: lön in, utgifter ut, och ett sparmål med ”klart om X månader”." });
  if (steps.length === 0) steps.push({ Icon: Compass, title: "Börja med helheten", text: "Lägg in det du äger och är skyldig under + Lägg till — resten bygger på det." });
  return steps.slice(0, 3);
}

export default function OnboardingModal({ onComplete }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(-1); // -1 = välkommen, STEPS.length = summering
  const [answers, setAnswers] = useState({});

  const isSummary = step === STEPS.length;
  const current = step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const canProceed = current
    ? (current.multi ? (answers[current.id] || []).length > 0 : !!answers[current.id]) && (!current.extra || !!answers[current.extra.id])
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

  function finish() {
    onComplete({ ...answers, ...deriveLegacyProfile(answers), version: 2 });
  }

  const card = { background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-overlay)", padding: isMobile ? 22 : 36, width: isMobile ? "95vw" : 560, maxHeight: "88vh", overflow: "auto" };
  const h = { fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)" };
  const primaryBtn = { fontSize: 14, fontWeight: 600, padding: "11px 26px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,46,36,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={card}>

        {/* ── Välkommen ── */}
        {step === -1 && (
          <>
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{ ...h, fontSize: isMobile ? 28 : 34, lineHeight: 1.1, marginBottom: 10 }}>Välkommen till Thesion</div>
              <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                Få koll på hela din ekonomi — portfölj, pension, bostad och lån i en bild. Planera framåt och förstå vart du är på väg.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "22px 0 0" }}>
              {[
                { Icon: Compass, title: "Helheten", text: "Allt du äger och är skyldig räknas ihop till din nettoförmögenhet." },
                { Icon: Layers, title: "Basen", text: "En billig global indexfond som grund — enkelt och med låg avgift." },
                { Icon: Target, title: "Målen", text: "Lön in, utgifter ut, sparutrymme kvar — och mål du faktiskt når." },
              ].map(item => {
                const ItemIcon = item.Icon;
                return (
                  <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--brand-tint)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ItemIcon size={15} strokeWidth={1.5} aria-hidden />
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 18, textAlign: "center" }}>Fyra snabba frågor så anpassar vi appen efter din situation.</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => setStep(0)} style={primaryBtn}>Kom igång</button>
            </div>
          </>
        )}

        {/* ── Frågesteg ── */}
        {current && (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--border)", transition: "background 0.2s" }} />
              ))}
            </div>
            <div style={{ ...h, fontSize: isMobile ? 22 : 26, lineHeight: 1.15, marginBottom: 6 }}>{current.title}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>{current.subtitle}</div>

            {current.multi ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {current.options.map(opt => {
                  const sel = (answers[current.id] || []).includes(opt.value);
                  return <button key={opt.value} onClick={() => selectOption(opt.value)} style={pill(sel)}>{sel ? "✓ " : ""}{opt.label}</button>;
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {current.options.map(opt => {
                  const sel = answers[current.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => selectOption(opt.value)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left",
                        padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                        background: sel ? "var(--brand-tint)" : "var(--surface-card)",
                        transition: "all var(--duration-fast) var(--ease-out)",
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: sel ? "var(--green-700)" : "var(--ink)" }}>{opt.label}</div>
                      {opt.desc && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{opt.desc}</div>}
                    </button>
                  );
                })}
              </div>
            )}

            {current.extra && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{current.extra.title}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {current.extra.options.map(opt => {
                    const sel = answers[current.extra.id] === opt.value;
                    return <button key={opt.value} onClick={() => setAnswers({ ...answers, [current.extra.id]: opt.value })} style={pill(sel)}>{opt.label}</button>;
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <button onClick={() => setStep(step - 1)} disabled={step === 0}
                style={{ fontSize: 13, color: step === 0 ? "var(--text-muted)" : "var(--text-secondary)", background: "none", border: "none", cursor: step === 0 ? "default" : "pointer", fontFamily: "inherit", padding: 0 }}>
                ← Tillbaka
              </button>
              <button onClick={() => canProceed && setStep(step + 1)} disabled={!canProceed}
                style={{ ...primaryBtn, background: canProceed ? "var(--brand)" : "var(--border)", color: canProceed ? "#fff" : "var(--text-secondary)", cursor: canProceed ? "pointer" : "default" }}>
                Nästa →
              </button>
            </div>
          </>
        )}

        {/* ── Summering ── */}
        {isSummary && (() => {
          const steps = firstSteps(answers);
          const rows = [
            { key: "lifeStage", Icon: Compass, title: "Var du är", info: PROFILE_EXPLANATIONS.lifeStage[answers.lifeStage] },
            { key: "style", Icon: Shield, title: "Hur du vill ha det", info: PROFILE_EXPLANATIONS.style[answers.style] },
            { key: "experience", Icon: Layers, title: "Erfarenhet", info: PROFILE_EXPLANATIONS.experience[answers.experience] },
          ].filter(r => r.info);
          const goalLabels = (answers.goals || []).map(g => GOAL_LABELS[g]).filter(Boolean);
          const sitLabels = (answers.situation || []).map(s => SITUATION_LABELS[s]).filter(Boolean);
          return (
            <>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ ...h, fontSize: isMobile ? 24 : 28, lineHeight: 1.1, marginBottom: 6 }}>Din ekonomiprofil</div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>Så här anpassar vi appen — och här är dina första steg.</div>
              </div>

              {(sitLabels.length > 0 || goalLabels.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {sitLabels.map(l => <span key={l} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, background: "var(--bg-raised)", color: "var(--text-secondary)", fontWeight: 500 }}>{l}</span>)}
                  {goalLabels.map(l => <span key={l} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, background: "var(--brand-tint)", color: "var(--green-700)", fontWeight: 600 }}>{l}</span>)}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map(r => {
                  const RowIcon = r.Icon;
                  return (
                    <div key={r.key} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-raised)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: "var(--brand)", display: "inline-flex" }}><RowIcon size={15} strokeWidth={1.5} aria-hidden /></span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{r.title}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green-700)", marginLeft: "auto" }}>{r.info.label}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, paddingLeft: 23 }}>{r.info.explanation}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: "var(--radius-lg)", background: "var(--surface-dark)", color: "var(--on-dark)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold-300)", marginBottom: 10 }}>Dina första steg</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {steps.map((s, i) => {
                    const StepIcon = s.Icon;
                    return (
                      <div key={s.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--gold-300)", width: 22, flexShrink: 0, paddingTop: 1 }}>0{i + 1}</span>
                        <span style={{ color: "var(--on-dark-secondary)", display: "inline-flex", paddingTop: 1 }}><StepIcon size={15} strokeWidth={1.5} aria-hidden /></span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</div>
                          <div style={{ fontSize: 12.5, color: "var(--on-dark-secondary)", lineHeight: 1.5 }}>{s.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
                Generell vägledning, inte personlig rådgivning. Du kan ändra profilen när som helst under Profil.
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <button onClick={() => setStep(step - 1)} style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>← Tillbaka</button>
                <button onClick={finish} style={primaryBtn}>Starta Thesion</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
