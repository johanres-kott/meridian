import { useState } from "react";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

const INVESTOR_LABELS = { value: "Värdeinvesterare", growth: "Tillväxtinvesterare", dividend: "Utdelningsinvesterare", index: "Indexinvesterare", mixed: "Blandat" };
const RISK_LABELS = { low: "Låg risk", medium: "Medel risk", high: "Hög risk" };
const FOCUS_LABELS = { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" };
const EXP_LABELS = { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" };
const GEO_LABELS = { nordic: "Norden", global: "Globalt", both: "Blandat" };
const INTEREST_LABELS = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };

export default function ProfilePage({ session, preferences, onUpdatePreferences, onResetProfile }) {
  const isMobile = useIsMobile();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(preferences.display_name || "");
  const [saved, setSaved] = useState(false);

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";
  const email = session?.user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const profile = preferences.investorProfile;

  async function saveName() {
    if (!nameInput.trim()) return;
    await onUpdatePreferences({ display_name: nameInput.trim() });
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const cardStyle = { background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const labelStyle = { fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 };
  const fieldLabel = { fontSize: 11, color: "#787b86", marginBottom: 4 };
  const fieldValue = { fontSize: 14, color: "#131722", fontWeight: 500 };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "#131722", marginBottom: 20 }}>Profil</h1>

      {/* Avatar + Name + Email */}
      <div style={cardStyle}>
        <div style={labelStyle}>Kontoinformation</div>
        <div style={{ display: "flex", gap: 20, alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row" }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#2962ff", color: "#fff",
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
                    style={{ flex: 1, padding: "6px 10px", border: "1px solid #2962ff", borderRadius: 4, fontSize: 14, fontFamily: "inherit", outline: "none", maxWidth: 250 }}
                  />
                  <button onClick={saveName} style={{ padding: "6px 14px", fontSize: 12, background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Spara</button>
                  <button onClick={() => setEditingName(false)} style={{ padding: "6px 14px", fontSize: 12, background: "#fff", color: "#787b86", border: "1px solid #e0e3eb", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={fieldValue}>{displayName}</span>
                  <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    style={{ fontSize: 11, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Ändra
                  </button>
                  {saved && <span style={{ fontSize: 11, color: "#089981" }}>Sparat!</span>}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <div style={fieldLabel}>E-post</div>
              <div style={{ ...fieldValue, color: "#787b86", fontWeight: 400 }}>{email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Investor Profile */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={labelStyle}>Investerarprofil</div>
          <button onClick={onResetProfile}
            style={{ fontSize: 11, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
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
          <div style={{ fontSize: 13, color: "#787b86" }}>Ingen profil skapad ännu. Klicka "Ändra profil" för att komma igång.</div>
        )}
      </div>

      {/* Account actions */}
      <div style={cardStyle}>
        <div style={labelStyle}>Konto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#131722" }}>Logga ut</div>
              <div style={{ fontSize: 11, color: "#787b86" }}>Du loggas ut från alla enheter</div>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ padding: "6px 14px", fontSize: 12, background: "#fff", color: "#787b86", border: "1px solid #e0e3eb", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
              Logga ut
            </button>
          </div>
          <div style={{ borderTop: "1px solid #f0f3fa", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#c62828" }}>Radera konto</div>
              <div style={{ fontSize: 11, color: "#787b86" }}>All data raderas permanent</div>
            </div>
            <button disabled
              style={{ padding: "6px 14px", fontSize: 12, background: "#fff", color: "#c62828", border: "1px solid #fce4ec", borderRadius: 4, cursor: "not-allowed", fontFamily: "inherit", opacity: 0.5 }}
              title="Kontakta support för att radera konto">
              Radera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
