import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";

// "Din bas" — kärnan i core-satellite-berättelsen (se PIVOT.md). Kollar om
// användaren äger en global indexfond; annars en generisk, pedagogisk nudge.
// Bedömningen bygger enbart på Morningstar-data via /api/fund (indexFund-flagga
// + kategori) — finns ingen data visas nudgen, aldrig påhittade värden.

async function fetchFundMeta(secId) {
  try {
    const r = await fetch(`/api/fund?secId=${encodeURIComponent(secId)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default function BaseFundCard({ isMobile, onNavigate }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, baseFund: null });

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
      const metas = owned.length > 0
        ? await Promise.all(owned.slice(0, 12).map(f => fetchFundMeta(f.ticker)))
        : [];
      const baseFund = metas.find(m => m?.indexFund && m?.category?.startsWith("Global")) || null;
      if (!cancelled) setState({ loading: false, baseFund });
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return null;
  const { baseFund } = state;

  return (
    <div style={{
      marginBottom: isMobile ? 12 : 20, borderRadius: 8, overflow: "hidden",
      border: `1px solid ${baseFund ? "rgba(15,154,108,0.35)" : "var(--border)"}`,
      background: "var(--bg-card)",
    }}>
      <div style={{ padding: isMobile ? "12px 14px" : "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
            background: baseFund ? "var(--pos)" : "var(--accent)",
          }}>
            {baseFund ? "✓" : "1"}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {baseFund ? t("baseFund.inPlaceTitle") : t("baseFund.title")}
          </span>
        </div>

        {baseFund ? (
          <>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>{t("baseFund.inPlaceText")}</div>
            <button
              onClick={() => onNavigate?.("portfolio", { ticker: baseFund.secId })}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 6,
                padding: "10px 12px", cursor: "pointer", fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", flex: 1 }}>
                {baseFund.legalName || baseFund.name}
              </span>
              <span style={{
                fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 500,
                background: "rgba(33,150,243,0.12)", color: "var(--green-600)", flexShrink: 0,
              }}>
                {t("baseFund.index")}
              </span>
              {baseFund.ongoingCharge != null && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                  {t("baseFund.fee")} {baseFund.ongoingCharge.toFixed(2)}%
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
              {t("baseFund.nudgeText")}
            </div>
            <button
              onClick={() => onNavigate?.("investment", { subTab: "toppforslag", suggestMode: "fund", fundCategory: "aktie_global", fundType: "index" })}
              style={{
                fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 6,
                border: "none", background: "var(--accent)", color: "#fff",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              {t("baseFund.cta")}
            </button>
          </>
        )}
      </div>
      <div style={{ padding: "6px 20px", borderTop: "1px solid var(--border-light)", fontSize: 10, color: "var(--text-muted)" }}>
        {t("baseFund.disclaimer")}
      </div>
    </div>
  );
}
