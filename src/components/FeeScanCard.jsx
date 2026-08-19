import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { Search } from "./icons.jsx";

// Avgiftskoll (PIVOT.md fas 2c, Finary-inspirerad "optimize"-funktion):
// jämför avgiften på ägda AKTIVA fonder mot billigaste globala indexfonden i
// vår Morningstar-lista och visar skillnaden i kronor per år. Enbart aritmetik
// på verklig data — inga prognoser, ingen påhittad "typisk indexavgift".
// Kronbelopp räknas bara för fonder prissatta i SEK.

async function fetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default function FeeScanCard({ isMobile, onNavigate }) {
  const { t } = useTranslation();
  const [scan, setScan] = useState(null); // { cheapest, rows, totalKr }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("watchlist")
        .select("ticker, name, shares, type")
        .eq("user_id", user.id)
        .eq("type", "fund");
      const owned = (data || []).filter(f => f.shares > 0);
      if (owned.length === 0) return;

      const metas = await Promise.all(owned.slice(0, 12).map(f =>
        fetchJson(`/api/fund?secId=${encodeURIComponent(f.ticker)}`).then(m => m && { ...m, shares: f.shares })
      ));
      const active = metas.filter(m => m && m.indexFund === false && m.ongoingCharge != null);
      if (active.length === 0) return;

      const top = await fetchJson("/api/fund-top?category=aktie_global");
      const indexFunds = (top?.results || []).filter(f => f.indexFund && f.ongoingCharge != null);
      if (indexFunds.length === 0) return;
      const cheapest = indexFunds.reduce((a, b) => (a.ongoingCharge <= b.ongoingCharge ? a : b));

      const rows = active.map(m => {
        const valueSek = m.currency === "SEK" && m.nav != null ? m.shares * m.nav : null;
        const diffPct = m.ongoingCharge - cheapest.ongoingCharge;
        return {
          secId: m.secId,
          name: m.legalName || m.name,
          charge: m.ongoingCharge,
          diffKr: valueSek != null && diffPct > 0 ? valueSek * (diffPct / 100) : null,
        };
      }).filter(r => r.charge > cheapest.ongoingCharge);
      if (rows.length === 0) return;

      const krRows = rows.filter(r => r.diffKr != null);
      const totalKr = krRows.length > 0 ? krRows.reduce((sum, r) => sum + r.diffKr, 0) : null;
      if (!cancelled) setScan({ cheapest, rows, totalKr });
    })();
    return () => { cancelled = true; };
  }, []);

  if (!scan) return null;
  const { cheapest, rows, totalKr } = scan;

  return (
    <div style={{ marginBottom: isMobile ? 12 : 20, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "12px 14px" : "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ color: "var(--brand)", display: "inline-flex" }}><Search size={16} strokeWidth={1.5} aria-hidden /></span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{t("feeScan.title")}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
          {t("feeScan.intro", { name: cheapest.legalName || cheapest.name, fee: cheapest.ongoingCharge.toFixed(2) })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(r => (
            <button
              key={r.secId}
              onClick={() => onNavigate?.("portfolio", { ticker: r.secId })}
              style={{
                display: "flex", alignItems: "baseline", gap: 10, width: "100%", textAlign: "left",
                background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 6,
                padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", flex: 1, minWidth: 0 }}>{r.name}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                {r.charge.toFixed(2)} % {t("feeScan.feeLabel")}
              </span>
              {r.diffKr != null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warn)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                  ≈ {Math.round(r.diffKr).toLocaleString("sv-SE")} {t("feeScan.perYear")}
                </span>
              )}
            </button>
          ))}
        </div>
        {totalKr != null && rows.length > 1 && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--warn)", marginTop: 10 }}>
            {t("feeScan.total", { amount: Math.round(totalKr).toLocaleString("sv-SE") })}
          </div>
        )}
      </div>
      <div style={{ padding: "6px 20px", borderTop: "1px solid var(--border-light)", fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
        {t("feeScan.disclaimer")}
      </div>
    </div>
  );
}
