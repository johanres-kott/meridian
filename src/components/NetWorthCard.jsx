import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext.jsx";
import { deleteManualAsset } from "../lib/manualAssets.js";

// "Min ekonomi" (PIVOT.md fas 3): listar och raderar manuella tillgångar/
// skulder. Nya poster läggs till via Add Assets-katalogen (onAddAssets) —
// wizardarna där är enda vägen in, så det inte finns två halvbra sätt.
// Siffrorna kommer från useNetWorth via Overview; totalen visas i HomeHero.

const KIND_ICONS = { bostad: "🏠", fordon: "🚗", sparkonto: "🏦", buffert: "🛟", ovrigt: "📦", bolan: "🏠", skuld: "📄" };

export default function NetWorthCard({ isMobile, onNavigate, onAddAssets, data, showTotal = true }) {
  const { preferences } = useUser();
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [deleteError, setDeleteError] = useState(null);

  const { portfolioSek, portfolioLoaded, assets, debts, netWorth, hasAnything, pensionValue, reloadManual } = data;

  async function removeRow(id) {
    setDeleteError(null);
    try {
      await deleteManualAsset(id);
      reloadManual();
    } catch (err) {
      console.error("NetWorthCard: delete failed:", err);
      setDeleteError(err.message || true);
    }
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

        <button onClick={() => onAddAssets?.()}
          style={{ marginTop: 10, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {t("myFinances.add")}
        </button>
        {deleteError && (
          <div style={{ fontSize: 11, color: "#f23645", marginTop: 6 }}>
            {typeof deleteError === "string" ? deleteError : t("myFinances.saveError")}
          </div>
        )}
      </div>
    </div>
  );
}
