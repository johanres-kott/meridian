import { useState } from "react";
import { useUser } from "../contexts/UserContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

// Mål & kassaflöde (DESIGN.md): Finarys Budget-mönster (Pengar in / ut /
// Sparutrymme) fast med manuellt inmatad lön och utgifter — ingen bankkoppling.
// Sparmål med progress; "klart om X mån" är ett räkneexempel på användarens
// egna siffror, aldrig en prognos vi hittar på.

const GOAL_ICONS = ["🛟", "🏠", "🏝️", "🚗", "🎓", "💍", "🛥️", "🎁"];

function parseAmount(v) {
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

function fmtKr(v) {
  return `${v.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
}

// ── Kassaflödesrader (inkomster/utgifter) ────────────────────────────────────

function FlowColumn({ title, rows, onAdd, onRemove, placeholder }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  function save() {
    const parsed = parseAmount(amount);
    if (!label.trim() || parsed == null) return;
    onAdd({ id: newId(), label: label.trim(), amount: parsed });
    setLabel("");
    setAmount("");
    setAdding(false);
  }

  const inputStyle = { fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" };

  return (
    <div style={{ flex: 1, minWidth: 260, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 && !adding && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Inget inlagt ännu</div>
      )}
      {rows.map(r => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)", fontSize: 12 }}>
          <span style={{ color: "var(--text)", flex: 1 }}>{r.label}</span>
          <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(r.amount)}/mån</span>
          <button onClick={() => onRemove(r.id)} title="Ta bort"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={placeholder} autoFocus style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="kr/mån" inputMode="numeric" style={{ ...inputStyle, width: 90 }}
            onKeyDown={e => { if (e.key === "Enter") save(); }} />
          <button onClick={save} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 4, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Spara</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          + Lägg till
        </button>
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
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{goal.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", flex: 1 }}>{goal.name}</span>
        <button onClick={onRemove} title="Ta bort mål"
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>×</button>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--border-light)", overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct >= 100 ? "#089981" : "var(--accent)", transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12 }}>
        <span style={{ ...mono, color: "var(--text)" }}>
          {fmtKr(goal.saved)} <span style={{ color: "var(--text-secondary)" }}>/ {fmtKr(goal.target)}</span>
        </span>
        <span style={{ ...mono, color: pct >= 100 ? "#089981" : "var(--text-secondary)" }}>{Math.round(pct)}%</span>
      </div>
      {pct >= 100 ? (
        <div style={{ fontSize: 11, color: "#089981", fontWeight: 600, marginTop: 6 }}>Mål uppnått 🎉</div>
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
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
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
        {GOAL_ICONS.map(i => (
          <button key={i} onClick={() => setIcon(i)}
            style={{
              fontSize: 16, padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${icon === i ? "var(--accent)" : "var(--border)"}`,
              background: icon === i ? "var(--accent-light)" : "var(--bg-card)",
            }}>
            {i}
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

  const cashflow = preferences.cashflow || { incomes: [], expenses: [] };
  const goals = preferences.savingsGoals || [];

  const totalIn = cashflow.incomes.reduce((s, r) => s + r.amount, 0);
  const totalOut = cashflow.expenses.reduce((s, r) => s + r.amount, 0);
  const available = totalIn - totalOut;
  const savingsRate = totalIn > 0 ? (available / totalIn) * 100 : null;
  const hasFlow = cashflow.incomes.length > 0 || cashflow.expenses.length > 0;

  function setCashflow(next) {
    updatePreferences({ cashflow: next });
  }
  function setGoals(next) {
    updatePreferences({ savingsGoals: next });
  }

  const statCard = (label, value, color) => (
    <div style={{ flex: 1, minWidth: 140, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: color || "var(--text)" }}>{value}</div>
    </div>
  );

  return (
    <div>
      {/* ── Kassaflöde ── */}
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Kassaflöde</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
        Mata in lön och fasta utgifter per månad, så ser du ditt sparutrymme. Siffrorna är dina egna — vi kopplar inte till banken.
      </div>

      <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap", marginBottom: 14 }}>
        {statCard("Pengar in", hasFlow ? fmtKr(totalIn) : "—")}
        {statCard("Pengar ut", hasFlow ? fmtKr(totalOut) : "—")}
        {statCard("Sparutrymme", hasFlow ? `${fmtKr(available)}/mån` : "—", available >= 0 ? "#089981" : "#f23645")}
        {savingsRate != null && statCard("Sparkvot", `${savingsRate.toFixed(0)}%`, savingsRate >= 0 ? "#089981" : "#f23645")}
      </div>

      <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap", marginBottom: 32 }}>
        <FlowColumn
          title="Inkomster"
          rows={cashflow.incomes}
          placeholder="T.ex. Lön efter skatt"
          onAdd={row => setCashflow({ ...cashflow, incomes: [...cashflow.incomes, row] })}
          onRemove={id => setCashflow({ ...cashflow, incomes: cashflow.incomes.filter(r => r.id !== id) })}
        />
        <FlowColumn
          title="Utgifter"
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
