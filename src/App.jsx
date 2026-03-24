import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import Login from "./components/Login.jsx";
import Markets from "./components/Markets.jsx";
import Portfolio from "./components/Portfolio.jsx";
import GapAnalysis from "./components/GapAnalysis.jsx";
import CompanySearch from "./components/CompanySearch.jsx";
import Commodities from "./components/Commodities.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import Privacy from "./components/Privacy.jsx";
import InvestmentCompanies from "./components/InvestmentCompanies.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";

const TABS = [
  { id: "markets", label: "Översikt" },
  { id: "portfolio", label: "Portfölj" },
  { id: "investment", label: "Investmentbolag" },
  { id: "analysis", label: "Analys" },
  { id: "commodities", label: "Marknader" },
  { id: "search", label: "Sök" },
];

export default function App() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("markets");
  const [deepLink, setDeepLink] = useState(null);

  function navigate(targetTab, detail) {
    setDeepLink(detail || null);
    setTab(targetTab);
  }
  const [time, setTime] = useState(new Date());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const chatContextRef = useRef({});
  const profileRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function trackVisit() {
      const userId = session.user.id;
      const { data } = await supabase
        .from("user_prefs")
        .select("last_seen_at, preferences")
        .eq("user_id", userId)
        .single();
      setLastSeenAt(data?.last_seen_at || null);
      setPreferences(data?.preferences || {});
      await supabase
        .from("user_prefs")
        .upsert({ user_id: userId, last_seen_at: new Date().toISOString() });
    }
    trackVisit();
  }, [session]);

  async function updatePreferences(newPrefs) {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    if (session) {
      await supabase
        .from("user_prefs")
        .update({ preferences: merged })
        .eq("user_id", session.user.id);
    }
  }

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";
  const displayInitial = (preferences.display_name?.[0] || session?.user?.email?.[0] || "?").toUpperCase();

  function startEditingName() {
    setNameInput(preferences.display_name || "");
    setEditingName(true);
  }

  function saveDisplayName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      updatePreferences({ display_name: trimmed });
    }
    setEditingName(false);
  }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  useEffect(() => {
    if (!chatOpen || !session) return;
    async function loadContext() {
      try {
        const [indicesRes, commoditiesRes, watchlistRes] = await Promise.all([
          fetch("/api/indices").then(r => r.json()).catch(() => []),
          fetch("/api/commodities").then(r => r.json()).catch(() => []),
          supabase.from("watchlist").select("*").eq("user_id", session.user.id).order("created_at"),
        ]);
        const watchlist = watchlistRes.data || [];
        const portfolio = await Promise.all(
          watchlist.slice(0, 10).map(async (item) => {
            try {
              const r = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
              const d = await r.json();
              return { ticker: item.ticker, name: d.name, price: d.price, currency: d.currency, changePercent: d.changePercent };
            } catch { return null; }
          })
        );
        chatContextRef.current = {
          portfolio: portfolio.filter(Boolean),
          indices: indicesRes.filter(i => i.price > 0),
          commodities: commoditiesRes.filter(c => c.price > 0),
          investorProfile: preferences.investorProfile || null,
        };
      } catch (err) {
        console.error("Chat context load error:", err);
      }
    }
    loadContext();
  }, [chatOpen, session]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif", color: "#787b86" }}>
        Laddar...
      </div>
    );
  }

  if (showPrivacy) return <Privacy onBack={() => setShowPrivacy(false)} />;
  if (!session) return <Login onShowPrivacy={() => setShowPrivacy(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#131722", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 14px; font-size: 13px; font-family: inherit; color: #787b86; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .tab-btn.active { color: #131722; border-bottom-color: #2962ff; font-weight: 500; }
        .tab-btn:hover { color: #131722; }
      `}</style>

      {/* Mobile logo banner */}
      {isMobile && (
        <div style={{ background: "#3B6AE6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", position: "sticky", top: 0, zIndex: 51 }}>
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white"/>
            <polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85"/>
            <circle cx="38" cy="17" r="1.5" fill="#3B6AE6"/>
            <polygon points="32,18 34,24 28,32 26,24" fill="white"/>
            <polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white"/>
            <polygon points="12,36 8,28 10,26 14,32" fill="white"/>
            <line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="22,44 20,48 24,48 26,44" fill="white"/>
            <polygon points="28,42 27,48 31,48 30,42" fill="white"/>
          </svg>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px", color: "#fff" }}>Thesion</span>
        </div>
      )}

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid #e0e3eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 8px" : "0 32px", height: 42, position: "sticky", top: isMobile ? 40 : 0, background: "#fff", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 32, flex: 1, minWidth: 0 }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="12" fill="#3B6AE6"/>
                <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white"/>
                <polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85"/>
                <circle cx="38" cy="17" r="1.5" fill="#3B6AE6"/>
                <polygon points="32,18 34,24 28,32 26,24" fill="white"/>
                <polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white"/>
                <polygon points="12,36 8,28 10,26 14,32" fill="white"/>
                <line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="22,44 20,48 24,48 26,44" fill="white"/>
                <polygon points="28,42 27,48 31,48 30,42" fill="white"/>
                <line x1="38" y1="22" x2="37" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
                <line x1="40" y1="22" x2="39.5" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
                <line x1="42" y1="22" x2="41" y2="23.5" stroke="#3B6AE6" strokeWidth="0.8"/>
              </svg>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px" }}>Thesion</span>
            </div>
          )}
          <div style={{ display: "flex", overflow: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)} style={isMobile ? { padding: "8px 8px", fontSize: 11 } : undefined}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, flexShrink: 0 }}>
          {!isMobile && (
            <>
              <span style={{ fontSize: 12, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>
                {time.toLocaleTimeString("sv-SE")} CET
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#089981" }} />
                <span style={{ fontSize: 11, color: "#787b86" }}>Live</span>
              </div>
            </>
          )}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            style={{ fontSize: 11, color: chatOpen ? "#2962ff" : "#787b86", background: chatOpen ? "#f0f3fa" : "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
          >
            AI
          </button>
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setEditingName(false); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: profileOpen ? "#2962ff" : "#787b86", background: profileOpen ? "#f0f3fa" : "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#2962ff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
                {displayInitial}
              </div>
              {!isMobile && displayName}
            </button>
            {profileOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "12px 0", minWidth: 240, zIndex: 100 }}>
                <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f0f3fa" }}>
                  {editingName ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveDisplayName(); if (e.key === "Escape") setEditingName(false); }}
                        autoFocus
                        placeholder="Ditt namn"
                        style={{ flex: 1, padding: "4px 8px", border: "1px solid #2962ff", borderRadius: 3, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                      />
                      <button onClick={saveDisplayName} style={{ padding: "4px 10px", fontSize: 11, background: "#2962ff", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>Spara</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#131722" }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: "#787b86", marginTop: 2 }}>{session.user.email}</div>
                      </div>
                      <button
                        onClick={startEditingName}
                        title="Byt namn"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#787b86", padding: "2px 6px" }}
                      >
                        ✏
                      </button>
                    </div>
                  )}
                </div>
                {preferences.investorProfile && (
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #f0f3fa" }}>
                    <div style={{ fontSize: 10, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>Din investerarprofil</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {[
                        { value: preferences.investorProfile.investorType, map: { value: "Värde", growth: "Tillväxt", dividend: "Utdelning", index: "Index", mixed: "Blandat" } },
                        { value: preferences.investorProfile.experience, map: { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" } },
                        { value: preferences.investorProfile.riskProfile, map: { low: "Låg risk", medium: "Medel risk", high: "Hög risk" } },
                        { value: preferences.investorProfile.focus, map: { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" } },
                        { value: preferences.investorProfile.geography, map: { nordic: "Norden", global: "Globalt", both: "Blandat geo" } },
                      ].filter(t => t.value && t.map[t.value]).map((t, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#f0f3fa", color: "#2962ff", fontWeight: 500 }}>
                          {t.map[t.value]}
                        </span>
                      ))}
                    </div>
                    {preferences.investorProfile.interests?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {preferences.investorProfile.interests.map(i => {
                          const labels = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };
                          return <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#e8f5e9", color: "#1b5e20", fontWeight: 500 }}>{labels[i] || i}</span>;
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => { updatePreferences({ investorProfile: null }); setProfileOpen(false); }}
                      style={{ fontSize: 10, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 6 }}
                    >
                      Ändra profil →
                    </button>
                  </div>
                )}
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "#787b86", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f8f9fd"; e.currentTarget.style.color = "#131722"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#787b86"; }}
                >
                  Logga ut
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding modal for new users */}
      {!preferences.investorProfile && (
        <OnboardingModal onComplete={(profile) => updatePreferences({ investorProfile: profile })} />
      )}

      {/* Content + Chat */}
      <div style={{ display: "flex", height: isMobile ? "calc(100vh - 82px)" : "calc(100vh - 42px)" }}>
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px 12px" : "24px 32px" }}>
          {tab === "markets" && <Markets lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={updatePreferences} userId={session.user.id} displayName={displayName} onNavigate={navigate} />}
          {tab === "commodities" && <Commodities deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
          {tab === "portfolio" && <Portfolio preferences={preferences} onUpdatePreferences={updatePreferences} deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
          {tab === "analysis" && <GapAnalysis preferences={preferences} onNavigate={navigate} />}
          {tab === "search" && <CompanySearch />}
          {tab === "investment" && <InvestmentCompanies />}
        </div>
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} contextFn={() => chatContextRef.current} />
      </div>
    </div>
  );
}
