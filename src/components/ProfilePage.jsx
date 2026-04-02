import { useState } from "react";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { sanitizeInput } from "../lib/sanitize.js";
import { useUser } from "../contexts/UserContext.jsx";

const INVESTOR_LABELS = { value: "Värdeinvesterare", growth: "Tillväxtinvesterare", dividend: "Utdelningsinvesterare", index: "Indexinvesterare", mixed: "Blandat" };
const RISK_LABELS = { low: "Låg risk", medium: "Medel risk", high: "Hög risk" };
const FOCUS_LABELS = { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" };
const EXP_LABELS = { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" };
const GEO_LABELS = { nordic: "Norden", global: "Globalt", both: "Blandat" };
const INTEREST_LABELS = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };

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

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: isMobile ? 16 : 24, marginBottom: 16 };
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
                  {saved && <span style={{ fontSize: 11, color: "#089981" }}>Sparat!</span>}
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

      {/* Investor Profile */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={labelStyle}>Investerarprofil</div>
          <button onClick={onResetProfile}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Ändra profil →
          </button>
        </div>

        {profile ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <div style={fieldLabel}>Investerartyp</div>
              <div style={fieldValue}>{INVESTOR_LABELS[profile.investorType] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>Risknivå</div>
              <div style={fieldValue}>{RISK_LABELS[profile.riskProfile] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>Fokus</div>
              <div style={fieldValue}>{FOCUS_LABELS[profile.focus] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>Erfarenhet</div>
              <div style={fieldValue}>{EXP_LABELS[profile.experience] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>Geografi</div>
              <div style={fieldValue}>{GEO_LABELS[profile.geography] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>Intressen</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(profile.interests || []).map(i => (
                  <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#e8f5e9", color: "#1b5e20", fontWeight: 500 }}>
                    {INTEREST_LABELS[i] || i}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ingen profil skapad ännu. Klicka "Ändra profil" för att komma igång.</div>
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
                background: (preferences.sharePortfolioWithAI !== false) ? "#089981" : "var(--border)",
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
              <div style={{ fontSize: 13, color: "#c62828" }}>Radera konto</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>All data raderas permanent</div>
            </div>
            <button disabled
              style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "#c62828", border: "1px solid #fce4ec", borderRadius: 4, cursor: "not-allowed", fontFamily: "inherit", opacity: 0.5 }}
              title="Kontakta support för att radera konto">
              Radera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
