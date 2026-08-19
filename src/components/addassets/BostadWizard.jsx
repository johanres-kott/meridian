import { useState } from "react";
import { createManualAsset } from "../../lib/manualAssets.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import BooliValuation from "./BooliValuation.jsx";
import { mono, inputStyle, parseAmount, fmtKr } from "./wizardHelpers.js";
import { Field, ChipSelect, StepNav, WizardButtons, SaveError } from "./wizardShared.jsx";

// Bostads-wizard (DESIGN.md): Finarys Add Real Estate-flöde med stegnav till
// vänster — men med det Finary saknar: svensk finansiering. Lån vs kontant,
// pantbrev och belåningsgrad. Bostaden sparas som manual_asset (kind bostad)
// och bolånet som egen is_debt-rad, länkade via metadata.

const STEPS = [
  { id: "beskrivning", label: "Beskrivning" },
  { id: "varde", label: "Värde" },
  { id: "finansiering", label: "Finansiering" },
  { id: "summering", label: "Summering" },
];

const PROPERTY_TYPES = [
  { value: "lagenhet", label: "Lägenhet" },
  { value: "villa", label: "Villa" },
  { value: "radhus", label: "Radhus" },
  { value: "fritidshus", label: "Fritidshus" },
];

export default function BostadWizard({ onSaved, onBack }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [d, setD] = useState({
    name: "", propertyType: "lagenhet", address: "", livingArea: "", buildYear: "",
    value: "", purchasePrice: "", purchaseDate: "",
    loanAmount: "", lender: "", interestRate: "", pantbrev: "", downPayment: "",
  });

  const set = (key) => (e) => setD({ ...d, [key]: e.target.value });

  const value = parseAmount(d.value);
  const loan = parseAmount(d.loanAmount);
  const pantbrev = parseAmount(d.pantbrev);
  const ltv = value > 0 && loan != null ? (loan / value) * 100 : null;
  const equity = value != null ? value - (loan ?? 0) : null;
  const pantbrevGap = pantbrev != null && loan != null && loan > pantbrev ? loan - pantbrev : null;

  const canNext = step === 0 ? d.name.trim().length > 0 : step === 1 ? value != null && value > 0 : true;

  async function save() {
    if (saving || value == null) return;
    setSaving(true);
    setSaveError(null);

    const homeMetadata = {
      wizard: "bostad",
      propertyType: d.propertyType,
      address: d.address.trim() || null,
      livingArea: parseAmount(d.livingArea),
      buildYear: d.buildYear.trim() || null,
      purchasePrice: parseAmount(d.purchasePrice),
      purchaseDate: d.purchaseDate || null,
      downPayment: parseAmount(d.downPayment),
      pantbrev,
    };

    try {
      const homeRow = await createManualAsset({
        kind: "bostad",
        label: d.name.trim(),
        value_sek: value,
        is_debt: false,
        metadata: homeMetadata,
      });

      if (loan != null && loan > 0) {
        await createManualAsset({
          kind: "bolan",
          label: `Bolån · ${d.name.trim()}`,
          value_sek: loan,
          is_debt: true,
          metadata: {
            wizard: "bostad",
            linkedAssetId: homeRow?.id ?? null,
            lender: d.lender.trim() || null,
            interestRate: parseAmount(d.interestRate),
          },
        });
      }
      onSaved();
    } catch (err) {
      console.error("BostadWizard: save failed:", err);
      setSaveError(err.message || true);
    } finally {
      setSaving(false);
    }
  }

  const summaryRows = [
    { label: "Namn", value: d.name.trim() || "—" },
    { label: "Typ", value: PROPERTY_TYPES.find(t => t.value === d.propertyType)?.label },
    d.address.trim() ? { label: "Adress", value: d.address.trim() } : null,
    parseAmount(d.livingArea) != null ? { label: "Boyta", value: `${parseAmount(d.livingArea)} m²` } : null,
    { label: "Värde", value: value != null ? fmtKr(value) : "—", strong: true },
    parseAmount(d.purchasePrice) != null ? { label: "Köpeskilling", value: fmtKr(parseAmount(d.purchasePrice)) } : null,
    loan != null ? { label: "Bolån", value: `−${fmtKr(loan)}${d.lender.trim() ? ` · ${d.lender.trim()}` : ""}`, negative: true } : null,
    ltv != null ? { label: "Belåningsgrad", value: `${ltv.toFixed(0)}%` } : null,
    pantbrev != null ? { label: "Uttagna pantbrev", value: fmtKr(pantbrev) } : null,
    equity != null ? { label: "Eget kapital i bostaden", value: fmtKr(equity), strong: true } : null,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", gap: isMobile ? 0 : 32, flexDirection: isMobile ? "column" : "row" }}>
      {/* Stegnav (Finary-mönstret) */}
      <StepNav steps={STEPS} step={step} onJump={setStep} isMobile={isMobile} />

      {/* Steginnehåll */}
      <div style={{ flex: 1, maxWidth: 640 }}>
        <button onClick={onBack}
          style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
          ‹ Tillbaka
        </button>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Lägg till bostad</h1>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Field label="Vad ska vi kalla bostaden?">
              <input value={d.name} onChange={set("name")} placeholder="T.ex. Lägenheten på Storgatan" autoFocus style={inputStyle} />
            </Field>
            <Field label="Typ">
              <ChipSelect options={PROPERTY_TYPES} value={d.propertyType} onChange={v => setD({ ...d, propertyType: v })} />
            </Field>
            <Field label="Adress" optional>
              <input value={d.address} onChange={set("address")} placeholder="Storgatan 1, Uppsala" style={inputStyle} />
            </Field>
            <div style={{ display: "flex", gap: 16 }}>
              <Field label="Boyta" optional>
                <input value={d.livingArea} onChange={set("livingArea")} placeholder="m²" inputMode="numeric" style={{ ...inputStyle, width: 120 }} />
              </Field>
              <Field label="Byggår" optional>
                <input value={d.buildYear} onChange={set("buildYear")} placeholder="t.ex. 1962" inputMode="numeric" style={{ ...inputStyle, width: 120 }} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Field label="Vad är bostaden värd idag?">
              <input value={d.value} onChange={set("value")} placeholder="Värde i kr" inputMode="numeric" autoFocus style={inputStyle} />
            </Field>
            <BooliValuation
              initialAddress={d.address}
              initialSqm={d.livingArea}
              onUseEstimate={v => setD({ ...d, value: String(v) })}
            />
            <div style={{ display: "flex", gap: 16 }}>
              <Field label="Köpeskilling" optional>
                <input value={d.purchasePrice} onChange={set("purchasePrice")} placeholder="Vad du betalade, kr" inputMode="numeric" style={inputStyle} />
              </Field>
              <Field label="Köpdatum" optional>
                <input type="date" value={d.purchaseDate} onChange={set("purchaseDate")} style={{ ...inputStyle, width: 160 }} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Hur är bostaden finansierad? Bolånet läggs automatiskt in som skuld och dras av från din nettoförmögenhet.
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Field label="Kvarvarande bolån" optional>
                <input value={d.loanAmount} onChange={set("loanAmount")} placeholder="kr" inputMode="numeric" autoFocus style={{ ...inputStyle, width: 180 }} />
              </Field>
              <Field label="Långivare" optional>
                <input value={d.lender} onChange={set("lender")} placeholder="T.ex. SBAB" style={{ ...inputStyle, width: 160 }} />
              </Field>
              <Field label="Ränta" optional>
                <input value={d.interestRate} onChange={set("interestRate")} placeholder="%" inputMode="decimal" style={{ ...inputStyle, width: 80 }} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Field label="Kontantinsats" optional>
                <input value={d.downPayment} onChange={set("downPayment")} placeholder="kr" inputMode="numeric" style={{ ...inputStyle, width: 180 }} />
              </Field>
              <Field label="Uttagna pantbrev" optional>
                <input value={d.pantbrev} onChange={set("pantbrev")} placeholder="kr" inputMode="numeric" style={{ ...inputStyle, width: 180 }} />
              </Field>
            </div>

            {(ltv != null || equity != null) && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {ltv != null && (
                  <div style={{ flex: 1, minWidth: 150, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Belåningsgrad</div>
                    <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: ltv > 85 ? "var(--neg)" : ltv > 70 ? "var(--warn)" : "var(--pos)" }}>{ltv.toFixed(0)}%</div>
                    {ltv > 70 && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                        Över 70 % gäller 2 % amorteringskrav, över 50 % gäller 1 % (generell regel).
                      </div>
                    )}
                  </div>
                )}
                {equity != null && (
                  <div style={{ flex: 1, minWidth: 150, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Eget kapital</div>
                    <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{fmtKr(equity)}</div>
                  </div>
                )}
              </div>
            )}

            {pantbrevGap != null && (
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                ⓘ Lånet överstiger uttagna pantbrev med {fmtKr(pantbrevGap)}. Nya pantbrev kostar 2 % i stämpelskatt
                på det nya beloppet plus 375 kr i expeditionsavgift (gäller fastigheter, inte bostadsrätter). Generell information.
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
              {summaryRows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: i < summaryRows.length - 1 ? "1px solid var(--border-light)" : "none", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ ...mono, color: r.negative ? "var(--neg)" : "var(--text)", fontWeight: r.strong ? 600 : 400 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
              Bostaden läggs till som tillgång{loan != null && loan > 0 ? " och bolånet som skuld" : ""} i Min ekonomi.
              Värdet uppdaterar du själv när du vill.
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
          saveLabel="Spara bostaden"
        />
      </div>
    </div>
  );
}
