import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

// Portfölj-heron (DESIGN.md): Finarys "Assets | Liabilities"-donut per
// tillgångsslag. Data från useNetWorth (delas med Hem) — aktier/fonder i SEK,
// pension, manuella tillgångar per kind, skulder separat. Visar bara det som
// faktiskt finns; saknas FX-kurs för portföljen utelämnas den med en not.

const COLORS = {
  stocks: "var(--brand)",
  funds: "var(--green-400)",
  pension: "var(--pos)",
  bostad: "#7c4dff",
  fordon: "var(--warn)",
  cash: "#26a69a",
  ovrigt: "#8d6e63",
  bolan: "var(--neg)",
  skuld: "#ef6c00",
};

const KIND_TO_CAT = { bostad: "bostad", fordon: "fordon", sparkonto: "cash", buffert: "cash", ovrigt: "ovrigt", bolan: "bolan", skuld: "skuld" };

export default function AssetBreakdown({ data, isMobile, onNavigate }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [mode, setMode] = useState("assets");

  const { assetsList, debtsList, assetTotal, debtTotal, portfolioMissing } = useMemo(() => {
    const assets = [];
    const push = (list, cat, value) => {
      if (value == null || value <= 0) return;
      const existing = list.find(x => x.cat === cat);
      if (existing) existing.value += value; else list.push({ cat, value });
    };
    if (data.stocksSek != null || data.fundsSek != null) {
      push(assets, "stocks", data.stocksSek);
      push(assets, "funds", data.fundsSek);
    } else if (data.portfolioSek != null) {
      push(assets, "stocks", data.portfolioSek);
    }
    push(assets, "pension", data.pensionValue);
    for (const r of data.assets || []) push(assets, KIND_TO_CAT[r.kind] || "ovrigt", Number(r.value_sek));
    const debts = [];
    for (const r of data.debts || []) push(debts, KIND_TO_CAT[r.kind] || "skuld", Number(r.value_sek));
    assets.sort((a, b) => b.value - a.value);
    debts.sort((a, b) => b.value - a.value);
    return {
      assetsList: assets,
      debtsList: debts,
      assetTotal: assets.reduce((s, x) => s + x.value, 0),
      debtTotal: debts.reduce((s, x) => s + x.value, 0),
      portfolioMissing: data.portfolioLoaded && data.portfolioSek == null,
    };
  }, [data]);

  if (!data.portfolioLoaded) return null;

  const list = mode === "assets" ? assetsList : debtsList;
  const total = mode === "assets" ? assetTotal : debtTotal;
  const fmt = v => `${v.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK`;
  const mono = { fontFamily: "var(--font-mono)" };

  const catTarget = {
    stocks: ["portfolio"], funds: ["portfolio"], pension: ["investment", { subTab: "pension" }],
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: isMobile ? "14px 16px" : "18px 22px", marginBottom: isMobile ? 12 : 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{t("assetBreakdown.title")}</span>
        <div style={{ display: "flex", gap: 14 }}>
          {["assets", "debts"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                fontSize: 13, fontWeight: mode === m ? 600 : 400, padding: "4px 0", background: "none", border: "none",
                borderBottom: `2px solid ${mode === m ? "var(--text)" : "transparent"}`,
                color: mode === m ? "var(--text)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
              }}>
              {t(`assetBreakdown.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "24px 0" }}>{t("assetBreakdown.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 8 : 24 }}>
          <div style={{ position: "relative", width: isMobile ? 180 : 210, height: isMobile ? 180 : 210, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={list} dataKey="value" nameKey="cat" innerRadius="70%" outerRadius="100%" paddingAngle={list.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
                  {list.map(x => <Cell key={x.cat} fill={COLORS[x.cat] || "#8d6e63"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ ...mono, fontSize: isMobile ? 15 : 17, fontWeight: 600, color: "var(--text)" }}>{fmt(total)}</span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("assetBreakdown.total")}</span>
            </div>
          </div>

          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map(x => {
              const pct = total > 0 ? (x.value / total) * 100 : 0;
              const target = catTarget[x.cat];
              return (
                <button key={x.cat} onClick={() => target && onNavigate?.(...target)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                    background: "none", border: "none", padding: "2px 0", cursor: target ? "pointer" : "default", fontFamily: "inherit",
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[x.cat] || "#8d6e63", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text)", flex: 1, minWidth: 0 }}>{t(`assetBreakdown.cats.${x.cat}`)}</span>
                  <div style={{ width: isMobile ? 70 : 110, height: 6, borderRadius: 3, background: "var(--border-light)", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: COLORS[x.cat] || "#8d6e63" }} />
                  </div>
                  <span style={{ ...mono, fontSize: 11, color: "var(--text-secondary)", width: 38, textAlign: "right", flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                  {!isMobile && <span style={{ ...mono, fontSize: 12, color: "var(--text)", width: 120, textAlign: "right", flexShrink: 0 }}>{fmt(x.value)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {portfolioMissing && mode === "assets" && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>{t("myFinances.portfolioUnavailable")}</div>
      )}
    </div>
  );
}
