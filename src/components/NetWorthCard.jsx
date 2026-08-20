import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext.jsx";
import { deleteManualAsset } from "../lib/manualAssets.js";
import { IconBadge } from "./icons.jsx";
import { KIND_COLORS } from "./iconMaps.js";
import { vinstandelHint } from "./addassets/vinstandel.js";

// "Min ekonomi" (PIVOT.md fas 3): listar och raderar manuella tillgångar/
// skulder. Nya poster läggs till via Add Assets-katalogen (onAddAssets) —
// wizardarna där är enda vägen in, så det inte finns två halvbra sätt.
// Siffrorna kommer från useNetWorth via Overview; totalen visas i HomeHero.


export default function NetWorthCard({ isMobile, onNavigate, onAddAssets, data, showTotal = true }) {
  const { preferences } = useUser();
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [deleteError, setDeleteError] = useState(null);

  const { portfolioSek, portfolioLoaded, assets, debts, netWorth, hasAnything, pensionValue, reloadManual } = data;

  // Lån hör ihop med sin tillgång: wizardarna länkar via metadata.linkedAssetId,
  // och ett olänkat bolån läggs under bostaden när det bara finns en (entydigt).
  // Övriga skulder listas fristående som förut.
  const bostadAssets = assets.filter(a => a.kind === "bostad");
  const loansByAsset = new Map();
  const standaloneDebts = [];
  for (const d of debts) {
    const linkId = d.metadata?.linkedAssetId;
    let target = linkId ? assets.find(a => a.id === linkId) : null;
    if (!target && !linkId && d.kind === "bolan" && bostadAssets.length === 1) target = bostadAssets[0];
    if (target) {
      if (!loansByAsset.has(target.id)) loansByAsset.set(target.id, []);
      loansByAsset.get(target.id).push(d);
    } else {
      standaloneDebts.push(d);
    }
  }

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

  const mono = { fontFamily: "var(--font-mono)" };
  const rowStyle = { display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border-light)", fontSize: 12 };

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
              <IconBadge kind="portfolio" color={KIND_COLORS.portfolio} size={26} iconSize={13} />
              <span style={{ color: "var(--text)", flex: 1 }}>{t("myFinances.portfolio")}</span>
              <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(portfolioSek)}</span>
            </div>
          )}
          {portfolioLoaded && portfolioSek == null && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 0" }}>{t("myFinances.portfolioUnavailable")}</div>
          )}
          {pensionValue != null && (
            <div style={{ ...rowStyle, cursor: "pointer" }} onClick={() => onNavigate?.("investment", { subTab: "pension" })}>
              <IconBadge kind="pension" color={KIND_COLORS.pension} size={26} iconSize={13} />
              <span style={{ color: "var(--text)", flex: 1 }}>{t("myFinances.pension")} · {preferences?.pension?.itpType || "ITP"}</span>
              <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(pensionValue)}</span>
            </div>
          )}
          {assets.map(r => (
            <div key={r.id}>
              <div style={{ ...rowStyle, cursor: "pointer", borderBottom: (loansByAsset.get(r.id) || []).length > 0 ? "none" : rowStyle.borderBottom }} onClick={() => onNavigate?.("portfolio", { manualId: r.id })} title="Öppna tillgången">
                <IconBadge kind={r.kind} color={KIND_COLORS[r.kind] || "var(--brand)"} size={26} iconSize={13} />
                <span style={{ color: "var(--text)", flex: 1, minWidth: 0 }}>
                  {r.label}
                  {r.kind === "vinstandel" && vinstandelHint(r.metadata) && (
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--text-muted)" }}>{vinstandelHint(r.metadata)}</span>
                  )}
                </span>
                <span style={{ ...mono, color: "var(--text)" }}>{fmtKr(Number(r.value_sek))}</span>
                <button onClick={(e) => { e.stopPropagation(); removeRow(r.id); }} title={t("common.delete", { defaultValue: "Ta bort" })}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
              </div>
              {(loansByAsset.get(r.id) || []).map(loan => (
                <div key={loan.id} style={{ ...rowStyle, cursor: "pointer", paddingLeft: 36, paddingTop: 0 }} onClick={() => onNavigate?.("portfolio", { manualId: loan.id })} title="Öppna lånet">
                  <IconBadge kind={loan.kind} color={KIND_COLORS[loan.kind] || "var(--neg)"} size={20} iconSize={11} />
                  <span style={{ color: "var(--text-secondary)", flex: 1, minWidth: 0 }}>{loan.label}</span>
                  <span style={{ ...mono, color: "var(--neg)" }}>−{fmtKr(Number(loan.value_sek))}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeRow(loan.id); }} title={t("common.delete", { defaultValue: "Ta bort" })}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
                </div>
              ))}
            </div>
          ))}
          {standaloneDebts.map(r => (
            <div key={r.id} style={{ ...rowStyle, cursor: "pointer" }} onClick={() => onNavigate?.("portfolio", { manualId: r.id })} title="Öppna lånet">
              <IconBadge kind={r.kind} color={KIND_COLORS[r.kind] || "var(--neg)"} size={26} iconSize={13} />
              <span style={{ color: "var(--text)", flex: 1 }}>{r.label}</span>
              <span style={{ ...mono, color: "var(--neg)" }}>−{fmtKr(Number(r.value_sek))}</span>
              <button onClick={(e) => { e.stopPropagation(); removeRow(r.id); }} title={t("common.delete", { defaultValue: "Ta bort" })}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>×</button>
            </div>
          ))}
        </div>

        <button onClick={() => onAddAssets?.()}
          style={{ marginTop: 10, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {t("myFinances.add")}
        </button>
        {deleteError && (
          <div style={{ fontSize: 11, color: "var(--neg)", marginTop: 6 }}>
            {typeof deleteError === "string" ? deleteError : t("myFinances.saveError")}
          </div>
        )}
      </div>
    </div>
  );
}
