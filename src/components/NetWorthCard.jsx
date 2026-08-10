import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";

// "Min ekonomi" (PIVOT.md fas 3): hantering av manuella tillgångar/skulder
// (manual_assets, se migrations/2026-08-10_manual_assets.sql). Siffrorna kommer
// från useNetWorth via Overview — totalen visas i HomeHero, så showTotal är
// avstängd där heron finns för att slippa dubblering.

const ASSET_KINDS = ["bostad", "fordon", "sparkonto", "buffert", "ovrigt"];
const DEBT_KINDS = ["bolan", "skuld"];
const KIND_ICONS = { bostad: "🏠", fordon: "🚗", sparkonto: "🏦", buffert: "🛟", ovrigt: "📦", bolan: "🏠", skuld: "📄" };

export default function NetWorthCard({ isMobile, onNavigate, data, showTotal = true }) {
  const { userId, preferences } = useUser();
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ kind: "bostad", label: "", value: "" });
  const [saveError, setSaveError] = useState(false);

  const { portfolioSek, portfolioLoaded, assets, debts, netWorth, hasAnything, pensionValue, reloadManual } = data;

  async function saveNew() {
    const value = parseFloat(String(form.value).replace(/\s/g, "").replace(",", "."));
    if (!form.label.trim() || !(value >= 0)) return;
    setSaveError(false);
    const { error } = await supabase.from("manual_assets").insert({
      user_id: userId,
      kind: form.kind,
      label: form.label.trim(),
      value_sek: value,
      is_debt: DEBT_KINDS.includes(form.kind),
    });
    if (error) {
      console.error("NetWorthCard: insert failed:", error);
      setSaveError(true);
      return;
    }
    setForm({ kind: "bostad", label: "", value: "" });
    setAdding(false);
    reloadManual();
  }

  async function removeRow(id) {
    const { error } = await supabase.from("manual_assets").delete().eq("id", id).eq("user_id", userId);
    if (!error) reloadManual();
  }

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const rowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-light)", fontSize: 12 };

  function fmtKr(v) {
    return `${v.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK`;
  }

  return (
    <div style={{ marginBottom: isMobile ? 12 : 20, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "12px 14px" : "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{t("myFinances.title")}</span>
          {showTotal && hasAnything && portfolioLoaded && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("myFinances.netWorth")}</div>
              <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{fmtKr(netWorth)}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          {portfolioSek != null && portfolioSek > 0 && (
            <div style={{ ...rowStyle, cursor: "pointer" }} onClick={() => onNavigate?.("portfolio")}>
              <span style={{ width: 18, textAlign: "center" }}>📈</span>
              <span style={{ color: "var(--text)", flex: 1 }}>{t("myFinances.portfolio")}</span>
              <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(portfolioSek)}</span>
            </div>
          )}
          {portfolioLoaded && portfolioSek == null && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 0" }}>{t("myFinances.portfolioUnavailable")}</div>
          )}
          {pensionValue != null && (
            <div style={{ ...rowStyle, cursor: "pointer" }} onClick={() => onNavigate?.("investment", { subTab: "pension" })}>
              <span style={{ width: 18, textAlign: "center" }}>🪺</span>
              <span style={{ color: "var(--text)", flex: 1 }}>{t("myFinances.pension")} · {preferences?.pension?.itpType || "ITP"}</span>
              <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(pensionValue)}</span>
            </div>
          )}
          {assets.map(r => (
            <div key={r.id} style={rowStyle}>
              <span style={{ width: 18, textAlign: "center" }}>{KIND_ICONS[r.kind] || "📦"}</span>
              <span style={{ color: "var(--text)", flex: 1 }}>{r.label}</span>
              <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(Number(r.value_sek))}</span>
              <button onClick={() => removeRow(r.id)} title={t("common.delete", { defaultValue: "Ta bort" })}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
            </div>
          ))}
          {debts.map(r => (
            <div key={r.id} style={rowStyle}>
              <span style={{ width: 18, textAlign: "center" }}>{KIND_ICONS[r.kind] || "📄"}</span>
              <span style={{ color: "var(--text)", flex: 1 }}>{r.label}</span>
              <span style={{ ...mono, color: "#f23645" }}>−{fmtKr(Number(r.value_sek))}</span>
              <button onClick={() => removeRow(r.id)} title={t("common.delete", { defaultValue: "Ta bort" })}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
            </div>
          ))}
        </div>

        {adding ? (
          <div style={{ marginTop: 10, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 6 }}>
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}
              style={{ fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
              {[...ASSET_KINDS, ...DEBT_KINDS].map(k => (
                <option key={k} value={k}>{t(`myFinances.kinds.${k}`)}</option>
              ))}
            </select>
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder={t("myFinances.labelPlaceholder")}
              style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }} />
            <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
              placeholder={t("myFinances.valuePlaceholder")} inputMode="numeric"
              style={{ width: isMobile ? "100%" : 120, fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={saveNew}
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 4, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                {t("myFinances.save")}
              </button>
              <button onClick={() => { setAdding(false); setSaveError(false); }}
                style={{ fontSize: 12, padding: "6px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                {t("myFinances.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 10, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            {t("myFinances.add")}
          </button>
        )}
        {saveError && (
          <div style={{ fontSize: 11, color: "#f23645", marginTop: 6 }}>{t("myFinances.saveError")}</div>
        )}
      </div>
    </div>
  );
}
