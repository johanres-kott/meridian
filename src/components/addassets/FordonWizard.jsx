import { useState } from "react";
import { supabase } from "../../supabase.js";
import { useUser } from "../../contexts/UserContext.jsx";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { mono, inputStyle, parseAmount, fmtKr } from "./wizardHelpers.js";
import { Field, ChipSelect, StepNav, WizardButtons, SaveError } from "./wizardShared.jsx";

// Fordons-wizard — samma mönster som BostadWizard (DESIGN.md): beskrivning →
// värde → finansiering → summering. Finansieringssätt väljs i steg 1:
// kontant (rent eget kapital), lån (billån läggs som länkad skuld) eller
// leasing (fordonet ägs inte — sparas med värde 0 och månadskostnad som info,
// varken tillgång eller skuld i nettoförmögenheten).

const STEPS = [
  { id: "beskrivning", label: "Beskrivning" },
  { id: "varde", label: "Värde" },
  { id: "finansiering", label: "Finansiering" },
  { id: "summering", label: "Summering" },
];

const VEHICLE_TYPES = [
  { value: "bil", label: "Bil" },
  { value: "mc", label: "MC" },
  { value: "husbil", label: "Husbil" },
  { value: "husvagn", label: "Husvagn" },
  { value: "bat", label: "Båt" },
];

const FINANCING_OPTIONS = [
  { value: "kontant", label: "Kontant" },
  { value: "lan", label: "Lån" },
  { value: "leasing", label: "Leasing" },
];

export default function FordonWizard({ onSaved, onBack }) {
  const { userId } = useUser();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [d, setD] = useState({
    name: "", vehicleType: "bil", financing: "kontant", regNumber: "", modelYear: "", mileage: "",
    value: "", purchasePrice: "", purchaseDate: "", monthlyCost: "",
    loanAmount: "", lender: "", interestRate: "",
  });

  const set = (key) => (e) => setD({ ...d, [key]: e.target.value });

  const isLeasing = d.financing === "leasing";
  const hasLoan = d.financing === "lan";
  const value = parseAmount(d.value);
  const loan = hasLoan ? parseAmount(d.loanAmount) : null;
  const monthlyCost = parseAmount(d.monthlyCost);
  const equity = !isLeasing && value != null ? value - (loan ?? 0) : null;
  const loanShare = value > 0 && loan != null ? (loan / value) * 100 : null;

  const canNext = step === 0
    ? d.name.trim().length > 0
    : step === 1
      ? isLeasing || (value != null && value > 0)
      : true;

  async function save() {
    if (saving || (!isLeasing && value == null)) return;
    setSaving(true);
    setSaveError(null);

    const vehicleMetadata = {
      wizard: "fordon",
      vehicleType: d.vehicleType,
      financing: d.financing,
      regNumber: d.regNumber.trim() || null,
      modelYear: d.modelYear.trim() || null,
      mileage: parseAmount(d.mileage),
      purchasePrice: parseAmount(d.purchasePrice),
      purchaseDate: d.purchaseDate || null,
      monthlyCost: isLeasing ? monthlyCost : null,
    };

    // Leasat fordon ägs inte — det sparas med värde 0 så det syns i helheten
    // utan att blåsa upp nettoförmögenheten.
    const { data: vehicleRow, error: vehicleErr } = await supabase
      .from("manual_assets")
      .insert({ user_id: userId, kind: "fordon", label: d.name.trim(), value_sek: isLeasing ? 0 : value, is_debt: false, metadata: vehicleMetadata })
      .select()
      .single();

    if (vehicleErr) {
      console.error("FordonWizard: vehicle insert failed:", vehicleErr);
      setSaving(false);
      setSaveError(vehicleErr.message || true);
      return;
    }

    if (hasLoan && loan != null && loan > 0) {
      const { error: loanErr } = await supabase.from("manual_assets").insert({
        user_id: userId,
        kind: "skuld",
        label: `Billån · ${d.name.trim()}`,
        value_sek: loan,
        is_debt: true,
        metadata: {
          wizard: "fordon",
          loanType: "billan",
          linkedAssetId: vehicleRow?.id ?? null,
          lender: d.lender.trim() || null,
          interestRate: parseAmount(d.interestRate),
        },
      });
      if (loanErr) {
        console.error("FordonWizard: loan insert failed:", loanErr);
        setSaving(false);
        setSaveError(loanErr.message || true);
        return;
      }
    }

    setSaving(false);
    onSaved();
  }

  const summaryRows = [
    { label: "Namn", value: d.name.trim() || "—" },
    { label: "Typ", value: VEHICLE_TYPES.find(t => t.value === d.vehicleType)?.label },
    { label: "Finansiering", value: FINANCING_OPTIONS.find(f => f.value === d.financing)?.label },
    d.regNumber.trim() ? { label: "Regnummer", value: d.regNumber.trim().toUpperCase() } : null,
    d.modelYear.trim() ? { label: "Årsmodell", value: d.modelYear.trim() } : null,
    parseAmount(d.mileage) != null ? { label: "Miltal", value: `${parseAmount(d.mileage).toLocaleString("sv-SE")} mil` } : null,
    isLeasing
      ? { label: "Räknas som tillgång", value: "Nej — leasat" }
      : { label: "Värde", value: value != null ? fmtKr(value) : "—", strong: true },
    isLeasing && monthlyCost != null ? { label: "Månadskostnad", value: `${fmtKr(monthlyCost)}/mån` } : null,
    !isLeasing && parseAmount(d.purchasePrice) != null ? { label: "Inköpspris", value: fmtKr(parseAmount(d.purchasePrice)) } : null,
    loan != null ? { label: "Billån", value: `−${fmtKr(loan)}${d.lender.trim() ? ` · ${d.lender.trim()}` : ""}`, negative: true } : null,
    loanShare != null ? { label: "Lån / värde", value: `${loanShare.toFixed(0)}%` } : null,
    equity != null ? { label: "Eget kapital i fordonet", value: fmtKr(equity), strong: true } : null,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", gap: isMobile ? 0 : 32, flexDirection: isMobile ? "column" : "row" }}>
      <StepNav steps={STEPS} step={step} onJump={setStep} isMobile={isMobile} />

      <div style={{ flex: 1, maxWidth: 640 }}>
        <button onClick={onBack}
          style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
          ‹ Tillbaka
        </button>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Lägg till fordon</h1>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Field label="Vad ska vi kalla fordonet?">
              <input value={d.name} onChange={set("name")} placeholder="T.ex. Volvo V60" autoFocus style={inputStyle} />
            </Field>
            <Field label="Typ">
              <ChipSelect options={VEHICLE_TYPES} value={d.vehicleType} onChange={v => setD({ ...d, vehicleType: v })} />
            </Field>
            <Field label="Hur är fordonet finansierat?">
              <ChipSelect options={FINANCING_OPTIONS} value={d.financing} onChange={v => setD({ ...d, financing: v })} />
            </Field>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Field label="Regnummer" optional>
                <input value={d.regNumber} onChange={set("regNumber")} placeholder="ABC123" style={{ ...inputStyle, width: 120 }} />
              </Field>
              <Field label="Årsmodell" optional>
                <input value={d.modelYear} onChange={set("modelYear")} placeholder="t.ex. 2019" inputMode="numeric" style={{ ...inputStyle, width: 120 }} />
              </Field>
              <Field label="Miltal" optional>
                <input value={d.mileage} onChange={set("mileage")} placeholder="mil" inputMode="numeric" style={{ ...inputStyle, width: 120 }} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && isLeasing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
              ⓘ Vid leasing äger du inte fordonet — det räknas varken som tillgång eller skuld i din nettoförmögenhet.
              Vi sparar det ändå (med värde 0 kr) så att hela din ekonomi finns samlad på ett ställe.
            </div>
            <Field label="Månadskostnad" optional>
              <input value={d.monthlyCost} onChange={set("monthlyCost")} placeholder="kr/mån" inputMode="numeric" autoFocus style={{ ...inputStyle, width: 180 }} />
            </Field>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              Tips: lägg även månadskostnaden som utgift under Mål → Kassaflöde så räknas den in i ditt sparutrymme.
            </div>
          </div>
        )}

        {step === 1 && !isLeasing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Field label="Vad är fordonet värt idag?">
              <input value={d.value} onChange={set("value")} placeholder="Uppskattat andrahandsvärde, kr" inputMode="numeric" autoFocus style={inputStyle} />
            </Field>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
              ⓘ Osäker på värdet? <a href="https://www.blocket.se/bilvardering" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>Värdera bilen på Blocket ↗</a> eller
              jämför liknande annonser — fyll sedan i själv.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <Field label="Inköpspris" optional>
                <input value={d.purchasePrice} onChange={set("purchasePrice")} placeholder="Vad du betalade, kr" inputMode="numeric" style={inputStyle} />
              </Field>
              <Field label="Köpdatum" optional>
                <input type="date" value={d.purchaseDate} onChange={set("purchaseDate")} style={{ ...inputStyle, width: 160 }} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && isLeasing && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
            ⓘ Leasing — inget lån läggs in eftersom fordonet inte är din tillgång.
            {monthlyCost != null && <> Månadskostnaden ({fmtKr(monthlyCost)}/mån) sparas som info på fordonet.</>}
          </div>
        )}

        {step === 2 && d.financing === "kontant" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Kontantköp — inget lån läggs in. Hela värdet räknas som ditt eget kapital.
            </div>
            {value != null && (
              <div style={{ maxWidth: 260, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Eget kapital</div>
                <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{fmtKr(value)}</div>
              </div>
            )}
          </div>
        )}

        {step === 2 && hasLoan && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Billånet läggs automatiskt in som skuld och dras av från din nettoförmögenhet.
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Field label="Kvarvarande billån" optional>
                <input value={d.loanAmount} onChange={set("loanAmount")} placeholder="kr" inputMode="numeric" autoFocus style={{ ...inputStyle, width: 180 }} />
              </Field>
              <Field label="Långivare" optional>
                <input value={d.lender} onChange={set("lender")} placeholder="T.ex. Volvofinans" style={{ ...inputStyle, width: 160 }} />
              </Field>
              <Field label="Ränta" optional>
                <input value={d.interestRate} onChange={set("interestRate")} placeholder="%" inputMode="decimal" style={{ ...inputStyle, width: 80 }} />
              </Field>
            </div>

            {(loanShare != null || equity != null) && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {loanShare != null && (
                  <div style={{ flex: 1, minWidth: 150, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Lån / värde</div>
                    <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: loanShare > 100 ? "#f23645" : loanShare > 70 ? "#ff9800" : "#089981" }}>{loanShare.toFixed(0)}%</div>
                    {loanShare > 100 && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                        Lånet är större än fordonets värde.
                      </div>
                    )}
                  </div>
                )}
                {equity != null && (
                  <div style={{ flex: 1, minWidth: 150, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Eget kapital</div>
                    <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: equity < 0 ? "#f23645" : "var(--text)" }}>{fmtKr(equity)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
              {summaryRows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: i < summaryRows.length - 1 ? "1px solid var(--border-light)" : "none", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ ...mono, color: r.negative ? "#f23645" : "var(--text)", fontWeight: r.strong ? 600 : 400 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
              {isLeasing
                ? "Fordonet sparas i Min ekonomi med värde 0 kr — leasat fordon räknas inte in i nettoförmögenheten."
                : `Fordonet läggs till som tillgång${loan != null && loan > 0 ? " och billånet som skuld" : ""} i Min ekonomi. Uppdatera värdet då och då — fordon tappar värde över tid.`}
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
          saveLabel="Spara fordonet"
        />
      </div>
    </div>
  );
}
