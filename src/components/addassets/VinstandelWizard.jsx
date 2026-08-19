import { useState } from "react";
import { createManualAsset } from "../../lib/manualAssets.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { mono, inputStyle, parseAmount, fmtKr } from "./wizardHelpers.js";
import { Field, ChipSelect, StepNav, WizardButtons, SaveError } from "./wizardShared.jsx";
import { DEFAULT_LOCK_YEARS, summarizeTranches } from "./vinstandel.js";

// Wizard för vinstandelsstiftelse (Scania/PRI m.fl.): namn + stiftelse, årgångar
// med värde, låstid → sparas som manual_assets kind "vinstandel" med årgångarna
// i metadata. Värdena är användarens egna (från stiftelsens besked) — vi hämtar
// eller uppskattar aldrig.

const STEPS = [
  { id: "stiftelse", label: "Stiftelse" },
  { id: "argangar", label: "Årgångar" },
  { id: "summering", label: "Summering" },
];

const LOCK_OPTIONS = [
  { value: "3", label: "3 år" },
  { value: "5", label: "5 år" },
  { value: "7", label: "7 år" },
];

const THIS_YEAR = new Date().getFullYear();

export default function VinstandelWizard({ onSaved, onBack }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [d, setD] = useState({
    name: "", provider: "", lockYears: String(DEFAULT_LOCK_YEARS),
    tranches: [{ year: String(THIS_YEAR - 1), value: "" }],
  });
  const set = (key) => (e) => setD({ ...d, [key]: e.target.value });
  const setTranche = (i, key, val) => setD({ ...d, tranches: d.tranches.map((t, j) => j === i ? { ...t, [key]: val } : t) });
  const addTranche = () => {
    const lastYear = parseInt(d.tranches[d.tranches.length - 1]?.year, 10);
    setD({ ...d, tranches: [...d.tranches, { year: String(Number.isFinite(lastYear) ? lastYear - 1 : THIS_YEAR - 1), value: "" }] });
  };
  const removeTranche = (i) => setD({ ...d, tranches: d.tranches.filter((_, j) => j !== i) });

  const lockYears = parseInt(d.lockYears, 10) || DEFAULT_LOCK_YEARS;
  const parsedTranches = d.tranches
    .map(t => ({ year: parseInt(t.year, 10), value: parseAmount(t.value) }))
    .filter(t => Number.isFinite(t.year) && t.value != null && t.value > 0);
  const summary = summarizeTranches(parsedTranches, lockYears, THIS_YEAR);

  const canNext = step === 0 ? d.name.trim().length > 0 : step === 1 ? parsedTranches.length > 0 : true;

  async function save() {
    if (saving || parsedTranches.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createManualAsset({
        kind: "vinstandel",
        label: d.name.trim(),
        value_sek: summary.total,
        is_debt: false,
        metadata: {
          wizard: "vinstandel",
          provider: d.provider.trim() || null,
          lockYears,
          payoutsPerYear: 1,
          tranches: parsedTranches,
        },
      });
      onSaved();
    } catch (err) {
      console.error("VinstandelWizard: save failed:", err);
      setSaveError(err.message || true);
    } finally {
      setSaving(false);
    }
  }

  const infoBox = { fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)" };
  const statBox = { flex: 1, minWidth: 150, background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: "12px 16px" };
  const statLabel = { fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 };

  const summaryRows = [
    { label: "Namn", value: d.name.trim() || "—" },
    d.provider.trim() ? { label: "Stiftelse / förvaltare", value: d.provider.trim() } : null,
    { label: "Låstid per årgång", value: `${lockYears} år` },
    { label: "Årgångar", value: String(parsedTranches.length) },
    { label: "Totalt värde", value: fmtKr(summary.total), strong: true },
    { label: "Tillgängligt nu", value: fmtKr(summary.available) },
    summary.next ? { label: "Nästa frisläpp", value: `${fmtKr(summary.next.value)} · ${summary.next.year}` } : null,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", gap: isMobile ? 0 : 32, flexDirection: isMobile ? "column" : "row" }}>
      <StepNav steps={STEPS} step={step} onJump={setStep} isMobile={isMobile} />

      <div style={{ flex: 1, maxWidth: 640 }}>
        <button onClick={onBack}
          style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
          ‹ Tillbaka
        </button>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Lägg till vinstandelsstiftelse</h1>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Field label="Vad ska vi kalla den?">
              <input value={d.name} onChange={set("name")} placeholder="T.ex. Scania vinstandel" autoFocus style={inputStyle} />
            </Field>
            <Field label="Stiftelse / förvaltare" optional>
              <input value={d.provider} onChange={set("provider")} placeholder="T.ex. PRI Stiftelsetjänst" style={inputStyle} />
            </Field>
            <Field label="Hur länge är varje årgång låst?">
              <ChipSelect options={LOCK_OPTIONS} value={d.lockYears} onChange={v => setD({ ...d, lockYears: v })} />
            </Field>
            <div style={infoBox}>
              ⓘ Så funkar det: arbetsgivaren avsätter en andel per år, varje årgång är låst i ett antal år och betalas
              sedan ut en gång om året. Vi räknar in hela värdet i din nettoförmögenhet men visar vad som är låst
              och när nästa årgång blir tillgänglig.
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Fyll i varje årgång med aktuellt värde från stiftelsens senaste besked. Kan du inte dela upp
              per år — lägg allt som en årgång med det år avsättningen gjordes.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 28px", gap: 10, fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>Årgång</span><span>Värde idag</span><span>Tillgänglig</span><span />
              </div>
              {d.tranches.map((t, i) => {
                const y = parseInt(t.year, 10);
                const unlock = Number.isFinite(y) ? y + lockYears : null;
                const isFree = unlock != null && unlock <= THIS_YEAR;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 28px", gap: 10, alignItems: "center" }}>
                    <input value={t.year} onChange={e => setTranche(i, "year", e.target.value)} placeholder="År" inputMode="numeric" aria-label={`Årgång ${i + 1} år`} style={inputStyle} />
                    <input value={t.value} onChange={e => setTranche(i, "value", e.target.value)} placeholder="kr" inputMode="numeric" aria-label={`Årgång ${i + 1} värde`} autoFocus={i === d.tranches.length - 1} style={inputStyle} />
                    <span style={{ ...mono, fontSize: 12, color: isFree ? "var(--pos)" : "var(--text-secondary)" }}>
                      {unlock != null ? (isFree ? "nu" : String(unlock)) : "—"}
                    </span>
                    <button onClick={() => removeTranche(i)} title="Ta bort årgång" disabled={d.tranches.length === 1}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: d.tranches.length === 1 ? "default" : "pointer", fontSize: 14, fontFamily: "inherit", padding: 0, opacity: d.tranches.length === 1 ? 0.3 : 1 }}>×</button>
                  </div>
                );
              })}
            </div>
            <button onClick={addTranche}
              style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              + Lägg till årgång
            </button>
            {parsedTranches.length > 0 && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div style={statBox}>
                  <div style={statLabel}>Totalt</div>
                  <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{fmtKr(summary.total)}</div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>Tillgängligt nu</div>
                  <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: summary.available > 0 ? "var(--pos)" : "var(--text)" }}>{fmtKr(summary.available)}</div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>Låst</div>
                  <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{fmtKr(summary.locked)}</div>
                  {summary.next && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>nästa {fmtKr(summary.next.value)} · {summary.next.year}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
              {summaryRows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: i < summaryRows.length - 1 ? "1px solid var(--border-light)" : "none", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ ...mono, color: "var(--text)", fontWeight: r.strong ? 600 : 400 }}>{r.value}</span>
                </div>
              ))}
            </div>
            {summary.schedule.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={statLabel}>Frisläpps framöver</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {summary.schedule.map(s => (
                    <span key={s.year} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{s.year}</span> <span style={mono}>{fmtKr(s.value)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
              Läggs till som tillgång i Min ekonomi med hela värdet. Uppdatera värdena när stiftelsen skickar nytt besked
              (oftast en gång om året) och lägg till nästa årgång när den avsätts.
            </div>
            <SaveError error={saveError} />
          </div>
        )}

        <WizardButtons
          step={step}
          lastStep={STEPS.length - 1}
          canNext={canNext}
          saving={saving}
          onBack={() => (step === 0 ? onBack() : setStep(step - 1))}
          onNext={() => setStep(step + 1)}
          onSave={save}
          saveLabel="Spara stiftelsen"
        />
      </div>
    </div>
  );
}
