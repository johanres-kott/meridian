import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { updateManualAsset, deleteManualAsset } from "../lib/manualAssets.js";
import { IconBadge } from "./icons.jsx";
import { KIND_COLORS } from "./iconMaps.js";
import { KIND_LABELS, VALUE_LABELS, FIELDS_BY_KIND, formatFieldValue, parseFieldInput, fieldToInput } from "./assetFields.js";
import { summarizeTranches, DEFAULT_LOCK_YEARS } from "./addassets/vinstandel.js";

// Tillgångssida för manuella tillgångar/skulder (hus, fordon, vinstandel,
// konton, lån) — klick på raden i Portfölj/Min ekonomi landar här. Visar all
// sparad data, kopplat lån (bostad/fordon), och låter användaren redigera
// och ta bort. Samma mönster som Finarys asset detail: värde stort överst,
// detaljer i kort, "Redigera" som växlar fälten till inmatning.

const mono = { fontFamily: "var(--font-mono)" };
const fmtKr = v => `${Math.round(Number(v)).toLocaleString("sv-SE")} kr`;

const card = { background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" };
const sectionTitle = { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 };
const inputStyle = { fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit", width: "100%" };
const btn = (primary) => ({
  fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 18, cursor: "pointer", fontFamily: "inherit",
  border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--bg-card)", color: primary ? "#fff" : "var(--text-secondary)",
});

function Row({ label, value, strong, negative }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ ...mono, color: negative ? "var(--neg)" : "var(--text)", fontWeight: strong ? 600 : 400, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ManualAssetView({ row, allRows = [], onBack, onChanged, onOpenRow }) {
  const isMobile = useIsMobile();
  const kind = row.kind;
  const fields = FIELDS_BY_KIND[kind] || [];
  const meta = row.metadata || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => ({
    label: row.label,
    value: String(row.value_sek ?? ""),
    meta: Object.fromEntries(fields.map(f => [f.key, fieldToInput(f, meta[f.key])])),
    tranches: (meta.tranches || []).map(t => ({ year: String(t.year), value: String(t.value) })),
  }));

  // Kopplat lån (bostad/fordon) — lånet pekar på tillgången via metadata.linkedAssetId
  const linkedLoan = allRows.find(r => r.is_debt && r.metadata?.linkedAssetId === row.id) || null;
  // …och omvänt: lån som pekar på en tillgång
  const linkedAsset = row.is_debt && meta.linkedAssetId ? allRows.find(r => r.id === meta.linkedAssetId) : null;

  const value = Number(row.value_sek);
  const loanValue = linkedLoan ? Number(linkedLoan.value_sek) : null;
  const ltv = loanValue != null && value > 0 ? (loanValue / value) * 100 : null;
  const equity = loanValue != null ? value - loanValue : null;

  const isVinstandel = kind === "vinstandel";
  const lockYears = Number(editing ? form.meta.lockYears : meta.lockYears) || DEFAULT_LOCK_YEARS;
  const trancheRows = (editing ? form.tranches : (meta.tranches || []).map(t => ({ year: String(t.year), value: String(t.value) })))
    .map(t => ({ year: parseInt(t.year, 10), value: parseFloat(String(t.value).replace(/\s/g, "").replace(",", ".")) }))
    .filter(t => Number.isFinite(t.year) && Number.isFinite(t.value) && t.value > 0);
  const vSummary = isVinstandel ? summarizeTranches(trancheRows, lockYears, new Date().getFullYear()) : null;

  function startEdit() { setEditing(true); setError(null); }
  function cancelEdit() {
    setEditing(false); setError(null);
    setForm({
      label: row.label, value: String(row.value_sek ?? ""),
      meta: Object.fromEntries(fields.map(f => [f.key, fieldToInput(f, meta[f.key])])),
      tranches: (meta.tranches || []).map(t => ({ year: String(t.year), value: String(t.value) })),
    });
  }

  async function save() {
    if (saving) return;
    const label = form.label.trim();
    if (!label) { setError("Skriv ett namn."); return; }
    let newValue = parseFloat(String(form.value).replace(/\s/g, "").replace(",", "."));
    const newMeta = { ...meta };
    for (const f of fields) newMeta[f.key] = parseFieldInput(f, form.meta[f.key]);
    if (isVinstandel) {
      if (trancheRows.length === 0) { setError("Lägg in minst en årgång med värde."); return; }
      newMeta.tranches = trancheRows;
      newMeta.lockYears = lockYears;
      newValue = vSummary.total; // värdet är alltid summan av årgångarna
    }
    if (!Number.isFinite(newValue) || newValue < 0) { setError("Fyll i ett värde i kronor."); return; }
    setSaving(true); setError(null);
    try {
      await updateManualAsset(row.id, { label, value_sek: newValue, metadata: newMeta });
      setEditing(false);
      onChanged?.();
    } catch (err) {
      console.error("ManualAssetView: update failed:", err);
      setError(err.message || "Kunde inte spara");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      await deleteManualAsset(row.id);
      onChanged?.();
      onBack?.();
    } catch (err) {
      console.error("ManualAssetView: delete failed:", err);
      setError(err.message || "Kunde inte ta bort");
      setSaving(false);
    }
  }

  const detailFields = fields.filter(f => editing || formatFieldValue(f, meta[f.key]) != null);

  return (
    <div style={{ maxWidth: 760 }}>
      <button onClick={onBack}
        style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 14 }}>
        ‹ Tillbaka
      </button>

      {/* Huvud: ikon, namn, typ, värde */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <IconBadge kind={kind} color={KIND_COLORS[kind] || "var(--brand)"} size={44} iconSize={20} />
        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={{ ...inputStyle, fontSize: 18, fontWeight: 600, maxWidth: 420 }} autoFocus />
          ) : (
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>{row.label}</h1>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{KIND_LABELS[kind] || kind}</span>
            {meta.address && !editing && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{meta.address}</span>}
            {meta.regNumber && !editing && <span style={{ ...mono, fontSize: 12, color: "var(--text-secondary)" }}>{String(meta.regNumber).toUpperCase()}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={sectionTitle}>{VALUE_LABELS[kind] || "Värde"}</div>
          {editing && !isVinstandel ? (
            <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} inputMode="numeric" style={{ ...inputStyle, ...mono, fontSize: 18, width: 180, textAlign: "right" }} />
          ) : (
            <div style={{ ...mono, fontSize: isMobile ? 24 : 30, fontWeight: 500, color: row.is_debt ? "var(--neg)" : "var(--text)", fontFamily: "var(--font-display)" }}>
              {row.is_debt ? "−" : ""}{fmtKr(isVinstandel && editing ? vSummary.total : value)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Detaljer */}
        <div style={card}>
          <div style={sectionTitle}>Detaljer</div>
          {detailFields.length === 0 && !editing && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Inga detaljer sparade — klicka Redigera för att lägga till.</div>
          )}
          {detailFields.map(f => editing ? (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
              <label style={{ color: "var(--text-secondary)", flexShrink: 0 }}>{f.label}</label>
              {f.type === "select" ? (
                <select value={form.meta[f.key] || ""} onChange={e => setForm({ ...form, meta: { ...form.meta, [f.key]: e.target.value } })} style={{ ...inputStyle, width: 180 }}>
                  <option value="">—</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type === "date" ? "date" : "text"} value={form.meta[f.key] || ""} aria-label={f.label}
                  onChange={e => setForm({ ...form, meta: { ...form.meta, [f.key]: e.target.value } })}
                  inputMode={["money", "number", "percent", "kr-per-month"].includes(f.type) ? "decimal" : undefined}
                  placeholder={f.unit || (f.type === "money" ? "kr" : f.type === "percent" ? "%" : "")}
                  style={{ ...inputStyle, width: 180, textAlign: f.type === "text" || f.type === "date" ? "left" : "right" }} />
              )}
            </div>
          ) : (
            <Row key={f.key} label={f.label} value={formatFieldValue(f, meta[f.key])} />
          ))}
          {!editing && (
            <Row label="Tillagd" value={row.created_at ? new Date(row.created_at).toLocaleDateString("sv-SE") : "—"} />
          )}
        </div>

        {/* Kopplat lån (för tillgångar) / kopplad tillgång (för lån) */}
        {(linkedLoan || (kind === "bostad" || kind === "fordon")) && !row.is_debt && (
          <div style={card}>
            <div style={sectionTitle}>Lån & eget kapital</div>
            {linkedLoan ? (
              <>
                <div onClick={() => onOpenRow?.(linkedLoan)} style={{ cursor: onOpenRow ? "pointer" : "default" }}>
                  <Row label={linkedLoan.label} value={`−${fmtKr(loanValue)}`} negative />
                </div>
                {linkedLoan.metadata?.lender && <Row label="Långivare" value={linkedLoan.metadata.lender} />}
                {linkedLoan.metadata?.interestRate != null && <Row label="Ränta" value={`${String(linkedLoan.metadata.interestRate).replace(".", ",")} %`} />}
                {ltv != null && <Row label={kind === "bostad" ? "Belåningsgrad" : "Lån / värde"} value={`${ltv.toFixed(0)} %`} />}
                {equity != null && <Row label="Eget kapital" value={fmtKr(equity)} strong />}
                {kind === "bostad" && ltv != null && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                    {ltv > 70 ? "Över 70 % belåning: amorteringskrav 2 % per år (+1 % om skuldkvoten överstiger 4,5 × bruttoinkomst)." : ltv > 50 ? "50–70 % belåning: amorteringskrav 1 % per år (+1 % vid skuldkvot över 4,5 × bruttoinkomst)." : "Under 50 % belåning: inget krav på grund av belåningsgraden (skuldkvotskravet kan ändå gälla)."}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Inget lån kopplat — hela värdet räknas som eget kapital. Lägg till ett lån under + Lägg till → Bolån & skulder.
              </div>
            )}
          </div>
        )}
        {linkedAsset && (
          <div style={card}>
            <div style={sectionTitle}>Kopplad tillgång</div>
            <div onClick={() => onOpenRow?.(linkedAsset)} style={{ cursor: onOpenRow ? "pointer" : "default" }}>
              <Row label={linkedAsset.label} value={fmtKr(linkedAsset.value_sek)} />
            </div>
            {Number(linkedAsset.value_sek) > 0 && <Row label="Belåningsgrad" value={`${((value / Number(linkedAsset.value_sek)) * 100).toFixed(0)} %`} />}
          </div>
        )}

        {/* Vinstandel: årgångar */}
        {isVinstandel && (
          <div style={{ ...card, gridColumn: isMobile ? undefined : "1 / -1" }}>
            <div style={sectionTitle}>Årgångar · låsta {lockYears} år</div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 28px", gap: 10, fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              <span>Årgång</span><span>Värde</span><span>Tillgänglig</span><span />
            </div>
            {(editing ? form.tranches : (meta.tranches || []).map(t => ({ year: String(t.year), value: String(t.value) }))).map((t, i) => {
              const y = parseInt(t.year, 10);
              const unlock = Number.isFinite(y) ? y + lockYears : null;
              const free = unlock != null && unlock <= new Date().getFullYear();
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 28px", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                  {editing ? (
                    <>
                      <input value={t.year} onChange={e => setForm({ ...form, tranches: form.tranches.map((x, j) => j === i ? { ...x, year: e.target.value } : x) })} inputMode="numeric" aria-label={`Årgång ${i + 1} år`} style={inputStyle} />
                      <input value={t.value} onChange={e => setForm({ ...form, tranches: form.tranches.map((x, j) => j === i ? { ...x, value: e.target.value } : x) })} inputMode="numeric" aria-label={`Årgång ${i + 1} värde`} style={inputStyle} />
                    </>
                  ) : (
                    <>
                      <span style={mono}>{t.year}</span>
                      <span style={mono}>{fmtKr(t.value)}</span>
                    </>
                  )}
                  <span style={{ ...mono, fontSize: 12, color: free ? "var(--pos)" : "var(--text-secondary)" }}>{unlock != null ? (free ? "nu" : unlock) : "—"}</span>
                  {editing ? (
                    <button onClick={() => setForm({ ...form, tranches: form.tranches.filter((_, j) => j !== i) })} title="Ta bort årgång"
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: 0 }}>×</button>
                  ) : <span />}
                </div>
              );
            })}
            {editing && (
              <button onClick={() => setForm({ ...form, tranches: [...form.tranches, { year: "", value: "" }] })}
                style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                + Lägg till årgång
              </button>
            )}
            {vSummary && vSummary.total > 0 && (
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                <span>Tillgängligt nu <span style={{ ...mono, color: "var(--pos)", fontWeight: 600 }}>{fmtKr(vSummary.available)}</span></span>
                <span>Låst <span style={{ ...mono, color: "var(--text)", fontWeight: 600 }}>{fmtKr(vSummary.locked)}</span></span>
                {vSummary.next && <span>Nästa frisläpp <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(vSummary.next.value)} · {vSummary.next.year}</span></span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Knappar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
        {editing ? (
          <>
            <button onClick={save} disabled={saving} style={{ ...btn(true), opacity: saving ? 0.6 : 1 }}>{saving ? "Sparar…" : "Spara ändringar"}</button>
            <button onClick={cancelEdit} disabled={saving} style={btn(false)}>Avbryt</button>
          </>
        ) : (
          <>
            <button onClick={startEdit} style={btn(true)}>Redigera</button>
            {confirmDelete ? (
              <>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Ta bort {row.label}{linkedLoan ? " (lånet ligger kvar)" : ""}?</span>
                <button onClick={remove} disabled={saving} style={{ ...btn(false), color: "var(--neg)", borderColor: "var(--neg)" }}>Ja, ta bort</button>
                <button onClick={() => setConfirmDelete(false)} style={btn(false)}>Nej</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ ...btn(false), marginLeft: "auto", color: "var(--text-muted)" }}>Ta bort</button>
            )}
          </>
        )}
        {error && <div style={{ width: "100%", fontSize: 12, color: "var(--neg)" }}>{error}</div>}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.5 }}>
        Värdena är dina egna — uppdatera när du får nytt besked (värdering, kontoutdrag, stiftelsebesked).
      </div>
    </div>
  );
}
