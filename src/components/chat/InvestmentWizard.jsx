import { useState } from "react";

const PLAN_QUESTIONS = [
  {
    key: "type",
    question: "Vill du sätta in nya pengar eller omfördela det du redan har?",
    options: [
      { label: "Nya pengar", value: "investera färska pengar" },
      { label: "Omfördela", value: "omfördela min befintliga portfölj" },
    ],
  },
  {
    key: "amount",
    question: "Hur mycket vill du investera?",
    options: [
      { label: "5 000 kr", value: "5000" },
      { label: "10 000 kr", value: "10000" },
      { label: "25 000 kr", value: "25000" },
      { label: "50 000 kr", value: "50000" },
      { label: "100 000 kr", value: "100000" },
    ],
    allowCustom: true,
    customPlaceholder: "Ange belopp i kr...",
    onlyIf: (answers) => answers.type === "investera färska pengar",
  },
];

export default function InvestmentWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customValue, setCustomValue] = useState("");

  function nextApplicableStep(fromStep, currentAnswers) {
    for (let i = fromStep; i < PLAN_QUESTIONS.length; i++) {
      const q = PLAN_QUESTIONS[i];
      if (!q.onlyIf || q.onlyIf(currentAnswers)) return i;
    }
    return -1;
  }

  const effectiveStep = nextApplicableStep(step, answers);
  const q = effectiveStep >= 0 ? PLAN_QUESTIONS[effectiveStep] : null;

  function select(value) {
    const updated = { ...answers, [q.key]: value };
    setAnswers(updated);
    setCustomValue("");
    const next = nextApplicableStep(effectiveStep + 1, updated);
    if (next >= 0) {
      setStep(next);
    } else {
      onComplete(updated);
    }
  }

  function submitCustom() {
    const val = customValue.trim();
    if (!val) return;
    select(val + " kr");
  }

  const chipStyle = {
    padding: "8px 14px", borderRadius: 16, border: "1px solid var(--border)",
    background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit",
    fontSize: 12, color: "var(--text)", transition: "all 0.15s",
  };

  if (!q) return null;

  const applicableQuestions = PLAN_QUESTIONS.filter(pq => !pq.onlyIf || pq.onlyIf(answers));
  const visibleStepIndex = applicableQuestions.indexOf(q) + 1;

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--border-light)", fontSize: 12, lineHeight: 1.5, color: "var(--text)", marginBottom: 8 }}>
        {q.question}
        {applicableQuestions.length > 1 && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            Steg {visibleStepIndex} av {applicableQuestions.length}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {q.options.map(opt => (
          <button key={opt.value} onClick={() => select(opt.value)} style={chipStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {q.allowCustom && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input
            value={customValue}
            onChange={e => setCustomValue(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter") submitCustom(); }}
            placeholder={q.customPlaceholder}
            style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit", outline: "none" }}
          />
          {customValue && (
            <button onClick={submitCustom} style={{ ...chipStyle, background: "var(--accent)", color: "#fff", border: "none" }}>
              {Number(customValue).toLocaleString("sv-SE")} kr
            </button>
          )}
        </div>
      )}
      <button onClick={onCancel} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
        Avbryt
      </button>
    </div>
  );
}
