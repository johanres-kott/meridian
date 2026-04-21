import { useState } from "react";
import FundAutocomplete from "./FundAutocomplete.jsx";
import { useItpProviders } from "../hooks/useItpProviders.js";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 };

export default function MyITPSection({ pension, updatePreferences, isMobile }) {
  const { providers } = useItpProviders();
  const [editing, setEditing] = useState(!pension.itpType);
  const [form, setForm] = useState({
    itpType: pension.itpType || "",
    provider: pension.provider || "",
    insuranceType: pension.insuranceType || "",
    funds: pension.funds?.length ? pension.funds : [{ name: "", allocation: 100, fee: "" }],
    monthlyContribution: pension.monthlyContribution ?? "",
    currentValue: pension.currentValue ?? "",
  });

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateFund(index, key, value) {
    setForm(prev => {
      const funds = [...prev.funds];
      funds[index] = { ...funds[index], [key]: value };
      return { ...prev, funds };
    });
  }

  function addFund() {
    setForm(prev => ({ ...prev, funds: [...prev.funds, { name: "", allocation: 0, fee: "" }] }));
  }

  function removeFund(index) {
    setForm(prev => ({ ...prev, funds: prev.funds.filter((_, i) => i !== index) }));
  }

  function save() {
    const cleaned = {
      itpType: form.itpType || null,
      provider: form.provider || null,
      insuranceType: form.insuranceType || null,
      funds: form.funds.filter(f => f.name.trim()).map(f => ({
        name: f.name.trim(),
        allocation: Number(f.allocation) || 0,
        fee: f.fee === "" || f.fee == null ? null : Number(f.fee),
        secId: f.secId || null,
      })),
      monthlyContribution: form.monthlyContribution === "" ? null : Number(form.monthlyContribution),
      currentValue: form.currentValue === "" ? null : Number(form.currentValue),
    };
    updatePreferences({ pension: cleaned });
    setEditing(false);
  }

  const inputStyle = {
    padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4,
    fontSize: 13, fontFamily: "inherit", background: "var(--bg-card)", color: "var(--text)",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const smallLabel = { fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 };

  // Summary view
  if (!editing && pension.itpType) {
    const totalAlloc = (pension.funds || []).reduce((s, f) => s + (f.allocation || 0), 0);
    const avgFee = (pension.funds || []).length > 0
      ? (pension.funds.reduce((s, f) => s + (f.fee || 0) * (f.allocation || 0), 0) / (totalAlloc || 1))
      : null;
    return (
      <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Tjänstepension (ITP)</div>
          <button onClick={() => setEditing(true)}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Redigera
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: pension.funds?.length ? 12 : 0 }}>
          <div>
            <div style={smallLabel}>Typ</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{pension.itpType}</div>
          </div>
          <div>
            <div style={smallLabel}>Bolag</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{pension.provider || "–"}</div>
          </div>
          <div>
            <div style={smallLabel}>Försäkringsform</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
              {pension.insuranceType === "fond" ? "Fondförsäkring" : pension.insuranceType === "trad" ? "Traditionell" : "–"}
            </div>
          </div>
          {pension.currentValue != null && (
            <div>
              <div style={smallLabel}>Aktuellt värde</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", ...mono }}>
                {Number(pension.currentValue).toLocaleString("sv-SE")} kr
              </div>
            </div>
          )}
        </div>

        {pension.funds?.length > 0 && (
          <div>
            <div style={smallLabel}>Fonder</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pension.funds.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < pension.funds.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{f.name}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", ...mono }}>{f.allocation}%</span>
                    {f.fee != null && <span style={{ fontSize: 11, color: f.fee <= 0.3 ? "#089981" : "var(--text-secondary)", ...mono }}>avg. {f.fee}%</span>}
                  </div>
                </div>
              ))}
            </div>
            {avgFee != null && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, ...mono }}>
                Viktad snittavgift: {avgFee.toFixed(2)}%
              </div>
            )}
          </div>
        )}

        {pension.monthlyContribution != null && (
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
            Månadsinbetalning: <span style={mono}>{Number(pension.monthlyContribution).toLocaleString("sv-SE")} kr</span>
          </div>
        )}
      </div>
    );
  }

  // Edit/create form
  return (
    <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Tjänstepension (ITP)</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
        Fyll i dina uppgifter för att få en samlad bild av ditt pensionssparande.
      </div>

      {/* ITP type */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>ITP-typ</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ITP1", "ITP2"].map(t => (
            <button key={t} onClick={() => updateField("itpType", t)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                border: form.itpType === t ? "2px solid var(--accent)" : "2px solid var(--border)",
                background: form.itpType === t ? "var(--accent-light)" : "var(--bg-card)",
                color: form.itpType === t ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: form.itpType === t ? 600 : 400,
              }}>
              {t}
              <div style={{ fontSize: 10, marginTop: 2, color: "var(--text-muted)" }}>
                {t === "ITP1" ? "Premiebestämd (f. 1979+)" : "Förmånsbestämd (f. –1978)"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>Försäkringsbolag</div>
        <select value={form.provider} onChange={e => updateField("provider", e.target.value)} style={selectStyle}>
          <option value="">Välj bolag...</option>
          {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          <option value="Annat">Annat</option>
        </select>
      </div>

      {/* Insurance type */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>Försäkringsform</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ value: "fond", label: "Fondförsäkring" }, { value: "trad", label: "Traditionell" }].map(opt => (
            <button key={opt.value} onClick={() => updateField("insuranceType", opt.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                border: form.insuranceType === opt.value ? "2px solid var(--accent)" : "2px solid var(--border)",
                background: form.insuranceType === opt.value ? "var(--accent-light)" : "var(--bg-card)",
                color: form.insuranceType === opt.value ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: form.insuranceType === opt.value ? 600 : 400,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Funds (only for fondförsäkring) */}
      {form.insuranceType === "fond" && (
        <div style={{ marginBottom: 14 }}>
          <div style={smallLabel}>Fonder</div>
          {form.funds.map((fund, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <FundAutocomplete
                value={fund.name}
                providerName={form.provider}
                onChangeName={val => updateFund(i, "name", val)}
                onChange={selected => {
                  const funds = [...form.funds];
                  funds[i] = { ...funds[i], name: selected.name, fee: selected.fee ?? funds[i].fee, secId: selected.secId };
                  setForm(prev => ({ ...prev, funds }));
                }}
                placeholder="Sök fond..."
                style={{ flex: 3 }}
              />
              <input placeholder="%" type="number" value={fund.allocation} onChange={e => updateFund(i, "allocation", e.target.value)}
                style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
              <input placeholder="Avgift %" type="number" step="0.01" value={fund.fee} onChange={e => updateFund(i, "fee", e.target.value)}
                style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
              {form.funds.length > 1 && (
                <button onClick={() => removeFund(i)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
                  x
                </button>
              )}
            </div>
          ))}
          <button onClick={addFund}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
            + Lägg till fond
          </button>
        </div>
      )}

      {/* Monthly contribution + current value */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={smallLabel}>Månadsinbetalning (kr)</div>
          <input type="number" placeholder="t.ex. 3500" value={form.monthlyContribution}
            onChange={e => updateField("monthlyContribution", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={smallLabel}>Aktuellt värde (kr)</div>
          <input type="number" placeholder="t.ex. 450000" value={form.currentValue}
            onChange={e => updateField("currentValue", e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save}
          disabled={!form.itpType}
          style={{
            padding: "8px 20px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none",
            background: form.itpType ? "var(--accent)" : "var(--border)",
            color: form.itpType ? "#fff" : "var(--text-secondary)",
            cursor: form.itpType ? "pointer" : "default", fontFamily: "inherit",
          }}>
          Spara
        </button>
        {pension.itpType && (
          <button onClick={() => setEditing(false)}
            style={{ padding: "8px 20px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
        )}
      </div>
    </div>
  );
}
