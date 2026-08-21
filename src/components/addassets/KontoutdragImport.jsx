import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase.js";
import { useUser } from "../../contexts/UserContext.jsx";
import { createManualAsset, updateManualAsset } from "../../lib/manualAssets.js";
import { parseBankStatement, decodeStatementBuffer, BANK_LABELS } from "../../lib/parseBankStatement.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { ChipSelect, SaveError } from "./wizardShared.jsx";

// Importera kontoutdrag (CSV från t.ex. Nordea eller SEB): läser saldot ur
// filen och sparar det som ett sparkonto — nytt eller befintligt. Visar också
// en månadssammanställning av in- och utflöden som referens för kassaflödet.
// Allt sker lokalt i webbläsaren; transaktionerna laddas aldrig upp.

const fmtKr = (v) => `${Math.round(v).toLocaleString("sv-SE")} kr`;
const MONTH_NAMES = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const fmtMonth = (ym) => {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
};
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m} ${y}`;
};

export default function KontoutdragImport({ onSaved, onBack }) {
  const isMobile = useIsMobile();
  const { userId } = useUser();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [mode, setMode] = useState("new"); // new | update
  const [targetId, setTargetId] = useState(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Befintliga sparkonton/buffertar att uppdatera (läsning direkt mot Supabase,
  // samma mönster som useNetWorth).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.from("manual_assets").select("id,kind,label,value_sek,metadata")
      .eq("user_id", userId).in("kind", ["sparkonto", "buffert"]).order("created_at")
      .then(({ data, error: err }) => {
        if (!cancelled && !err) setAccounts(data || []);
      });
    return () => { cancelled = true; };
  }, [userId]);

  async function handleFile(file) {
    if (!file) return;
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseBankStatement(decodeStatementBuffer(buffer));
      setFileName(file.name);
      setResult(parsed);
      if (!parsed.errors.length) {
        setLabel(parsed.bank !== "okand" ? `${BANK_LABELS[parsed.bank]} konto` : "Bankkonto");
      }
    } catch (err) {
      console.error("KontoutdragImport: kunde inte läsa filen:", err);
      setResult({ errors: ["Kunde inte läsa filen — är det en CSV-export från internetbanken?"], warnings: [], monthly: [], transactions: [], latestBalance: null, bank: "okand" });
      setFileName(file.name);
    }
  }

  async function save() {
    if (!result?.latestBalance || saving) return;
    const balance = result.latestBalance.value;
    setSaving(true);
    setError(null);
    try {
      if (mode === "update" && targetId) {
        const target = accounts.find(a => a.id === targetId);
        // PATCH ersätter metadata i sin helhet — behåll befintlig och lägg till
        // varifrån saldot kom, så raden kan visa det.
        await updateManualAsset(targetId, {
          value_sek: balance,
          metadata: { ...(target?.metadata || {}), lastStatementDate: result.latestBalance.date, lastStatementBank: result.bank },
        });
      } else {
        if (!label.trim()) { setSaving(false); return; }
        await createManualAsset({
          kind: "sparkonto",
          label: label.trim(),
          value_sek: balance,
          is_debt: false,
          metadata: { bank: result.bank !== "okand" ? BANK_LABELS[result.bank] : undefined, lastStatementDate: result.latestBalance.date, lastStatementBank: result.bank },
        });
      }
      onSaved();
    } catch (err) {
      console.error("KontoutdragImport: kunde inte spara:", err);
      setError(err.message || true);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", fontSize: 14, padding: "10px 0", border: "none",
    borderBottom: "1px solid var(--border)", background: "none",
    color: "var(--text)", fontFamily: "inherit", outline: "none",
  };
  const cardStyle = {
    border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)",
    background: "var(--bg-card)", padding: "16px 18px",
  };

  const ok = result && !result.errors.length;
  const canSave = ok && result.latestBalance != null &&
    (mode === "update" ? targetId != null : label.trim().length > 0);

  return (
    <div style={{ maxWidth: 640 }}>
      <button onClick={onBack}
        style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
        ‹ Tillbaka
      </button>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
        Importera kontoutdrag
      </h1>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
        Exportera ett kontoutdrag som CSV från din internetbank (Nordea och SEB känns igen
        automatiskt) och släpp filen här. Saldot läses ur filen — du väljer själv om det ska
        sparas. Filen läses lokalt i din webbläsare; transaktionerna laddas aldrig upp.
      </div>

      {/* Filväljare */}
      <input ref={fileRef} type="file" accept=".csv,.CSV,.txt,.TXT" style={{ display: "none" }}
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        style={{
          ...cardStyle, cursor: "pointer", textAlign: "center", padding: "26px 18px",
          borderStyle: "dashed", marginBottom: 16,
        }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          {fileName ? `Vald fil: ${fileName}` : "Välj eller släpp en CSV-fil"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {fileName ? "Klicka för att välja en annan fil" : "Kontoutdrag i CSV-format (.csv eller .txt)"}
        </div>
      </div>

      {/* Fel */}
      {result?.errors.map((e, i) => (
        <div key={i} style={{ fontSize: 13, color: "var(--neg)", marginBottom: 10 }}>{e}</div>
      ))}

      {ok && (
        <>
          {/* Sammanfattning */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
              {BANK_LABELS[result.bank]} · {result.transactions.length} bokförda transaktioner
              · {fmtDate(result.period.from)} – {fmtDate(result.period.to)}
            </div>
            {result.latestBalance ? (
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
                Saldo {fmtKr(result.latestBalance.value)}
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 8 }}>
                  per {fmtDate(result.latestBalance.date)}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Filen saknar saldokolumn — månadssammanställningen visas ändå, men det finns
                inget saldo att spara.
              </div>
            )}
            {result.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>ⓘ {w}</div>
            ))}
          </div>

          {/* Månadssammanställning */}
          {result.monthly.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                In och ut per månad
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "var(--text-secondary)", fontSize: 11, textAlign: "right" }}>
                    <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 6 }}>Månad</th>
                    <th style={{ fontWeight: 500, paddingBottom: 6 }}>In</th>
                    <th style={{ fontWeight: 500, paddingBottom: 6 }}>Ut</th>
                    <th style={{ fontWeight: 500, paddingBottom: 6 }}>Netto</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthly.slice(0, 6).map(m => (
                    <tr key={m.month} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "7px 0", color: "var(--text)" }}>
                        {fmtMonth(m.month)}
                        {m.partial && <span style={{ fontSize: 11, color: "var(--text-muted)" }}> (del av månad)</span>}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--pos)" }}>{fmtKr(m.inSek)}</td>
                      <td style={{ textAlign: "right", color: "var(--neg)" }}>{fmtKr(m.outSek)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: m.netSek >= 0 ? "var(--pos)" : "var(--neg)" }}>
                        {m.netSek >= 0 ? "+" : "−"}{fmtKr(Math.abs(m.netSek))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                Referens för ditt kassaflöde — sammanställningen sparas inte.
              </div>
            </div>
          )}

          {/* Spara saldot */}
          {result.latestBalance && (
            <div style={{ ...cardStyle }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                Spara saldot som sparkonto
              </div>
              {accounts.length > 0 && (
                <ChipSelect
                  options={[
                    { value: "new", label: "Nytt konto" },
                    { value: "update", label: "Uppdatera befintligt" },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
              )}
              {mode === "update" && accounts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {accounts.map(a => (
                    <button key={a.id} onClick={() => setTargetId(a.id)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                        textAlign: "left", fontSize: 13, padding: "9px 14px", borderRadius: 10,
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1px solid ${targetId === a.id ? "var(--accent)" : "var(--border)"}`,
                        background: targetId === a.id ? "var(--accent-light)" : "none",
                        color: "var(--text)",
                      }}>
                      <span style={{ fontWeight: targetId === a.id ? 600 : 400 }}>{a.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {fmtKr(Number(a.value_sek) || 0)} → {fmtKr(result.latestBalance.value)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <input value={label} onChange={e => setLabel(e.target.value)}
                    placeholder="Namn (t.ex. Lönekonto Nordea)" style={inputStyle} />
                </div>
              )}

              <button onClick={save} disabled={!canSave || saving}
                style={{
                  marginTop: 18, fontSize: 14, fontWeight: 600, padding: "10px 28px", borderRadius: 20,
                  border: "none", background: canSave ? "var(--accent)" : "var(--border)",
                  color: canSave ? "#fff" : "var(--text-secondary)",
                  cursor: canSave ? (saving ? "wait" : "pointer") : "default",
                  fontFamily: "inherit", opacity: saving ? 0.6 : 1,
                }}>
                {saving ? "Sparar..." : `Spara saldo ${fmtKr(result.latestBalance.value)}`}
              </button>
              <SaveError error={error} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
