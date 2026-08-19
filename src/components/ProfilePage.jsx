import { useState } from "react";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { sanitizeInput } from "../lib/sanitize.js";
import { GOAL_LABELS, SITUATION_LABELS } from "./onboarding/steps.js";

const LIFE_LABELS = { starting: "I början", building: "Bygger upp", established: "Etablerad", preRetire: "Närmar mig pension" };
const STYLE_LABELS = { safe: "Tryggt och enkelt", balanced: "Balanserat", active: "Engagerat" };
import { useUser } from "../contexts/UserContext.jsx";
import { getPensionEntries, getPensionTotalValue } from "../lib/pension.js";

const INVESTOR_LABELS = { value: "Värdeinvesterare", growth: "Tillväxtinvesterare", dividend: "Utdelningsinvesterare", index: "Indexinvesterare", mixed: "Blandat" };
const RISK_LABELS = { low: "Låg risk", medium: "Medel risk", high: "Hög risk" };
const EXP_LABELS = { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" };

export default function ProfilePage({ onResetProfile }) {
  const { session, preferences, updatePreferences } = useUser();
  const isMobile = useIsMobile();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(preferences.display_name || "");
  const [saved, setSaved] = useState(false);

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";
  const email = session?.user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const profile = preferences.investorProfile;

  async function saveName() {
    const sanitized = sanitizeInput(nameInput);
    if (!sanitized) return;
    await updatePreferences({ display_name: sanitized });
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: isMobile ? 16 : 24, marginBottom: 16 };
  const labelStyle = { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 };
  const fieldLabel = { fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 };
  const fieldValue = { fontSize: 14, color: "var(--text)", fontWeight: 500 };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>Profil</h1>

      {/* Avatar + Name + Email */}
      <div style={cardStyle}>
        <div style={labelStyle}>Kontoinformation</div>
        <div style={{ display: "flex", gap: 20, alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row" }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 600, flexShrink: 0,
          }}>
            {initial}
          </div>

          <div style={{ flex: 1 }}>
            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <div style={fieldLabel}>Visningsnamn</div>
              {editingName ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus
                    style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--accent)", borderRadius: 4, fontSize: 14, fontFamily: "inherit", outline: "none", maxWidth: 250, background: "var(--bg-card)", color: "var(--text)" }}
                  />
                  <button onClick={saveName} style={{ padding: "6px 14px", fontSize: 12, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Spara</button>
                  <button onClick={() => setEditingName(false)} style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={fieldValue}>{displayName}</span>
                  <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Ändra
                  </button>
                  {saved && <span style={{ fontSize: 11, color: "var(--pos)" }}>Sparat!</span>}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <div style={fieldLabel}>E-post</div>
              <div style={{ ...fieldValue, color: "var(--text-secondary)", fontWeight: 400 }}>{email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ekonomiprofil (v2) — äldre profiler visas med gamla fälten + nudge */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={labelStyle}>Ekonomiprofil</div>
          <button onClick={onResetProfile}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {profile?.version === 2 ? "Gör om profilen →" : "Skapa ekonomiprofil →"}
          </button>
        </div>

        {profile?.version === 2 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              <div>
                <div style={fieldLabel}>Var i livet</div>
                <div style={fieldValue}>{LIFE_LABELS[profile.lifeStage] || "–"}</div>
              </div>
              <div>
                <div style={fieldLabel}>Hur du vill ha det</div>
                <div style={fieldValue}>{STYLE_LABELS[profile.style] || "–"}</div>
              </div>
              <div>
                <div style={fieldLabel}>Erfarenhet</div>
                <div style={fieldValue}>{EXP_LABELS[profile.experience] || "–"}</div>
              </div>
            </div>
            {(profile.situation?.length > 0) && (
              <div style={{ marginTop: 14 }}>
                <div style={fieldLabel}>Din situation</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {profile.situation.map(k => <span key={k} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, background: "var(--bg-raised)", color: "var(--text-secondary)", fontWeight: 500 }}>{SITUATION_LABELS[k] || k}</span>)}
                </div>
              </div>
            )}
            {(profile.goals?.length > 0) && (
              <div style={{ marginTop: 12 }}>
                <div style={fieldLabel}>Dina mål</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {profile.goals.map(k => <span key={k} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, background: "var(--brand-tint)", color: "var(--green-700)", fontWeight: 600 }}>{GOAL_LABELS[k] || k}</span>)}
                </div>
              </div>
            )}
          </>
        ) : profile ? (
          <>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 12, padding: "10px 12px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)" }}>
              Den här profilen är gjord med den gamla investerarprofilen. Thesion handlar nu om hela din ekonomi — gör om profilen (tar en minut) så anpassas appen efter din situation och dina mål.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              <div><div style={fieldLabel}>Investerartyp</div><div style={fieldValue}>{INVESTOR_LABELS[profile.investorType] || "–"}</div></div>
              <div><div style={fieldLabel}>Risknivå</div><div style={fieldValue}>{RISK_LABELS[profile.riskProfile] || "–"}</div></div>
              <div><div style={fieldLabel}>Erfarenhet</div><div style={fieldValue}>{EXP_LABELS[profile.experience] || "–"}</div></div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ingen profil skapad ännu. Klicka ”Skapa ekonomiprofil” för att komma igång.</div>
        )}
      </div>

      {/* Pension */}
      <div style={cardStyle}>
        <div style={labelStyle}>Pensionssparande</div>
        {(preferences.pension?.itpType || getPensionEntries(preferences.pension).length > 0) ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={fieldLabel}>ITP-typ</div>
                <div style={fieldValue}>{preferences.pension?.itpType || "–"}</div>
              </div>
              <div>
                <div style={fieldLabel}>Månadsinbetalning</div>
                <div style={{ ...fieldValue, fontFamily: "var(--font-mono)" }}>
                  {preferences.pension?.monthlyContribution != null
                    ? `${Number(preferences.pension.monthlyContribution).toLocaleString("sv-SE")} kr`
                    : "–"}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>Totalt kapital</div>
                <div style={{ ...fieldValue, fontFamily: "var(--font-mono)" }}>
                  {getPensionTotalValue(preferences.pension) != null
                    ? `${getPensionTotalValue(preferences.pension).toLocaleString("sv-SE")} kr`
                    : "–"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {getPensionEntries(preferences.pension).map((e, i) => (
                <div key={e.id || i} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: e.funds?.length ? 6 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {e.provider || "Okänt bolag"}
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8, fontWeight: 400 }}>
                        {e.insuranceType === "fond" ? "Fondförsäkring" : e.insuranceType === "trad" ? "Traditionell" : ""}
                      </span>
                    </div>
                    {e.currentValue != null && (
                      <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                        {Number(e.currentValue).toLocaleString("sv-SE")} kr
                      </span>
                    )}
                  </div>
                  {e.funds?.length > 0 && e.funds.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", padding: "2px 0" }}>
                      <span>{f.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{f.allocation}%{f.fee != null ? ` (avg. ${f.fee}%)` : ""}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => updatePreferences({ pension: {} })}
              style={{ fontSize: 11, color: "var(--neg)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Rensa pensionsdata
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Ingen pensionsdata registrerad. Gå till Investera → Pension → Tjänstepension för att fylla i.
          </div>
        )}
      </div>

      {/* Account type */}
      <div style={cardStyle}>
        <div style={labelStyle}>Kontotyp</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          Påverkar skatteråd från Mats. ISK har schablonbeskattning — inga förlustavdrag.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { value: "isk", label: "ISK", desc: "Investeringssparkonto" },
            { value: "af", label: "AF", desc: "Aktie- & fondkonto" },
            { value: "kf", label: "KF", desc: "Kapitalförsäkring" },
            { value: "unknown", label: "Vet inte", desc: "" },
          ].map(opt => {
            const current = preferences.accountType || "unknown";
            const isActive = current === opt.value;
            return (
              <button key={opt.value}
                onClick={() => updatePreferences({ accountType: opt.value })}
                style={{
                  padding: "8px 14px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: isActive ? "var(--accent-light)" : "var(--bg-card)",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {opt.label}
                {opt.desc && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>{opt.desc}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy & AI */}
      <div style={cardStyle}>
        <div style={labelStyle}>Integritet & AI</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>Dela portföljdata med AI</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>AI-assistenten kan ge personliga svar baserat på dina innehav</div>
            </div>
            <button
              onClick={() => updatePreferences({ sharePortfolioWithAI: !(preferences.sharePortfolioWithAI !== false) })}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: (preferences.sharePortfolioWithAI !== false) ? "var(--pos)" : "var(--border)",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: (preferences.sharePortfolioWithAI !== false) ? 23 : 3,
                transition: "left 0.2s",
              }} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Din portföljdata skickas till Anthropic (Claude) under chattsamtal för att ge relevanta svar. Data sparas inte av Anthropic och används inte för träning. Du kan stänga av detta när som helst.
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div style={cardStyle}>
        <div style={labelStyle}>Konto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>Logga ut</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Du loggas ut från alla enheter</div>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
              Logga ut
            </button>
          </div>
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--neg)" }}>Radera konto</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>All data raderas permanent</div>
            </div>
            <button disabled
              style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "var(--neg)", border: "1px solid #fce4ec", borderRadius: 4, cursor: "not-allowed", fontFamily: "inherit", opacity: 0.5 }}
              title="Kontakta support för att radera konto">
              Radera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
