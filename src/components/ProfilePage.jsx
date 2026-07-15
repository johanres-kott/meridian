import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { sanitizeInput } from "../lib/sanitize.js";
import { useUser } from "../contexts/UserContext.jsx";
import { getPensionEntries, getPensionTotalValue } from "../lib/pension.js";

const getInvestorLabels = (t) => ({ value: t("profilePage.investorLabels.value"), growth: t("profilePage.investorLabels.growth"), dividend: t("profilePage.investorLabels.dividend"), index: t("profilePage.investorLabels.index"), mixed: t("profilePage.investorLabels.mixed") });
const getRiskLabels = (t) => ({ low: t("profilePage.riskLabels.low"), medium: t("profilePage.riskLabels.medium"), high: t("profilePage.riskLabels.high") });
const getFocusLabels = (t) => ({ dividends: t("profilePage.focusLabels.dividends"), appreciation: t("profilePage.focusLabels.appreciation"), both: t("profilePage.focusLabels.both") });
const getExpLabels = (t) => ({ beginner: t("profilePage.expLabels.beginner"), intermediate: t("profilePage.expLabels.intermediate"), advanced: t("profilePage.expLabels.advanced") });
const getGeoLabels = (t) => ({ nordic: t("profilePage.geoLabels.nordic"), global: t("profilePage.geoLabels.global"), both: t("profilePage.geoLabels.both") });
const getInterestLabels = (t) => ({ tech: t("profilePage.interestLabels.tech"), finance: t("profilePage.interestLabels.finance"), industry: t("profilePage.interestLabels.industry"), healthcare: t("profilePage.interestLabels.healthcare"), realestate: t("profilePage.interestLabels.realestate"), food: t("profilePage.interestLabels.food"), energy: t("profilePage.interestLabels.energy"), gold: t("profilePage.interestLabels.gold"), sustainability: t("profilePage.interestLabels.sustainability"), gaming: t("profilePage.interestLabels.gaming"), fashion: t("profilePage.interestLabels.fashion"), defense: t("profilePage.interestLabels.defense"), ev: t("profilePage.interestLabels.ev"), crypto: t("profilePage.interestLabels.crypto") });

export default function ProfilePage({ onResetProfile }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const INVESTOR_LABELS = getInvestorLabels(t);
  const RISK_LABELS = getRiskLabels(t);
  const FOCUS_LABELS = getFocusLabels(t);
  const EXP_LABELS = getExpLabels(t);
  const GEO_LABELS = getGeoLabels(t);
  const INTEREST_LABELS = getInterestLabels(t);
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
      <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 20 }}>{t("profilePage.title")}</h1>

      {/* Avatar + Name + Email */}
      <div style={cardStyle}>
        <div style={labelStyle}>{t("profilePage.accountInfo")}</div>
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
              <div style={fieldLabel}>{t("profilePage.displayName")}</div>
              {editingName ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus
                    style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--accent)", borderRadius: 4, fontSize: 14, fontFamily: "inherit", outline: "none", maxWidth: 250, background: "var(--bg-card)", color: "var(--text)" }}
                  />
                  <button onClick={saveName} style={{ padding: "6px 14px", fontSize: 12, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>{t("profilePage.save")}</button>
                  <button onClick={() => setEditingName(false)} style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>{t("profilePage.cancel")}</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={fieldValue}>{displayName}</span>
                  <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    {t("profilePage.edit")}
                  </button>
                  {saved && <span style={{ fontSize: 11, color: "#089981" }}>{t("profilePage.savedConfirm")}</span>}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <div style={fieldLabel}>{t("profilePage.email")}</div>
              <div style={{ ...fieldValue, color: "var(--text-secondary)", fontWeight: 400 }}>{email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Investor Profile */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={labelStyle}>{t("profilePage.investorProfile")}</div>
          <button onClick={onResetProfile}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t("profilePage.editProfile")}
          </button>
        </div>

        {profile ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <div style={fieldLabel}>{t("profilePage.investorType")}</div>
              <div style={fieldValue}>{INVESTOR_LABELS[profile.investorType] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>{t("profilePage.riskLevel")}</div>
              <div style={fieldValue}>{RISK_LABELS[profile.riskProfile] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>{t("profilePage.focus")}</div>
              <div style={fieldValue}>{FOCUS_LABELS[profile.focus] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>{t("profilePage.experience")}</div>
              <div style={fieldValue}>{EXP_LABELS[profile.experience] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>{t("profilePage.geography")}</div>
              <div style={fieldValue}>{GEO_LABELS[profile.geography] || "–"}</div>
            </div>
            <div>
              <div style={fieldLabel}>{t("profilePage.interests")}</div>
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
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("profilePage.noProfile")}</div>
        )}
      </div>

      {/* Pension */}
      <div style={cardStyle}>
        <div style={labelStyle}>{t("profilePage.pensionSavings")}</div>
        {(preferences.pension?.itpType || getPensionEntries(preferences.pension).length > 0) ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={fieldLabel}>{t("profilePage.itpType")}</div>
                <div style={fieldValue}>{preferences.pension?.itpType || "–"}</div>
              </div>
              <div>
                <div style={fieldLabel}>{t("profilePage.monthlyContribution")}</div>
                <div style={{ ...fieldValue, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {preferences.pension?.monthlyContribution != null
                    ? t("profilePage.amountKr", { value: Number(preferences.pension.monthlyContribution).toLocaleString(numberLocale) })
                    : "–"}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>{t("profilePage.totalCapital")}</div>
                <div style={{ ...fieldValue, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {getPensionTotalValue(preferences.pension) != null
                    ? t("profilePage.amountKr", { value: getPensionTotalValue(preferences.pension).toLocaleString(numberLocale) })
                    : "–"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {getPensionEntries(preferences.pension).map((e, i) => (
                <div key={e.id || i} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: e.funds?.length ? 6 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {e.provider || t("profilePage.unknownProvider")}
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8, fontWeight: 400 }}>
                        {e.insuranceType === "fond" ? t("profilePage.fundInsurance") : e.insuranceType === "trad" ? t("profilePage.traditional") : ""}
                      </span>
                    </div>
                    {e.currentValue != null && (
                      <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                        {t("profilePage.amountKr", { value: Number(e.currentValue).toLocaleString(numberLocale) })}
                      </span>
                    )}
                  </div>
                  {e.funds?.length > 0 && e.funds.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", padding: "2px 0" }}>
                      <span>{f.name}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{f.allocation}%{f.fee != null ? ` (${t("profilePage.fee", { value: f.fee })})` : ""}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => updatePreferences({ pension: {} })}
              style={{ fontSize: 11, color: "#c62828", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              {t("profilePage.clearPensionData")}
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {t("profilePage.noPensionData")}
          </div>
        )}
      </div>

      {/* Account type */}
      <div style={cardStyle}>
        <div style={labelStyle}>{t("profilePage.accountTypeTitle")}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          {t("profilePage.accountTypeDesc")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { value: "isk", label: "ISK", desc: t("profilePage.iskDesc") },
            { value: "af", label: "AF", desc: t("profilePage.afDesc") },
            { value: "kf", label: "KF", desc: t("profilePage.kfDesc") },
            { value: "unknown", label: t("profilePage.dontKnow"), desc: "" },
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
        <div style={labelStyle}>{t("profilePage.privacyAi")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{t("profilePage.shareWithAi")}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("profilePage.shareWithAiDesc")}</div>
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
            {t("profilePage.privacyNote")}
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div style={cardStyle}>
        <div style={labelStyle}>{t("profilePage.account")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{t("profilePage.logOut")}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("profilePage.logOutDesc")}</div>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
              {t("profilePage.logOut")}
            </button>
          </div>
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#c62828" }}>{t("profilePage.deleteAccount")}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("profilePage.deleteAccountDesc")}</div>
            </div>
            <button disabled
              style={{ padding: "6px 14px", fontSize: 12, background: "var(--bg-card)", color: "#c62828", border: "1px solid #fce4ec", borderRadius: 4, cursor: "not-allowed", fontFamily: "inherit", opacity: 0.5 }}
              title={t("profilePage.contactSupportToDelete")}>
              {t("profilePage.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
