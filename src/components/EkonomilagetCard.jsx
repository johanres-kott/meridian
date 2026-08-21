import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Ekonomiläget på Hem: tre officiella siffror från /api/econ-overview
// (Riksbankens styrränta, SCB:s småhuspriser och KPIF). Enbart officiell
// statistik med källänkar; användarens egen bolåneränta visas bredvid
// styrräntan som ren information — ingen jämförelse-värdering, inga råd
// (COMPLIANCE.md). Saknas hela svaret renderas ingenting; saknas ett block
// visas bara de celler som finns.

const RIKSBANKEN_URL = "https://www.riksbank.se/sv/statistik/rantor-och-valutakurser/";
const SCB_URL = "https://www.scb.se";

function dateLocale(lang) {
  return lang === "en" ? "en-GB" : "sv-SE";
}

// "2026-06-17" → t.ex. "17 juni 2026" (faller tillbaka på råsträngen)
function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
    .toLocaleDateString(dateLocale(lang), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// "2026M07" → t.ex. "juli 2026" (faller tillbaka på råsträngen)
function formatScbMonth(code, lang) {
  const m = /^(\d{4})M(\d{2})$/.exec(String(code || ""));
  if (!m) return code;
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1))
    .toLocaleDateString(dateLocale(lang), { month: "long", year: "numeric", timeZone: "UTC" });
}

// Procenttal med tecken och decimalkomma på svenska: 1.0 → "+1,0 %"
function formatSignedPct(x, lang) {
  const s = `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(1)} %`;
  return lang === "en" ? s.replace("−", "-") : s.replace(".", ",");
}

// Styrräntan som Riksbanken skriver den: 1.75 → "1,75 %"
function formatRate(x, lang) {
  const s = `${x.toFixed(2)} %`;
  return lang === "en" ? s : s.replace(".", ",");
}

// Användarens bolåneräntor (bolån/skulder med metadata.interestRate):
// en post → dess ränta, flera → spann "2,59–3,4 %". Samma sifferformat som
// ManualAssetView (originalprecision, decimalkomma).
function mortgageRateText(debts) {
  const rates = (debts || [])
    .filter(d => (d?.kind === "bolan" || d?.kind === "skuld") && d?.metadata?.interestRate != null)
    .map(d => Number(d.metadata.interestRate))
    .filter(r => Number.isFinite(r));
  if (rates.length === 0) return null;
  const fmt = (r) => String(r).replace(".", ",");
  const min = Math.min(...rates), max = Math.max(...rates);
  return min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
}

export default function EkonomilagetCard({ data, isMobile }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [econ, setEcon] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/econ-overview")
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled) setEcon(json); })
      .catch(() => { if (!cancelled) setEcon(null); });
    return () => { cancelled = true; };
  }, []);

  const { policyRate, kpif, housing } = econ || {};
  const cells = [policyRate, housing, kpif].filter(Boolean).length;
  // Hela svaret saknas (fetch-fel eller alla block null): inget tomt kort
  if (!econ || cells === 0) return null;

  const mortgageRate = mortgageRateText(data?.debts);
  const mono = { fontFamily: "var(--font-mono)" };
  const cellStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 12px" };
  const labelStyle = { fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 };
  const bigStyle = { ...mono, fontSize: 20, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 };
  const subStyle = { fontSize: 11, color: "var(--text-secondary)", marginTop: 4 };
  const linkStyle = { color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 2 };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: isMobile ? "14px 16px" : "16px 22px", marginBottom: isMobile ? 12 : 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{t("econ.title")}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${cells}, 1fr)`, gap: 10 }}>
        {policyRate && (
          <div style={cellStyle}>
            <div style={labelStyle}>{t("econ.policyRate")}</div>
            <div style={bigStyle}>{formatRate(policyRate.value, lang)}</div>
            <div style={subStyle}>
              {policyRate.since
                ? t("econ.unchangedSince", { date: formatDate(policyRate.since, lang) })
                : formatDate(policyRate.date, lang)}
            </div>
            {mortgageRate && (
              <div style={subStyle}>{t("econ.yourMortgageRate", { rate: mortgageRate })}</div>
            )}
          </div>
        )}
        {housing && (
          <div style={cellStyle}>
            <div style={labelStyle}>{t("econ.housing")}</div>
            <div style={{ ...bigStyle, color: housing.qoqPct >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {formatSignedPct(housing.qoqPct, lang)}
            </div>
            <div style={subStyle}>{t("econ.housingSub", { quarter: housing.quarter })}</div>
          </div>
        )}
        {kpif && (
          <div style={cellStyle}>
            <div style={labelStyle}>{t("econ.kpif")}</div>
            <div style={bigStyle}>{formatSignedPct(kpif.yoyPct, lang)}</div>
            <div style={subStyle}>{t("econ.kpifSub", { month: formatScbMonth(kpif.month, lang) })}</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 10 }}>
        {t("econ.sources")}{" "}
        <a href={RIKSBANKEN_URL} target="_blank" rel="noreferrer" style={linkStyle}>Riksbanken</a>
        {" · "}
        <a href={SCB_URL} target="_blank" rel="noreferrer" style={linkStyle}>SCB</a>
      </div>
    </div>
  );
}
