import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IconBadge } from "./icons.jsx";

// Finarys tillgångstabell (DESIGN.md): EN rad per tillgång oavsett slag —
// aktier, fonder, pension, bostad, fordon, sparkonton, övrigt — med typ-chips,
// sök, andel-stapel och Tillgångar|Skulder-flikar. Data via useNetWorth +
// portfolioValue.holdings, så siffrorna är samma som hero/donut.

const TYPE_META = {
  stock:    { label: "Aktie",     color: "var(--brand)" },
  fund:     { label: "Fond",      color: "var(--green-400)" },
  pension:  { label: "Pension",   color: "var(--pos)" },
  bostad:   { label: "Bostad",    color: "#7c4dff" },
  fordon:   { label: "Fordon",    color: "var(--warn)" },
  sparkonto:{ label: "Sparkonto", color: "#26a69a" },
  buffert:  { label: "Buffert",   color: "#26a69a" },
  ovrigt:   { label: "Övrigt",    color: "#8d6e63" },
  bolan:    { label: "Bolån",     color: "var(--neg)" },
  skuld:    { label: "Skuld",     color: "#ef6c00" },
};

const mono = { fontFamily: "var(--font-mono)" };

export default function AssetTable({ data, holdings = [], fxToSek = {}, isMobile, onSelectHolding, onNavigate }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [mode, setMode] = useState("assets");
  const [typeFilter, setTypeFilter] = useState(null);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const assets = [];
    for (const h of holdings) {
      const cur = h.currency || "SEK";
      const rate = cur === "SEK" ? 1 : fxToSek[cur];
      const valueSek = rate != null && h.price && h.shares ? h.price * h.shares * rate : null;
      assets.push({
        id: `h-${h.id}`, type: h.type === "fund" ? "fund" : "stock",
        name: h.name || h.ticker, sub: h.ticker, valueSek,
        changePct: h.changePercent ?? null, holding: h,
      });
    }
    if (data.pensionValue != null) {
      assets.push({ id: "pension", type: "pension", name: t("myFinances.pension"), sub: data.pensionLabel || "ITP", valueSek: data.pensionValue, nav: ["investment", { subTab: "pension" }] });
    }
    for (const r of data.assets || []) {
      assets.push({ id: r.id, type: r.kind, name: r.label, sub: r.metadata?.address || r.metadata?.regNumber || null, valueSek: Number(r.value_sek) });
    }
    const debts = (data.debts || []).map(r => ({
      id: r.id, type: r.kind, name: r.label, sub: r.metadata?.lender || null, valueSek: Number(r.value_sek),
    }));
    const sortDesc = (a, b) => (b.valueSek ?? -1) - (a.valueSek ?? -1);
    return { assets: assets.sort(sortDesc), debts: debts.sort(sortDesc) };
  }, [holdings, fxToSek, data, t]);

  const list = mode === "assets" ? rows.assets : rows.debts;
  const total = list.reduce((s, r) => s + (r.valueSek ?? 0), 0);
  const typesPresent = [...new Set(list.map(r => r.type))];
  const q = query.trim().toLowerCase();
  const filtered = list.filter(r =>
    (!typeFilter || r.type === typeFilter) &&
    (!q || r.name.toLowerCase().includes(q) || (r.sub || "").toLowerCase().includes(q))
  );

  const fmt = v => `${v.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} SEK`;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: isMobile ? 12 : 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 18, padding: isMobile ? "10px 14px 0" : "12px 22px 0", borderBottom: "1px solid var(--border-light)" }}>
        {["assets", "debts"].map(m => (
          <button key={m} onClick={() => { setMode(m); setTypeFilter(null); }}
            style={{
              fontSize: 14, fontWeight: mode === m ? 600 : 400, padding: "6px 0 10px", background: "none", border: "none",
              borderBottom: `2px solid ${mode === m ? "var(--text)" : "transparent"}`, marginBottom: -1,
              color: mode === m ? "var(--text)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
            }}>
            {t(`assetTable.${m}`)}
          </button>
        ))}
      </div>

      {/* Filterrad: typ-chips + sök */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: isMobile ? "10px 14px" : "12px 22px" }}>
        <button onClick={() => setTypeFilter(null)}
          style={{ fontSize: 11, padding: "5px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${!typeFilter ? "var(--accent)" : "var(--border)"}`, background: !typeFilter ? "var(--accent-light)" : "var(--bg-card)", color: !typeFilter ? "var(--accent)" : "var(--text-secondary)", fontWeight: !typeFilter ? 600 : 400 }}>
          {t("assetTable.allTypes")}
        </button>
        {typesPresent.map(tp => {
          const meta = TYPE_META[tp] || TYPE_META.ovrigt;
          const active = typeFilter === tp;
          return (
            <button key={tp} onClick={() => setTypeFilter(active ? null : tp)}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, border: `1px solid ${active ? meta.color : "var(--border)"}`, background: active ? `${meta.color}1a` : "var(--bg-card)", color: active ? meta.color : "var(--text-secondary)", fontWeight: active ? 600 : 400 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color }} />
              {meta.label}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("assetTable.search")}
            style={{ fontSize: 12, border: "none", background: "none", color: "var(--text)", fontFamily: "inherit", outline: "none", width: isMobile ? 90 : 140 }} />
        </div>
      </div>

      {/* Tabell */}
      {list.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "24px 22px 28px" }}>{t("assetTable.empty")}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 420 : undefined }}>
            <thead>
              <tr style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                <th style={{ textAlign: "left", fontWeight: 500, padding: isMobile ? "6px 14px" : "6px 22px" }}>{t("assetTable.name")}</th>
                {!isMobile && <th style={{ textAlign: "left", fontWeight: 500, padding: "6px 10px" }}>{t("assetTable.type")}</th>}
                <th style={{ textAlign: "left", fontWeight: 500, padding: "6px 10px", width: isMobile ? 90 : 160 }}>{t("assetTable.share")}</th>
                <th style={{ textAlign: "right", fontWeight: 500, padding: isMobile ? "6px 14px" : "6px 22px" }}>{t("assetTable.value")}</th>
              </tr>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <td style={{ padding: isMobile ? "10px 14px" : "10px 22px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {t("assetTable.total")} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", background: "var(--border-light)", borderRadius: 999, padding: "2px 8px", marginLeft: 6 }}>{t("assetTable.count", { count: list.length })}</span>
                </td>
                {!isMobile && <td />}
                <td />
                <td style={{ ...mono, padding: isMobile ? "10px 14px" : "10px 22px", fontSize: 13, fontWeight: 600, color: mode === "debts" ? "var(--neg)" : "var(--text)", textAlign: "right" }}>{mode === "debts" ? "−" : ""}{fmt(total)}</td>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "18px 22px", fontSize: 12, color: "var(--text-secondary)" }}>{t("assetTable.noMatch")}</td></tr>
              )}
              {filtered.map(r => {
                const meta = TYPE_META[r.type] || TYPE_META.ovrigt;
                const pct = total > 0 && r.valueSek != null ? (r.valueSek / total) * 100 : null;
                const clickable = !!(r.holding || r.nav);
                const onClick = () => {
                  if (r.holding) onSelectHolding?.(r.holding);
                  else if (r.nav) onNavigate?.(...r.nav);
                };
                return (
                  <tr key={r.id} onClick={clickable ? onClick : undefined}
                    style={{ borderTop: "1px solid var(--border-light)", cursor: clickable ? "pointer" : "default" }}
                    onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: isMobile ? "10px 14px" : "11px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <IconBadge kind={r.type} color={meta.color} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          {r.sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", ...(r.holding ? mono : {}) }}>{r.sub}</div>}
                        </div>
                      </div>
                    </td>
                    {!isMobile && (
                      <td style={{ padding: "11px 10px" }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{meta.label}</span>
                      </td>
                    )}
                    <td style={{ padding: "11px 10px" }}>
                      {pct != null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border-light)", overflow: "hidden", maxWidth: 90 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: meta.color }} />
                          </div>
                          <span style={{ ...mono, fontSize: 11, color: "var(--text-secondary)", width: 42, textAlign: "right" }}>{pct.toFixed(pct < 1 ? 2 : 1)}%</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: isMobile ? "10px 14px" : "11px 22px", textAlign: "right" }}>
                      <div style={{ ...mono, fontSize: 13, color: mode === "debts" ? "var(--neg)" : "var(--text)" }}>
                        {r.valueSek != null ? `${mode === "debts" ? "−" : ""}${fmt(r.valueSek)}` : "—"}
                      </div>
                      {r.changePct != null && r.changePct !== 0 && (
                        <div style={{ ...mono, fontSize: 10, color: r.changePct >= 0 ? "var(--pos)" : "var(--neg)" }}>{r.changePct >= 0 ? "+" : ""}{r.changePct.toFixed(2)}%</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
