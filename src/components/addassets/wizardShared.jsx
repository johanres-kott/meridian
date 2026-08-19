// Delade komponenter för add asset-wizards (bostad, fordon, …) — Finary-mönstret
// med stegnav till vänster och understrukna fält (se DESIGN.md).
// Icke-komponent-hjälpare (parseAmount, fmtKr, stilar) bor i wizardHelpers.js.

export function Field({ label, optional, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
        {label} {optional && <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Frivilligt</span>}
      </div>
      {children}
    </div>
  );
}

export function ChipSelect({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
      {options.map(t => (
        <button key={t.value} onClick={() => onChange(t.value)}
          style={{
            fontSize: 12, padding: "7px 16px", borderRadius: 18, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${value === t.value ? "var(--accent)" : "var(--border)"}`,
            background: value === t.value ? "var(--accent-light)" : "var(--bg-card)",
            color: value === t.value ? "var(--accent)" : "var(--text-secondary)",
            fontWeight: value === t.value ? 600 : 400,
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function StepNav({ steps, step, onJump, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 2, flexShrink: 0, width: isMobile ? "100%" : 170, marginBottom: isMobile ? 16 : 0, overflowX: "auto" }}>
      {steps.map((s, i) => (
        <button key={s.id} onClick={() => { if (i < step) onJump(i); }}
          style={{
            textAlign: "left", fontSize: 13, padding: isMobile ? "8px 12px" : "10px 14px", borderRadius: 8,
            border: "none", cursor: i < step ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap",
            background: i === step ? "rgba(108,113,122,0.1)" : "none",
            color: i === step ? "var(--text)" : i < step ? "var(--text)" : "var(--text-muted)",
            fontWeight: i === step ? 600 : 400,
          }}>
          {i < step ? "✓ " : ""}{s.label}
        </button>
      ))}
    </div>
  );
}

export function WizardButtons({ step, lastStep, canNext, saving, onBack, onNext, onSave, saveLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
      <button onClick={onBack}
        style={{ fontSize: 13, padding: "9px 20px", borderRadius: 18, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
        Tillbaka
      </button>
      {step < lastStep ? (
        <button onClick={() => canNext && onNext()} disabled={!canNext}
          style={{
            fontSize: 13, fontWeight: 600, padding: "9px 26px", borderRadius: 18, border: "none",
            background: canNext ? "var(--accent)" : "var(--border)", color: canNext ? "#fff" : "var(--text-secondary)",
            cursor: canNext ? "pointer" : "default", fontFamily: "inherit",
          }}>
          Nästa
        </button>
      ) : (
        <button onClick={onSave} disabled={saving}
          style={{ fontSize: 13, fontWeight: 600, padding: "9px 26px", borderRadius: 18, border: "none", background: "var(--accent)", color: "#fff", cursor: saving ? "wait" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Sparar..." : saveLabel}
        </button>
      )}
    </div>
  );
}

export function SaveError({ error }) {
  if (!error) return null;
  return (
    <div style={{ fontSize: 12, color: "var(--neg)", marginTop: 10 }}>
      Kunde inte spara{typeof error === "string" ? `: ${error}` : ""} — försök igen.
    </div>
  );
}
