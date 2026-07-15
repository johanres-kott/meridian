import { useState } from "react";
import { useTranslation } from "react-i18next";
import FundAutocomplete from "./FundAutocomplete.jsx";
import { useItpProviders } from "../hooks/useItpProviders.js";
import { getPensionEntries, getPensionTotalValue, newPensionEntry } from "../lib/pension.js";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 };

function formatKr(n, locale) {
  return Number(n).toLocaleString(locale);
}

export default function MyITPSection({ pension, updatePreferences, isMobile }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const { providers } = useItpProviders();

  const initialEntries = getPensionEntries(pension).map(e => ({
    id: e.id || `e_${Math.random().toString(36).slice(2, 8)}`,
    provider: e.provider || "",
    insuranceType: e.insuranceType || "",
    currentValue: e.currentValue ?? "",
    funds: e.funds?.length ? e.funds : [],
  }));

  const hasData = !!pension?.itpType || initialEntries.length > 0;
  const [editing, setEditing] = useState(!hasData);
  const [itpType, setItpType] = useState(pension?.itpType || "");
  const [monthlyContribution, setMonthlyContribution] = useState(pension?.monthlyContribution ?? "");
  const [entries, setEntries] = useState(initialEntries.length ? initialEntries : [newPensionEntry()]);

  function updateEntry(idx, patch) {
    setEntries(prev => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function updateFund(entryIdx, fundIdx, patch) {
    setEntries(prev => prev.map((e, i) => {
      if (i !== entryIdx) return e;
      const funds = [...e.funds];
      funds[fundIdx] = { ...funds[fundIdx], ...patch };
      return { ...e, funds };
    }));
  }

  function addFund(entryIdx) {
    updateEntry(entryIdx, { funds: [...entries[entryIdx].funds, { name: "", allocation: 0, fee: "" }] });
  }

  function removeFund(entryIdx, fundIdx) {
    updateEntry(entryIdx, { funds: entries[entryIdx].funds.filter((_, i) => i !== fundIdx) });
  }

  function addEntry() {
    setEntries(prev => [...prev, newPensionEntry()]);
  }

  function removeEntry(idx) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  function save() {
    const cleanedEntries = entries
      .filter(e => e.provider || e.insuranceType || e.currentValue !== "" || (e.funds && e.funds.length))
      .map(e => ({
        id: e.id,
        provider: e.provider || null,
        insuranceType: e.insuranceType || null,
        currentValue: e.currentValue === "" || e.currentValue == null ? null : Number(e.currentValue),
        funds: (e.funds || [])
          .filter(f => f.name && f.name.trim())
          .map(f => ({
            name: f.name.trim(),
            allocation: Number(f.allocation) || 0,
            fee: f.fee === "" || f.fee == null ? null : Number(f.fee),
            secId: f.secId || null,
          })),
      }));

    const cleaned = {
      itpType: itpType || null,
      monthlyContribution: monthlyContribution === "" ? null : Number(monthlyContribution),
      entries: cleanedEntries,
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

  // ----- Summary view -----
  if (!editing && hasData) {
    const storedEntries = getPensionEntries(pension);
    const totalValue = getPensionTotalValue(pension);
    return (
      <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t("myItpSection.title")}</div>
            {pension?.itpType && (
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                {pension.itpType}
                {pension.monthlyContribution != null && (
                  <> · {t("myItpSection.monthlyContribution")} <span style={mono}>{t("myItpSection.valueKr", { value: formatKr(pension.monthlyContribution, numberLocale) })}</span></>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setEditing(true)}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t("myItpSection.edit")}
          </button>
        </div>

        {totalValue != null && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--accent-light)", borderRadius: 6 }}>
            <div style={smallLabel}>{t("myItpSection.totalCapital")}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", ...mono }}>
              {t("myItpSection.valueKr", { value: formatKr(totalValue, numberLocale) })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {storedEntries.map((e, i) => {
            const totalAlloc = (e.funds || []).reduce((s, f) => s + (f.allocation || 0), 0);
            const avgFee = (e.funds || []).length > 0
              ? (e.funds.reduce((s, f) => s + (f.fee || 0) * (f.allocation || 0), 0) / (totalAlloc || 1))
              : null;
            return (
              <div key={e.id || i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: e.funds?.length ? 10 : 0 }}>
                  <div>
                    <div style={smallLabel}>{t("myItpSection.provider")}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{e.provider || "–"}</div>
                  </div>
                  <div>
                    <div style={smallLabel}>{t("myItpSection.insuranceType")}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {e.insuranceType === "fond" ? t("myItpSection.fundInsurance") : e.insuranceType === "trad" ? t("myItpSection.traditional") : "–"}
                    </div>
                  </div>
                  {e.currentValue != null && (
                    <div>
                      <div style={smallLabel}>{t("myItpSection.value")}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", ...mono }}>
                        {t("myItpSection.valueKr", { value: formatKr(e.currentValue, numberLocale) })}
                      </div>
                    </div>
                  )}
                </div>
                {e.funds?.length > 0 && (
                  <div>
                    <div style={smallLabel}>{t("myItpSection.funds")}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {e.funds.map((f, fi) => (
                        <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: fi < e.funds.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                          <span style={{ fontSize: 12, color: "var(--text)" }}>{f.name}</span>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)", ...mono }}>{f.allocation}%</span>
                            {f.fee != null && <span style={{ fontSize: 11, color: f.fee <= 0.3 ? "#089981" : "var(--text-secondary)", ...mono }}>{t("myItpSection.fee", { value: f.fee })}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {avgFee != null && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, ...mono }}>
                        {t("myItpSection.weightedAvgFee", { value: avgFee.toFixed(2) })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----- Edit/create form -----
  return (
    <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{t("myItpSection.title")}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
        {t("myItpSection.intro")}
      </div>

      {/* ITP type */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>{t("myItpSection.itpTypeLabel")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ITP1", "ITP2"].map(type => (
            <button key={type} onClick={() => setItpType(type)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                border: itpType === type ? "2px solid var(--accent)" : "2px solid var(--border)",
                background: itpType === type ? "var(--accent-light)" : "var(--bg-card)",
                color: itpType === type ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: itpType === type ? 600 : 400,
              }}>
              {type}
              <div style={{ fontSize: 10, marginTop: 2, color: "var(--text-muted)" }}>
                {type === "ITP1" ? t("myItpSection.itp1Desc") : t("myItpSection.itp2Desc")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly contribution */}
      <div style={{ marginBottom: 18 }}>
        <div style={smallLabel}>{t("myItpSection.monthlyContributionKr")}</div>
        <input type="number" placeholder={t("myItpSection.contributionPlaceholder")} value={monthlyContribution}
          onChange={e => setMonthlyContribution(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
      </div>

      {/* Entries */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, marginBottom: 8 }}>{t("myItpSection.entries")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map((entry, ei) => (
          <div key={entry.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("myItpSection.entryNumber", { number: ei + 1 })}</div>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(ei)}
                  style={{ fontSize: 11, color: "#c62828", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  {t("myItpSection.removeEntry")}
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={smallLabel}>{t("myItpSection.insuranceProvider")}</div>
                <select value={entry.provider} onChange={e => updateEntry(ei, { provider: e.target.value })} style={selectStyle}>
                  <option value="">{t("myItpSection.selectProvider")}</option>
                  {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  <option value="Annat">{t("myItpSection.other")}</option>
                </select>
              </div>
              <div>
                <div style={smallLabel}>{t("myItpSection.currentValueKr")}</div>
                <input type="number" placeholder={t("myItpSection.valuePlaceholder")} value={entry.currentValue}
                  onChange={e => updateEntry(ei, { currentValue: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: entry.insuranceType === "fond" ? 10 : 0 }}>
              <div style={smallLabel}>{t("myItpSection.insuranceType")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ value: "fond", label: t("myItpSection.fundInsurance") }, { value: "trad", label: t("myItpSection.traditional") }].map(opt => (
                  <button key={opt.value} onClick={() => updateEntry(ei, { insuranceType: opt.value })}
                    style={{
                      flex: 1, padding: "7px 12px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      border: entry.insuranceType === opt.value ? "2px solid var(--accent)" : "2px solid var(--border)",
                      background: entry.insuranceType === opt.value ? "var(--accent-light)" : "var(--bg-card)",
                      color: entry.insuranceType === opt.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: entry.insuranceType === opt.value ? 600 : 400,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {entry.insuranceType === "fond" && (
              <div>
                <div style={smallLabel}>{t("myItpSection.funds")}</div>
                {entry.funds.map((fund, fi) => (
                  <div key={fi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <FundAutocomplete
                      value={fund.name}
                      providerName={entry.provider}
                      onChangeName={val => updateFund(ei, fi, { name: val })}
                      onChange={selected => updateFund(ei, fi, {
                        name: selected.name,
                        fee: selected.fee ?? fund.fee,
                        secId: selected.secId,
                      })}
                      placeholder={t("myItpSection.searchFundPlaceholder")}
                      style={{ flex: 3 }}
                    />
                    <input placeholder="%" type="number" value={fund.allocation}
                      onChange={e => updateFund(ei, fi, { allocation: e.target.value })}
                      style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
                    <input placeholder={t("myItpSection.feePercentPlaceholder")} type="number" step="0.01" value={fund.fee}
                      onChange={e => updateFund(ei, fi, { fee: e.target.value })}
                      style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
                    <button onClick={() => removeFund(ei, fi)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
                      x
                    </button>
                  </div>
                ))}
                <button onClick={() => addFund(ei)}
                  style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                  {t("myItpSection.addFund")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addEntry}
        style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "1px dashed var(--border)", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", marginTop: 10, width: "100%" }}>
        {t("myItpSection.addEntry")}
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button onClick={save}
          disabled={!itpType}
          style={{
            padding: "8px 20px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none",
            background: itpType ? "var(--accent)" : "var(--border)",
            color: itpType ? "#fff" : "var(--text-secondary)",
            cursor: itpType ? "pointer" : "default", fontFamily: "inherit",
          }}>
          {t("myItpSection.save")}
        </button>
        {hasData && (
          <button onClick={() => setEditing(false)}
            style={{ padding: "8px 20px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
            {t("myItpSection.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
