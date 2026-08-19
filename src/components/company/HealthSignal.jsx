import { useState, useEffect } from "react";

// Vardagsspråk-svar på "Går bolaget bra?" byggt på befintliga /api/score.
// Visar ingenting alls om score saknas — vi hittar aldrig på data.

function verdictFor(score) {
  if (score >= 70) return { label: "Ja", text: "Bolaget ser välmående ut", color: "var(--pos)", bg: "rgba(15,154,108,0.10)" };
  if (score >= 40) return { label: "Sådär", text: "Blandad bild — både styrkor och svagheter", color: "var(--warn)", bg: "rgba(255,152,0,0.10)" };
  return { label: "Nej", text: "Siffrorna är svaga just nu", color: "var(--neg)", bg: "rgba(200,40,40,0.10)" };
}

function levelFor(value) {
  if (value == null) return null;
  if (value >= 70) return { text: "stark", color: "var(--pos)" };
  if (value >= 40) return { text: "okej", color: "var(--warn)" };
  return { text: "svag", color: "var(--neg)" };
}

const DRIVERS = [
  { key: "quality", label: "Lönsamhet", hint: "Marginaler, kapitalavkastning och skuldsättning" },
  { key: "growth", label: "Tillväxt", hint: "Omsättningsutveckling och trend" },
  { key: "piotroski", label: "Finansiell hälsa", hint: "Piotroski F-Score: 9 kriterier för finansiell styrka" },
  { key: "dividend", label: "Utdelning", hint: "Utdelningens nivå och stabilitet" },
];

export default function HealthSignal({ ticker, investorProfile }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d) setResult({ ticker, data: d }); })
      .catch(err => { console.error(`HealthSignal: score fetch failed for ${ticker}:`, err); });
    return () => { cancelled = true; };
  }, [ticker]);

  const scoreData = result?.ticker === ticker ? result.data : null;
  if (!scoreData?.composite) return null;

  const profileType = investorProfile?.investorType || "mixed";
  const composite = scoreData.composite[profileType] ?? scoreData.composite.mixed;
  if (composite == null) return null;

  const verdict = verdictFor(composite);
  const drivers = DRIVERS.map(d => {
    const value = d.key === "piotroski" ? scoreData.scores?.piotroski?.normalized : scoreData.scores?.[d.key];
    return { ...d, level: levelFor(value) };
  }).filter(d => d.level);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: verdict.bg }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: verdict.color, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>
          {verdict.label}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Går bolaget bra?</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{verdict.text}</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: verdict.color, fontFamily: "var(--font-mono)" }}>{Math.round(composite)}</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}> / 100</span>
        </div>
      </div>
      {drivers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", padding: "12px 20px" }}>
          {drivers.map(d => (
            <div key={d.key} title={d.hint} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.level.color, flexShrink: 0 }} />
              <span style={{ color: "var(--text)" }}>{d.label}:</span>
              <span style={{ color: d.level.color, fontWeight: 500 }}>{d.level.text}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "8px 20px", borderTop: "1px solid var(--border-light)", fontSize: 10, color: "var(--text-muted)" }}>
        Baserat på Thesions poängmodell (Piotroski, Magic Formula m.fl.) · Utgör inte finansiell rådgivning
      </div>
    </div>
  );
}
