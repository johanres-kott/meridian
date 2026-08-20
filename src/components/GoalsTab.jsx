import { useState } from "react";
import { useUser } from "../contexts/UserContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { GOAL_ICONS, Target } from "./icons.jsx";
import { PERIODS, PERIOD_BY_ID, monthlyAmount, loanInterestMonthly } from "./cashflowPeriods.js";
import useNetWorth from "../hooks/useNetWorth.js";
import { EXPENSE_CATEGORIES, CAT_BY_ID, isSaving } from "./cashflowCategories.js";
import CashflowSankey from "./CashflowSankey.jsx";

// Mål & kassaflöde (DESIGN.md): Finarys Budget-mönster (Pengar in / ut /
// Sparutrymme) fast med manuellt inmatad lön och utgifter — ingen bankkoppling.
// Sparmål med progress; "klart om X mån" är ett räkneexempel på användarens
// egna siffror, aldrig en prognos vi hittar på.

// Legacy: mål sparade med emoji mappas till Lucide-ikon-id
const LEGACY_EMOJI = { "🛟": "buffert", "🏠": "bostad", "🏝️": "resa", "🚗": "bil", "🎓": "studier", "💍": "brollop", "🛥️": "bat", "🎁": "present" };
function GoalIcon({ icon, size = 20 }) {
  const id = LEGACY_EMOJI[icon] || icon;
  const def = GOAL_ICONS.find(g => g.id === id);
  const Icon = def?.Icon || Target;
  return <Icon size={size} strokeWidth={1.5} aria-hidden />;
}

function parseAmount(v) {
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function fmtRowAmount(row, loans) {
  const m = monthlyAmount(row, loans);
  if (row.loanId || !row.period || row.period === "month") return `${fmtKr(m)}/mån`;
  return `${fmtKr(m)}/mån (${fmtKr(row.amount)}/${PERIOD_BY_ID[row.period]?.label})`;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const mono = { fontFamily: "var(--font-mono)" };

function fmtKr(v) {
  return `${v.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
}

// ── Kassaflödesrader (inkomster/utgifter) ────────────────────────────────────

const INCOME_TYPES = [
  { id: "lon",      label: "Lön efter skatt" },
  { id: "partner",  label: "Partners lön" },
  { id: "bidrag",   label: "Bidrag (barn-, bostads-)" },
  { id: "hyra",     label: "Hyresintäkt" },
  { id: "utdelning",label: "Utdelning / ränta" },
  { id: "ovrigt",   label: "Övrig inkomst" },
];

// "Måste-ha"-utgifter — det man har som människa. Klick = ny rad med namn +
// kategori förifyllt, användaren fyller bara i beloppet.
const EXPENSE_PRESETS = [
  { label: "Hyra / avgift",       category: "boende" },
  { label: "Bolåneränta",         category: "lan", loanKind: "bolan" },
  { label: "Amortering",          category: "amortering" },
  { label: "El & elnät",         category: "boende" },
  { label: "Värme / fjärrvärme",  category: "boende" },
  { label: "Vatten & avlopp",     category: "boende" },
  { label: "Hemförsäkring",       category: "forsakring", period: "year" },
  { label: "Bilförsäkring",       category: "forsakring", period: "year" },
  { label: "Mat",                 category: "mat" },
  { label: "Mobil",               category: "abonnemang" },
  { label: "Bredband",            category: "abonnemang" },
  { label: "Streaming",           category: "abonnemang" },
  { label: "Kollektivtrafik",     category: "transport" },
  { label: "Bensin / laddning",   category: "transport" },
  { label: "Billån / leasing",    category: "lan", loanKind: "skuld" },
  { label: "Förskola / fritids",  category: "barn" },
  { label: "CSN",                 category: "lan" },
  { label: "Gym",                 category: "abonnemang" },
  { label: "Fordonsskatt",        category: "transport",  period: "year" },
  { label: "Semester / resa",     category: "ovrigt",     period: "year" },
];

function FlowColumn({ title, rows, onAdd, onRemove, placeholder, withCategory = false, withIncomeType = false, presets = [], accent, loans = [] }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("boende");
  const [incomeType, setIncomeType] = useState("lon");
  const [period, setPeriod] = useState("month");
  const [loanId, setLoanId] = useState("");   // utgift kopplad till ett inmatat lån → ränta/amortering räknas ut
  const [loanMode, setLoanMode] = useState("ranta"); // "ranta" | "amortering"
  const [rate, setRate] = useState("");
  const [error, setError] = useState(null);
  const loansById = Object.fromEntries(loans.map(l => [l.id, l]));
  const linkedLoan = loanId ? loansById[loanId] : null;
  const linkedMonthly = linkedLoan ? loanInterestMonthly(linkedLoan.value_sek, parseAmount(rate)) : null;

  // Välj lån: namn + kategori sätts från lånet och läget (ränta/amortering);
  // procenten förifylls från wizarden om den finns. Båda räknas som
  // skuld × procent / 12 och följer lånets aktuella saldo.
  function applyLoanMode(loan, mode) {
    setLoanMode(mode);
    setPeriod("month");
    const short = loan.label.replace(/^(Bolån|Billån) · /, "");
    if (mode === "amortering") {
      setLabel(`Amortering · ${short}`);
      setCategory("amortering");
      const known = loan.metadata?.amortizationRate;
      setRate(known != null ? String(known).replace(".", ",") : "");
    } else {
      setLabel(`Ränta · ${short}`);
      setCategory("lan");
      const known = loan.metadata?.interestRate;
      setRate(known != null ? String(known).replace(".", ",") : "");
    }
  }
  function pickLoan(id, mode) {
    const loan = loansById[id];
    if (!loan) return;
    setLoanId(id);
    const used = usedLoanModes.get(id) || new Set();
    applyLoanMode(loan, mode || (used.has("ranta") ? "amortering" : "ranta"));
  }

  function save() {
    if (linkedLoan) {
      const r = parseAmount(rate);
      if (r == null || r <= 0) { setError(loanMode === "amortering" ? "Fyll i amorteringen i procent per år." : "Fyll i räntan i procent."); return; }
      setError(null);
      const isAmort = loanMode === "amortering";
      onAdd({
        id: newId(), label: label.trim() || `${isAmort ? "Amortering" : "Ränta"} · ${linkedLoan.label}`,
        category: isAmort ? "amortering" : "lan", period: "month",
        loanId: linkedLoan.id, rate: r, amount: loanInterestMonthly(linkedLoan.value_sek, r),
      });
      reset(); setAdding(false);
      return;
    }
    const parsed = parseAmount(amount);
    // Inkomst: typens etikett duger som namn om fältet lämnats tomt
    const typeLabel = withIncomeType && incomeType !== "ovrigt" ? (INCOME_TYPES.find(t => t.id === incomeType)?.label || "") : "";
    const finalLabel = (typeLabel || label.trim()).trim();
    if (!finalLabel) { setError(withIncomeType ? "Skriv vad det är för inkomst." : "Skriv ett namn på posten."); return; }
    if (parsed == null) { setError(`Fyll i ett belopp i kr per ${PERIOD_BY_ID[period]?.label || "månad"}.`); return; }
    setError(null);
    onAdd({
      id: newId(), label: finalLabel, amount: parsed, period,
      ...(withCategory ? { category } : {}),
      ...(withIncomeType ? { incomeType } : {}),
    });
    reset();
    setAdding(false);
  }
  function reset() { setLabel(""); setAmount(""); setPeriod("month"); setLoanId(""); setLoanMode("ranta"); setRate(""); }
  function cancel() { setAdding(false); setError(null); reset(); }

  // Snabbval: förifyll namn + kategori, öppna formuläret med fokus på beloppet.
  // "Bolåneränta" med ett inmatat bolån → koppla direkt till lånet.
  function pickPreset(preset) {
    setAdding(true);
    if (preset.loanKind) {
      const loan = loans.find(l => l.kind === preset.loanKind) || loans[0];
      if (loan) { pickLoan(loan.id); return; }
    }
    setLabel(preset.label);
    setCategory(preset.category);
    setPeriod(preset.period || "month");
  }
  const usedLabels = new Set(rows.map(r => r.label.toLowerCase()));
  const linkedLoanIds = new Set(rows.map(r => r.loanId).filter(Boolean));
  // Vilka lägen (ränta/amortering) är redan använda per lån? Ett lån kan ha
  // en rad av varje sort, men aldrig två av samma.
  const usedLoanModes = new Map();
  for (const r of rows) {
    if (!r.loanId) continue;
    if (!usedLoanModes.has(r.loanId)) usedLoanModes.set(r.loanId, new Set());
    usedLoanModes.get(r.loanId).add(r.category === "amortering" ? "amortering" : "ranta");
  }
  const unusedPresets = presets.filter(p => !usedLabels.has(p.label.toLowerCase()) && !(p.loanKind && loans.some(l => l.kind === p.loanKind && linkedLoanIds.has(l.id))));
  const linkableLoans = loans.filter(l => (usedLoanModes.get(l.id)?.size ?? 0) < 2);

  const total = rows.filter(r => !isSaving(r)).reduce((s, r) => s + monthlyAmount(r, loansById), 0);
  const savingPart = rows.filter(isSaving).reduce((s, r) => s + monthlyAmount(r, loansById), 0);
  const inputStyle = { fontSize: 12, padding: "7px 9px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" };

  return (
    <div style={{ flex: 1, minWidth: 280, background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</span>
        <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: accent || "var(--text)", textAlign: "right" }}>
          {rows.length ? `${fmtKr(total)}/mån` : "—"}
          {savingPart > 0 && <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--pos)" }}>+ {fmtKr(savingPart)} amortering</div>}
        </span>
      </div>
      <div style={{ padding: "6px 16px 12px" }}>
        {rows.length === 0 && !adding && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>Inget inlagt ännu</div>
        )}
        {rows.map(r => {
          const cat = withCategory ? (CAT_BY_ID[r.category] || CAT_BY_ID.ovrigt) : null;
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border-light)", fontSize: 12 }}>
              {cat && <span title={cat.label} style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />}
              <span style={{ color: "var(--text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              {r.loanId && (
                <span title={loansById[r.loanId] ? `${fmtKr(Number(loansById[r.loanId].value_sek))} × ${r.rate} % — följer lånet` : "Lånet är borttaget — visar senast sparade belopp"}
                  style={{ fontSize: 10, color: loansById[r.loanId] ? "var(--brand)" : "var(--text-muted)", flexShrink: 0 }}>
                  {loansById[r.loanId] ? `${String(r.rate).replace(".", ",")} %` : "lån saknas"}
                </span>
              )}
              {cat && <span style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: 999, padding: "1px 7px", flexShrink: 0 }}>{cat.label}</span>}
              <span style={{ ...mono, color: "var(--text)", flexShrink: 0, fontSize: 11.5 }}>{fmtRowAmount(r, loansById)}</span>
              <button onClick={() => onRemove(r.id)} title="Ta bort"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
            </div>
          );
        })}
        {adding ? (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {withCategory && linkableLoans.length > 0 && (
              <select value={loanId} onChange={e => e.target.value ? pickLoan(e.target.value) : reset()} title="Koppla till ett lån du lagt in" style={{ ...inputStyle, width: "100%" }}>
                <option value="">Koppla till lån… (ränta eller amortering räknas ut)</option>
                {linkableLoans.map(l => <option key={l.id} value={l.id}>{l.label} — {fmtKr(Number(l.value_sek))}</option>)}
              </select>
            )}
            {linkedLoan ? (
              <>
                <div style={{ display: "flex", gap: 4, width: "100%" }}>
                  {["ranta", "amortering"].map(m => {
                    const usedHere = (usedLoanModes.get(linkedLoan.id) || new Set()).has(m);
                    const active = loanMode === m;
                    return (
                      <button key={m} onClick={() => { if (!usedHere) applyLoanMode(linkedLoan, m); }} disabled={usedHere}
                        title={usedHere ? "Lånet har redan en sådan rad" : undefined} aria-pressed={active}
                        style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 999, border: "1px solid var(--border)", background: active ? "var(--accent)" : "var(--bg-card)", color: active ? "#fff" : usedHere ? "var(--text-muted)" : "var(--text-secondary)", cursor: usedHere ? "default" : "pointer", fontFamily: "inherit" }}>
                        {m === "ranta" ? "Ränta" : "Amortering"}
                      </button>
                    );
                  })}
                </div>
                <input value={label} onChange={e => setLabel(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
                <input value={rate} onChange={e => setRate(e.target.value)} placeholder={loanMode === "amortering" ? "% per år" : "ränta %"} inputMode="decimal" autoFocus style={{ ...inputStyle, width: 80 }}
                  onKeyDown={e => { if (e.key === "Enter") save(); }} />
                <span style={{ ...mono, fontSize: 12, color: "var(--text)", alignSelf: "center", whiteSpace: "nowrap" }}>
                  {linkedMonthly != null ? `= ${fmtKr(linkedMonthly)}/mån` : "= — kr/mån"}
                </span>
              </>
            ) : null}
            {!linkedLoan && withIncomeType && (
              <select value={incomeType} onChange={e => { setIncomeType(e.target.value); setLabel(""); }} style={inputStyle}>
                {INCOME_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            )}
            {!linkedLoan && (!withIncomeType || incomeType === "ovrigt") && (
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder={withIncomeType ? "Vad för inkomst?" : placeholder} autoFocus={!label && !withIncomeType} onKeyDown={e => { if (e.key === "Enter") save(); }} style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
            )}
            {!linkedLoan && withCategory && (
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            )}
            {!linkedLoan && (
              <>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={`kr/${PERIOD_BY_ID[period]?.label || "mån"}`} inputMode="numeric" autoFocus={!!label || (withIncomeType && incomeType !== "ovrigt")} style={{ ...inputStyle, width: 90 }}
                  onKeyDown={e => { if (e.key === "Enter") save(); }} />
                <select value={period} onChange={e => setPeriod(e.target.value)} title="Period" style={inputStyle}>
                  {PERIODS.map(p => <option key={p.id} value={p.id}>per {p.label}</option>)}
                </select>
              </>
            )}
            <button onClick={save} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 16, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Spara</button>
            <button onClick={cancel} style={{ fontSize: 12, padding: "7px 10px", borderRadius: 16, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
            {error && <div style={{ width: "100%", fontSize: 11.5, color: "var(--neg)", marginTop: 2 }}>{error}</div>}
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            + Lägg till
          </button>
        )}
        {unusedPresets.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Vanliga poster — klicka för att lägga till</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {unusedPresets.map(p => {
                const cat = CAT_BY_ID[p.category];
                return (
                  <button key={p.label} onClick={() => pickPreset(p)}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat?.color || "#78909c" }} />
                    + {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fördelning av utgifter per kategori (Finarys "Distribution") + flödesstapel lön → utgifter → sparande
function CashflowDistribution({ incomes, expenses, available, amortization = 0, isMobile, loans }) {
  const totalIn = incomes.reduce((s, r) => s + monthlyAmount(r, loans), 0);
  const totalOut = expenses.reduce((s, r) => s + monthlyAmount(r, loans), 0);
  if (totalIn === 0 && totalOut === 0) return null;

  const byCat = {};
  for (const e of expenses) {
    if (isSaving(e)) continue; // amortering ritas som sparande, inte som utgift
    const id = CAT_BY_ID[e.category] ? e.category : "ovrigt";
    byCat[id] = (byCat[id] || 0) + monthlyAmount(e, loans);
  }
  const cats = EXPENSE_CATEGORIES.filter(c => byCat[c.id] > 0).map(c => ({ ...c, amount: byCat[c.id] }))
    .sort((a, b) => b.amount - a.amount);
  const base = Math.max(totalIn, totalOut);
  const amortPct = base > 0 && amortization > 0 ? (amortization / base) * 100 : 0;
  const amortPattern = "repeating-linear-gradient(45deg, var(--pos), var(--pos) 3px, var(--green-200) 3px, var(--green-200) 6px)";
  const savingsPct = base > 0 && available > 0 ? (available / base) * 100 : 0;
  const overspendPct = base > 0 && available < 0 ? (-available / base) * 100 : 0;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: isMobile ? "14px 16px" : "16px 20px", marginBottom: isMobile ? 10 : 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>Vart tar lönen vägen?</div>
      {/* Desktop: flödesgraf (Finary-Sankey). Mobil: kompakt stapel + legend. */}
      {!isMobile && <CashflowSankey incomes={incomes} expenses={expenses} loans={loans} />}
      {isMobile && <>
      {/* Flödesstapel */}
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "var(--border-light)" }}>
        {cats.map(c => (
          <div key={c.id} title={`${c.label}: ${fmtKr(c.amount)}`} style={{ width: `${base > 0 ? (c.amount / base) * 100 : 0}%`, background: c.color }} />
        ))}
        {amortPct > 0 && <div title={`Amortering: ${fmtKr(amortization)} — minskar lånet`} style={{ width: `${amortPct}%`, background: amortPattern }} />}
        {savingsPct > 0 && <div title={`Sparutrymme: ${fmtKr(available)}`} style={{ width: `${savingsPct}%`, background: "var(--pos)" }} />}
        {overspendPct > 0 && <div title={`Underskott: ${fmtKr(-available)}`} style={{ width: `${overspendPct}%`, background: "repeating-linear-gradient(45deg,var(--neg),var(--neg) 4px,transparent 4px,transparent 8px)" }} />}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
        {cats.map(c => (
          <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
            {c.label} <span style={{ ...mono, color: "var(--text)" }}>{base > 0 ? Math.round((c.amount / base) * 100) : 0}%</span>
          </span>
        ))}
        {amortPct > 0 && (
          <span title="Amortering minskar lånet och bygger din nettoförmögenhet — vi räknar den som sparande" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: amortPattern }} />
            Amortering <span style={{ ...mono, color: "var(--pos)", fontWeight: 600 }}>{Math.round(amortPct)}%</span>
          </span>
        )}
        {available > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--pos)" }} />
            Sparutrymme <span style={{ ...mono, color: "var(--pos)", fontWeight: 600 }}>{Math.round(savingsPct)}%</span>
          </span>
        )}
      </div>
      </>}
      {available < 0 && (
        <div style={{ fontSize: 11, color: "var(--neg)", fontWeight: 600, marginTop: 8 }}>Utgifterna överstiger inkomsterna med {fmtKr(-available)}/mån</div>
      )}
    </div>
  );
}

// ── Sparmål ──────────────────────────────────────────────────────────────────

function GoalCard({ goal, monthlySavings, onUpdateSaved, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [savedInput, setSavedInput] = useState("");
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const remaining = Math.max(0, goal.target - goal.saved);
  const monthsLeft = monthlySavings > 0 && remaining > 0 ? Math.ceil(remaining / monthlySavings) : null;

  function saveEdit() {
    const parsed = parseAmount(savedInput);
    if (parsed == null) return;
    onUpdateSaved(parsed);
    setEditing(false);
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--brand-tint)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><GoalIcon icon={goal.icon} size={18} /></span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", flex: 1 }}>{goal.name}</span>
        <button onClick={onRemove} title="Ta bort mål"
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>×</button>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--border-light)", overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct >= 100 ? "var(--pos)" : "var(--accent)", transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12 }}>
        <span style={{ ...mono, color: "var(--text)" }}>
          {fmtKr(goal.saved)} <span style={{ color: "var(--text-secondary)" }}>/ {fmtKr(goal.target)}</span>
        </span>
        <span style={{ ...mono, color: pct >= 100 ? "var(--pos)" : "var(--text-secondary)" }}>{Math.round(pct)}%</span>
      </div>
      {pct >= 100 ? (
        <div style={{ fontSize: 11, color: "var(--pos)", fontWeight: 600, marginTop: 6 }}>Mål uppnått</div>
      ) : monthsLeft != null && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
          ≈ {monthsLeft} {monthsLeft === 1 ? "månad" : "månader"} kvar med {fmtKr(monthlySavings)}/mån i sparutrymme
          <span style={{ color: "var(--text-muted)" }}> · räkneexempel</span>
        </div>
      )}
      {editing ? (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input value={savedInput} onChange={e => setSavedInput(e.target.value)} placeholder="Sparat hittills, kr" inputMode="numeric" autoFocus
            onKeyDown={e => { if (e.key === "Enter") saveEdit(); }}
            style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }} />
          <button onClick={saveEdit} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 4, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>OK</button>
        </div>
      ) : (
        <button onClick={() => { setSavedInput(String(goal.saved)); setEditing(true); }}
          style={{ marginTop: 10, fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          Uppdatera sparat belopp
        </button>
      )}
    </div>
  );
}

function NewGoalCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(GOAL_ICONS[0].id);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");

  function save() {
    const parsedTarget = parseAmount(target);
    const parsedSaved = parseAmount(saved) ?? 0;
    if (!name.trim() || parsedTarget == null || parsedTarget <= 0) return;
    onAdd({ id: newId(), name: name.trim(), icon, target: parsedTarget, saved: parsedSaved, createdAt: new Date().toISOString() });
    setName(""); setTarget(""); setSaved(""); setOpen(false);
  }

  const inputStyle = { fontSize: 12, padding: "8px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit", width: "100%" };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{
          minHeight: 120, border: "1px dashed var(--border)", borderRadius: 10, background: "none",
          color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>
        + Nytt sparmål
      </button>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {GOAL_ICONS.map(g => (
          <button key={g.id} onClick={() => setIcon(g.id)} title={g.label}
            style={{
              width: 36, height: 36, padding: 0, borderRadius: "50%", cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${icon === g.id ? "var(--brand)" : "var(--border)"}`,
              background: icon === g.id ? "var(--brand-tint)" : "var(--bg-card)",
              color: icon === g.id ? "var(--brand)" : "var(--text-secondary)",
            }}>
            <g.Icon size={16} strokeWidth={1.5} aria-hidden />
          </button>
        ))}
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Vad sparar du till? (t.ex. Kontantinsats)" autoFocus style={inputStyle} />
      <div style={{ display: "flex", gap: 8 }}>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Målbelopp, kr" inputMode="numeric" style={inputStyle} />
        <input value={saved} onChange={e => setSaved(e.target.value)} placeholder="Sparat hittills, kr" inputMode="numeric" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} style={{ fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 16, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Skapa mål</button>
        <button onClick={() => setOpen(false)} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 16, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
      </div>
    </div>
  );
}

// ── Huvudvyn ─────────────────────────────────────────────────────────────────

export default function GoalsTab() {
  const { preferences, updatePreferences } = useUser();
  const isMobile = useIsMobile();
  const { debts } = useNetWorth(); // inmatade lån (bolån, billån…) — utgifter kan kopplas till dem
  const loansById = Object.fromEntries(debts.map(l => [l.id, l]));

  const rawCashflow = preferences.cashflow || { incomes: [], expenses: [] };
  // Rader inlagda innan amortering blev egen kategori (preset låg under "Lån") → läs som amortering
  const cashflow = {
    ...rawCashflow,
    expenses: (rawCashflow.expenses || []).map(r => r.category === "lan" && /amorter/i.test(r.label || "") ? { ...r, category: "amortering" } : r),
  };
  const goals = preferences.savingsGoals || [];

  const totalIn = cashflow.incomes.reduce((s, r) => s + monthlyAmount(r, loansById), 0);
  const amortization = cashflow.expenses.filter(isSaving).reduce((s, r) => s + monthlyAmount(r, loansById), 0);
  const totalOut = cashflow.expenses.filter(r => !isSaving(r)).reduce((s, r) => s + monthlyAmount(r, loansById), 0); // konsumtion
  const available = totalIn - totalOut - amortization; // fritt sparutrymme (till sparmålen)
  const totalSaving = available + amortization;        // sparande inkl. amortering → sparkvot
  const savingsRate = totalIn > 0 ? (totalSaving / totalIn) * 100 : null;
  const hasFlow = cashflow.incomes.length > 0 || cashflow.expenses.length > 0;

  function setCashflow(next) {
    updatePreferences({ cashflow: next });
  }
  function setGoals(next) {
    updatePreferences({ savingsGoals: next });
  }

  const statCard = (label, value, color, sub) => (
    <div style={{ flex: 1, minWidth: 140, background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: "14px 18px" }}>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: color || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: color || "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* ── Kassaflöde ── */}
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Kassaflöde</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
        Mata in alla inkomster (lön, partners lön, bidrag…) och dina fasta utgifter per månad, så ser du ditt sparutrymme. Räntor kan kopplas till lån du lagt in under Min ekonomi och följer då skulden automatiskt. Amortering räknas som sparande — den minskar lånet och bygger din nettoförmögenhet. Siffrorna är dina egna — vi kopplar inte till banken.
      </div>

      <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap", marginBottom: 14 }}>
        {statCard("Pengar in", hasFlow ? fmtKr(totalIn) : "—")}
        {statCard("Pengar ut", hasFlow ? fmtKr(totalOut) : "—", null, amortization > 0 ? "exkl. amortering" : null)}
        {amortization > 0 && statCard("Amortering", `${fmtKr(amortization)}/mån`, "var(--pos)", "minskar lånet — räknas som sparande")}
        {statCard("Sparutrymme", hasFlow ? `${fmtKr(available)}/mån` : "—", available >= 0 ? "var(--pos)" : "var(--neg)", savingsRate != null ? `${savingsRate.toFixed(0)} % sparkvot${amortization > 0 ? " inkl. amortering" : ""}` : null)}
      </div>

      <CashflowDistribution incomes={cashflow.incomes} expenses={cashflow.expenses} available={available} amortization={amortization} isMobile={isMobile} loans={loansById} />

      <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap", marginBottom: 32 }}>
        <FlowColumn
          title="Pengar in"
          accent="var(--pos)"
          withIncomeType
          rows={cashflow.incomes}
          placeholder="T.ex. Lön efter skatt"
          onAdd={row => setCashflow({ ...cashflow, incomes: [...cashflow.incomes, row] })}
          onRemove={id => setCashflow({ ...cashflow, incomes: cashflow.incomes.filter(r => r.id !== id) })}
        />
        <FlowColumn
          title="Pengar ut"
          accent="var(--neg)"
          withCategory
          presets={EXPENSE_PRESETS}
          loans={debts}
          rows={cashflow.expenses}
          placeholder="T.ex. Hyra, bolåneränta, mat"
          onAdd={row => setCashflow({ ...cashflow, expenses: [...cashflow.expenses, row] })}
          onRemove={id => setCashflow({ ...cashflow, expenses: cashflow.expenses.filter(r => r.id !== id) })}
        />
      </div>

      {/* ── Sparmål ── */}
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Sparmål</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
        Spara till saker — buffert först, sedan det roliga. Uppdatera sparat belopp när du satt in pengar.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: isMobile ? 10 : 14 }}>
        {goals.map(g => (
          <GoalCard
            key={g.id}
            goal={g}
            monthlySavings={available > 0 ? available : 0}
            onUpdateSaved={saved => setGoals(goals.map(x => x.id === g.id ? { ...x, saved } : x))}
            onRemove={() => setGoals(goals.filter(x => x.id !== g.id))}
          />
        ))}
        <NewGoalCard onAdd={g => setGoals([...goals, g])} />
      </div>
    </div>
  );
}
