import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import { usePremium } from "../hooks/usePremium.js";
import { useTheme } from "../hooks/useTheme.js";
import { sanitizeInput } from "../lib/sanitize.js";
import { LANGUAGES, setLanguage } from "../i18n/index.js";

// Profilknapp + popover, utbruten ur App.jsx för det nya skalet (DESIGN.md).
// direction "up" = sitter längst ner i sidomenyn (Finary-mönstret),
// "down" = sitter i topbaren (mobil).

export default function ProfileMenu({ onNavigate, direction = "down", showName = true }) {
  const { preferences, updatePreferences, displayName, session } = useUser();
  const { t, i18n } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { premium, loading: premiumLoading } = usePremium();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const ref = useRef(null);

  const displayInitial = (preferences.display_name?.[0] || session?.user?.email?.[0] || "?").toUpperCase();

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function startEditingName() {
    setNameInput(preferences.display_name || "");
    setEditingName(true);
  }

  function saveDisplayName() {
    const sanitized = sanitizeInput(nameInput);
    if (sanitized) {
      updatePreferences({ display_name: sanitized });
    }
    setEditingName(false);
  }

  function changeLanguage(code) {
    setLanguage(code);
    updatePreferences({ language: code });
  }

  async function openStripePortal() {
    setPortalLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe-portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${authSession?.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("ProfileMenu: stripe portal failed:", err);
    }
    setPortalLoading(false);
  }

  function go(tab) {
    onNavigate?.(tab);
    setOpen(false);
  }

  const itemStyle = { width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" };
  const hover = {
    onMouseEnter: e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; },
    onMouseLeave: e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; },
  };

  return (
    <div ref={ref} style={{ position: "relative", width: direction === "up" ? "100%" : undefined }}>
      <button
        onClick={() => { setOpen(!open); setEditingName(false); }}
        style={direction === "up" ? {
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          fontSize: 13, color: "var(--text)", background: open ? "rgba(108,113,122,0.1)" : "none",
          border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit",
        } : {
          display: "flex", alignItems: "center", gap: 6, fontSize: 11,
          color: open ? "var(--accent)" : "var(--text-secondary)",
          background: open ? "var(--border-light)" : "none",
          border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{ width: direction === "up" ? 24 : 18, height: direction === "up" ? 24 : 18, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: direction === "up" ? 11 : 10, fontWeight: 600, flexShrink: 0 }}>
          {displayInitial}
        </div>
        {showName && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>}
        {direction === "up" && <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 14 }}>⋮</span>}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          ...(direction === "up" ? { bottom: "calc(100% + 8px)", left: 0 } : { top: "calc(100% + 6px)", right: 0 }),
          background: "var(--bg-card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)",
          padding: "12px 0", width: direction === "up" ? 272 : undefined, minWidth: 240, zIndex: 100, boxShadow: "0 8px 24px rgba(20,30,25,0.10)",
        }}>
          <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid var(--border-light)" }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveDisplayName(); if (e.key === "Escape") setEditingName(false); }}
                  autoFocus
                  placeholder="Ditt namn"
                  style={{ flex: 1, minWidth: 0, padding: "4px 8px", border: "1px solid var(--accent)", borderRadius: 3, fontSize: 13, fontFamily: "inherit", outline: "none", background: "var(--bg-card)", color: "var(--text)" }}
                />
                <button onClick={saveDisplayName} style={{ padding: "4px 10px", fontSize: 11, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>Spara</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{session.user.email}</div>
                </div>
                <button
                  onClick={startEditingName}
                  title="Byt namn"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", padding: "2px 6px", flexShrink: 0 }}
                >
                  ✏
                </button>
              </div>
            )}
          </div>

          {preferences.investorProfile && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>Din ekonomiprofil</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(() => {
                  const p = preferences.investorProfile;
                  const chips = p.version === 2
                    ? [
                        { value: p.lifeStage, map: { starting: "I början", building: "Bygger upp", established: "Etablerad", preRetire: "Närmar mig pension" } },
                        { value: p.style, map: { safe: "Tryggt och enkelt", balanced: "Balanserat", active: "Engagerat" } },
                        { value: p.experience, map: { beginner: "Nybörjare", intermediate: "Lite van", advanced: "Van" } },
                      ]
                    : [
                        { value: p.investorType, map: { value: "Värde", growth: "Tillväxt", dividend: "Utdelning", index: "Index", mixed: "Blandat" } },
                        { value: p.experience, map: { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" } },
                        { value: p.riskProfile, map: { low: "Låg risk", medium: "Medel risk", high: "Hög risk" } },
                      ];
                  return chips.filter(x => x.value && x.map[x.value]).map((x, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "var(--brand-tint)", color: "var(--green-700)", fontWeight: 600 }}>
                      {x.map[x.value]}
                    </span>
                  ));
                })()}
              </div>
              {preferences.investorProfile.version !== 2 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Gjord med den gamla profilen — gör om den för att få den nya ekonomiprofilen.</div>
              )}
              <button
                onClick={() => { updatePreferences({ investorProfile: null }); setOpen(false); }}
                style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 6 }}
              >
                Ändra profil →
              </button>
            </div>
          )}

          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Prenumeration</div>
              {premium && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "rgba(15,154,108,0.1)", color: "var(--pos)", fontWeight: 600 }}>
                  ★ Premium
                </span>
              )}
            </div>
            {premiumLoading ? (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Laddar...</div>
            ) : premium ? (
              <button
                onClick={openStripePortal}
                disabled={portalLoading}
                style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: portalLoading ? "default" : "pointer", fontFamily: "inherit", padding: 0, marginTop: 4 }}
              >
                {portalLoading ? "Öppnar..." : "Hantera prenumeration →"}
              </button>
            ) : (
              <button
                onClick={() => go("analysis")}
                style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 4 }}
              >
                Uppgradera till Premium →
              </button>
            )}
          </div>

          <button onClick={() => go("profile")} style={itemStyle} {...hover}>Profil & inställningar</button>
          <button onClick={() => go("docs")} style={itemStyle} {...hover}>Dokumentation</button>
          <button onClick={() => go("security")} style={itemStyle} {...hover}>Din data & säkerhet</button>
          <button onClick={() => go("about")} style={itemStyle} {...hover}>Om Thesion</button>

          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t("profile.language")}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {LANGUAGES.map(l => {
                const active = i18n.language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    title={l.label}
                    style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      background: active ? "var(--accent-light)" : "var(--bg-card)",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {l.flag} {l.code.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={toggleTheme} style={{ ...itemStyle, display: "flex", alignItems: "center", gap: 8 }} {...hover}>
            {isDark ? "Ljust läge" : "Mörkt läge"}
          </button>
          <div style={{ borderTop: "1px solid var(--border-light)" }} />
          <button onClick={() => supabase.auth.signOut()} style={itemStyle} {...hover}>Logga ut</button>
        </div>
      )}
    </div>
  );
}
