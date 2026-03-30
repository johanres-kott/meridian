import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { useTheme } from "./hooks/useTheme.js";
import Login from "./components/Login.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Markets from "./components/Markets.jsx";
import Portfolio from "./components/Portfolio.jsx";
import GapAnalysis from "./components/GapAnalysis.jsx";
import CompanySearch from "./components/CompanySearch.jsx";
import Commodities from "./components/Commodities.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import Privacy from "./components/Privacy.jsx";
import InvestmentCompanies from "./components/InvestmentCompanies.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import QuickGuide from "./components/QuickGuide.jsx";
import ScoringMethodology from "./components/ScoringMethodology.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import Documentation from "./components/Documentation.jsx";
import AboutPage from "./components/AboutPage.jsx";
import { sanitizeInput } from "./lib/sanitize.js";

const TABS = [
  { id: "markets", label: "Översikt" },
  { id: "portfolio", label: "Portfölj" },
  { id: "investment", label: "Investera" },
  { id: "analysis", label: "Analys" },
  { id: "commodities", label: "Marknader" },
  { id: "search", label: "Sök" },
];

export default function App() {
  const isMobile = useIsMobile();
  const { theme, toggleTheme, isDark } = useTheme();
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
  const [chatOpen, setChatOpen] = useState(true);
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
    const sanitized = sanitizeInput(nameInput);
    if (sanitized) {
      updatePreferences({ display_name: sanitized });
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
          watchlist.slice(0, 20).map(async (item) => {
            try {
              const r = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
              const d = await r.json();
              const shares = item.shares || 0;
              const gav = item.gav || 0;
              const valueSek = shares > 0 ? shares * d.price : 0;
              const costSek = shares > 0 && gav > 0 ? shares * gav : 0;
              const plSek = costSek > 0 ? valueSek - costSek : null;
              const plPct = costSek > 0 ? ((valueSek - costSek) / costSek * 100) : null;
              return {
                ticker: item.ticker, name: d.name || item.name, price: d.price, currency: d.currency,
                changePercent: d.changePercent, status: item.status,
                shares, gav, valueSek: Math.round(valueSek),
                plSek: plSek != null ? Math.round(plSek) : null,
                plPct: plPct != null ? +plPct.toFixed(1) : null,
                sector: d.sector,
              };
            } catch { return null; }
          })
        );
        const validPortfolio = portfolio.filter(Boolean);

        // Fetch scoring data for owned stocks
        const ownedTickers = validPortfolio.filter(p => p.shares > 0).map(p => p.ticker);
        const scoreResults = await Promise.all(
          ownedTickers.slice(0, 15).map(async (ticker) => {
            try {
              const r = await fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`);
              const d = await r.json();
              return d ? { ticker, composite: d.composite, scores: d.scores, data: d.data, risk: d.risk } : null;
            } catch { return null; }
          })
        );
        const scoresMap = {};
        scoreResults.filter(Boolean).forEach(s => { scoresMap[s.ticker] = s; });

        // Enrich portfolio with scores
        const enrichedPortfolio = validPortfolio.map(p => ({
          ...p,
          score: scoresMap[p.ticker] || null,
        }));

        const totalValue = enrichedPortfolio.reduce((s, p) => s + (p.valueSek || 0), 0);
        const totalCost = enrichedPortfolio.reduce((s, p) => s + (p.shares > 0 && p.gav > 0 ? p.shares * p.gav : 0), 0);
        const totalPl = totalCost > 0 ? totalValue - totalCost : null;
        const totalPlPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : null;

        // Build sector distribution
        const sectorDist = {};
        enrichedPortfolio.filter(p => p.shares > 0 && p.valueSek > 0).forEach(p => {
          const sector = p.sector || "Okänd";
          sectorDist[sector] = (sectorDist[sector] || 0) + p.valueSek;
        });
        const sectorBreakdown = totalValue > 0
          ? Object.entries(sectorDist).map(([sector, value]) => ({
              sector, value: Math.round(value), pct: +((value / totalValue) * 100).toFixed(1),
            })).sort((a, b) => b.value - a.value)
          : [];

        chatContextRef.current = {
          portfolio: enrichedPortfolio,
          portfolioSummary: {
            totalValue, totalCost,
            totalPl: totalPl != null ? Math.round(totalPl) : null,
            totalPlPct: totalPlPct != null ? +totalPlPct.toFixed(1) : null,
            holdingsWithShares: enrichedPortfolio.filter(p => p.shares > 0).length,
            totalHoldings: enrichedPortfolio.length,
            sectorBreakdown,
          },
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
        Laddar...
      </div>
    );
  }

  if (showPrivacy) return <Privacy onBack={() => setShowPrivacy(false)} />;
  if (!session) return <LandingPage onShowPrivacy={() => setShowPrivacy(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); --sal: env(safe-area-inset-left); --sar: env(safe-area-inset-right); }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 14px; font-size: 13px; font-family: inherit; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); font-weight: 500; }
        .tab-btn:hover { color: var(--text); }
      `}</style>

      {/* Mobile logo banner */}
      {isMobile && (
        <div style={{ background: "#3B6AE6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", position: "sticky", top: 0, zIndex: 51 }}>
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
            <path d="M12 22 Q19 14 26 22 Q33 30 40 22 Q43 19 46 22" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M12 34 Q19 26 26 34 Q33 42 40 34 Q43 31 46 34" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px", color: "#fff" }}>Thesion</span>
        </div>
      )}

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 8px" : "0 32px", height: 42, position: "sticky", top: isMobile ? 40 : 0, background: "var(--bg-card)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 32, flex: 1, minWidth: 0 }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
                <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
                <path d="M12 22 Q19 14 26 22 Q33 30 40 22 Q43 19 46 22" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M12 34 Q19 26 26 34 Q33 42 40 34 Q43 31 46 34" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
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
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>
                {time.toLocaleTimeString("sv-SE")} CET
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#089981" }} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Live</span>
              </div>
            </>
          )}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            style={{ fontSize: 11, color: chatOpen ? "#2962ff" : "var(--text-secondary)", background: chatOpen ? "var(--border-light)" : "none", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
          >
            AI
          </button>
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setEditingName(false); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: profileOpen ? "#2962ff" : "var(--text-secondary)", background: profileOpen ? "var(--border-light)" : "none", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#2962ff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
                {displayInitial}
              </div>
              {!isMobile && displayName}
            </button>
            {profileOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "12px 0", minWidth: 240, zIndex: 100 }}>
                <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid var(--border-light)" }}>
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
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{session.user.email}</div>
                      </div>
                      <button
                        onClick={startEditingName}
                        title="Byt namn"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", padding: "2px 6px" }}
                      >
                        ✏
                      </button>
                    </div>
                  )}
                </div>
                {preferences.investorProfile && (
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>Din investerarprofil</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {[
                        { value: preferences.investorProfile.investorType, map: { value: "Värde", growth: "Tillväxt", dividend: "Utdelning", index: "Index", mixed: "Blandat" } },
                        { value: preferences.investorProfile.experience, map: { beginner: "Nybörjare", intermediate: "Lite erfarenhet", advanced: "Erfaren" } },
                        { value: preferences.investorProfile.riskProfile, map: { low: "Låg risk", medium: "Medel risk", high: "Hög risk" } },
                        { value: preferences.investorProfile.focus, map: { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" } },
                        { value: preferences.investorProfile.geography, map: { nordic: "Norden", global: "Globalt", both: "Blandat geo" } },
                      ].filter(t => t.value && t.map[t.value]).map((t, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "var(--border-light)", color: "#2962ff", fontWeight: 500 }}>
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
                  onClick={() => { setTab("profile"); setProfileOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  Profil & inställningar
                </button>
                <button
                  onClick={() => { setTab("docs"); setProfileOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  Dokumentation
                </button>
                <button
                  onClick={() => { setTab("about"); setProfileOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  Om Thesion
                </button>
                <button
                  onClick={toggleTheme}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {isDark ? "☀️" : "🌙"} {isDark ? "Ljust läge" : "Mörkt läge"}
                </button>
                <div style={{ borderTop: "1px solid var(--border-light)" }} />
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
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
        <OnboardingModal onComplete={async (profile) => {
          updatePreferences({ investorProfile: profile });
          // Add 5 starter stocks based on investor type
          const STARTER_STOCKS = {
            value: [
              { ticker: "INVE-B.ST", name: "Investor" },
              { ticker: "SEB-A.ST", name: "SEB" },
              { ticker: "VOLV-B.ST", name: "Volvo" },
              { ticker: "SHB-A.ST", name: "Handelsbanken" },
              { ticker: "AZN.ST", name: "AstraZeneca" },
            ],
            growth: [
              { ticker: "EVO.ST", name: "Evolution" },
              { ticker: "SINCH.ST", name: "Sinch" },
              { ticker: "HEX-B.ST", name: "Hexagon" },
              { ticker: "ATCO-A.ST", name: "Atlas Copco" },
              { ticker: "SAAB-B.ST", name: "Saab" },
            ],
            dividend: [
              { ticker: "INVE-B.ST", name: "Investor" },
              { ticker: "SHB-A.ST", name: "Handelsbanken" },
              { ticker: "AXFO.ST", name: "Axfood" },
              { ticker: "CAST.ST", name: "Castellum" },
              { ticker: "SEB-A.ST", name: "SEB" },
            ],
            index: [
              { ticker: "ERIC-B.ST", name: "Ericsson" },
              { ticker: "VOLV-B.ST", name: "Volvo" },
              { ticker: "ABB.ST", name: "ABB" },
              { ticker: "AZN.ST", name: "AstraZeneca" },
              { ticker: "ATCO-A.ST", name: "Atlas Copco" },
            ],
            mixed: [
              { ticker: "INVE-B.ST", name: "Investor" },
              { ticker: "VOLV-B.ST", name: "Volvo" },
              { ticker: "ERIC-B.ST", name: "Ericsson" },
              { ticker: "AZN.ST", name: "AstraZeneca" },
              { ticker: "EVO.ST", name: "Evolution" },
            ],
          };
          const starters = STARTER_STOCKS[profile.investorType] || STARTER_STOCKS.mixed;
          try {
            const { data: existing } = await supabase.from("watchlist").select("ticker").eq("user_id", session.user.id);
            const existingTickers = new Set((existing || []).map(e => e.ticker.toUpperCase()));
            const newStocks = starters.filter(s => !existingTickers.has(s.ticker.toUpperCase()));
            if (newStocks.length > 0) {
              await supabase.from("watchlist").insert(newStocks.map(s => ({ ticker: s.ticker, name: s.name, user_id: session.user.id, status: "Bevakar" })));
            }
          } catch {}
        }} />
      )}

      {/* Quick guide for new users (after onboarding) */}
      {preferences.investorProfile && !preferences.guideSeen && (
        <QuickGuide onComplete={() => updatePreferences({ guideSeen: true })} />
      )}

      {/* Content + Chat */}
      <div style={{ display: "flex", height: isMobile ? "calc(100vh - 82px)" : "calc(100vh - 42px)" }}>
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px 12px" : "24px 32px", paddingBottom: isMobile ? "calc(16px + env(safe-area-inset-bottom, 0px))" : "24px", paddingLeft: isMobile ? "calc(12px + env(safe-area-inset-left, 0px))" : "32px", paddingRight: isMobile ? "calc(12px + env(safe-area-inset-right, 0px))" : "32px" }}>
          {tab === "markets" && <Markets lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={updatePreferences} userId={session.user.id} displayName={displayName} onNavigate={navigate} />}
          {tab === "commodities" && <Commodities deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
          {tab === "portfolio" && <Portfolio preferences={preferences} onUpdatePreferences={updatePreferences} deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} userId={session.user.id} />}
          {tab === "analysis" && <GapAnalysis preferences={preferences} onNavigate={navigate} />}
          {tab === "search" && <CompanySearch deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} preferences={preferences} />}
          {tab === "investment" && <InvestmentCompanies preferences={preferences} userId={session.user.id} onNavigate={navigate} />}
          {tab === "methodology" && <ScoringMethodology onBack={() => setTab("markets")} />}
          {tab === "profile" && <ProfilePage session={session} preferences={preferences} onUpdatePreferences={updatePreferences} onResetProfile={() => updatePreferences({ investorProfile: null })} />}
          {tab === "docs" && <Documentation />}
          {tab === "about" && <AboutPage />}
        </div>
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} contextFn={() => chatContextRef.current} sharePortfolio={preferences.sharePortfolioWithAI !== false} onSaveStrategy={(text) => updatePreferences({ investmentPlan: { text, savedAt: new Date().toISOString() } })} onSaveTodo={(text) => {
          const todos = preferences.todos || [];
          updatePreferences({ todos: [...todos, { text, done: false, createdAt: new Date().toISOString() }] });
        }} />
      </div>
    </div>
  );
}
