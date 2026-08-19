import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { UserProvider, useUser } from "./contexts/UserContext.jsx";
import Login from "./components/Login.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Overview from "./components/Overview.jsx";
import Portfolio from "./components/Portfolio.jsx";
import AnalysisTab from "./components/AnalysisTab.jsx";
import CompanySearch from "./components/CompanySearch.jsx";
import MarketsView from "./components/MarketsView.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import Privacy from "./components/Privacy.jsx";
import InvestmentCompanies from "./components/InvestmentCompanies.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import QuickGuide from "./components/QuickGuide.jsx";
import ScoringMethodology from "./components/ScoringMethodology.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import Documentation from "./components/Documentation.jsx";
import AboutPage from "./components/AboutPage.jsx";
import ProfileMenu from "./components/ProfileMenu.jsx";
import AddAssetsPage from "./components/addassets/AddAssetsPage.jsx";
import GoalsTab from "./components/GoalsTab.jsx";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage } from "./i18n/index.js";

// Skal enligt DESIGN.md: sidomeny på desktop (Finary-mönstret), flikar på mobil.
const NAV_ICONS = {
  markets: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  portfolio: <><path d="M6 20V10" /><path d="M12 20V4" /><path d="M18 20v-6" /></>,
  goals: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.5" /></>,
  investment: <><path d="M3 10l9-6 9 6" /><path d="M5 10v8" /><path d="M9.5 10v8" /><path d="M14.5 10v8" /><path d="M19 10v8" /><path d="M3 20h18" /></>,
  analysis: <><circle cx="12" cy="12" r="9" /><path d="M12 12V3" /><path d="M12 12l6 6" /></>,
  commodities: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
};

const TABS = [
  { id: "markets", key: "nav.markets" },
  { id: "portfolio", key: "nav.portfolio" },
  { id: "goals", key: "nav.goals" },
  { id: "investment", key: "nav.investment" },
  { id: "analysis", key: "nav.analysis" },
  { id: "commodities", key: "nav.commodities" },
  { id: "search", key: "nav.search" },
];

function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="#3B6AE6" />
      <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white" /><polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85" /><circle cx="38" cy="17" r="1.5" fill="#3B6AE6" /><polygon points="32,18 34,24 28,32 26,24" fill="white" /><polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white" /><polygon points="12,36 8,28 10,26 14,32" fill="white" /><line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" /><polygon points="22,44 20,48 24,48 26,44" fill="white" /><polygon points="28,42 27,48 31,48 30,42" fill="white" />
    </svg>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
    <UserProvider session={session}>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { userId, preferences, updatePreferences } = useUser();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

  // Sync language from saved preferences once they load from Supabase. localStorage
  // already gave us the right language on first paint; this catches the case where
  // the user set their language on another device.
  useEffect(() => {
    const lang = preferences.language;
    if (lang && lang !== i18n.language && LANGUAGES.some(l => l.code === lang)) {
      setLanguage(lang);
    }
  }, [preferences.language, i18n.language]);

  const [tab, setTab] = useState("markets");
  const [deepLink, setDeepLink] = useState(null);
  const [time, setTime] = useState(new Date());
  const [showAddAssets, setShowAddAssets] = useState(false);

  function navigate(targetTab, detail) {
    setDeepLink(detail || null);
    setTab(targetTab);
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addAssetsButton = (
    <button
      onClick={() => setShowAddAssets(true)}
      style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: 999, padding: isMobile ? "6px 12px" : "7px 16px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
    >
      + {t("nav.addAssets")}
    </button>
  );

  const content = (
    <>
      {tab === "markets" && <Overview onNavigate={navigate} onAddAssets={() => setShowAddAssets(true)} />}
      {tab === "goals" && <GoalsTab />}
      {tab === "commodities" && <MarketsView deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "portfolio" && <Portfolio deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} onNavigate={navigate} />}
      {tab === "analysis" && <AnalysisTab onNavigate={navigate} isMobile={isMobile} />}
      {tab === "search" && <CompanySearch deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "investment" && <InvestmentCompanies onNavigate={navigate} deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "methodology" && <ScoringMethodology onBack={() => setTab("markets")} />}
      {tab === "profile" && <ProfilePage onResetProfile={() => updatePreferences({ investorProfile: null })} />}
      {tab === "docs" && <Documentation />}
      {tab === "about" && <AboutPage />}
    </>
  );

  const modals = (
    <>
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
            const { data: existing } = await supabase.from("watchlist").select("ticker").eq("user_id", userId);
            const existingTickers = new Set((existing || []).map(e => e.ticker.toUpperCase()));
            const newStocks = starters.filter(s => !existingTickers.has(s.ticker.toUpperCase()));
            if (newStocks.length > 0) {
              await supabase.from("watchlist").insert(newStocks.map(s => ({ ticker: s.ticker, name: s.name, user_id: userId, status: "Bevakar" })));
            }
          } catch (err) { console.error("Failed to add starter stocks:", err); }
        }} />
      )}

      {/* Quick guide for new users (after onboarding) */}
      {preferences.investorProfile && !preferences.guideSeen && (
        <QuickGuide onComplete={() => updatePreferences({ guideSeen: true })} />
      )}

      {/* Add assets-katalog (helsida, Finary-inspirerad) */}
      {showAddAssets && (
        <AddAssetsPage onClose={() => setShowAddAssets(false)} onNavigate={navigate} />
      )}
    </>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          :root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); --sal: env(safe-area-inset-left); --sar: env(safe-area-inset-right); }
          .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 8px; font-size: 11px; font-family: inherit; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
          .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); font-weight: 500; }
        `}</style>

        {/* Mobile logo banner */}
        <div style={{ background: "#3B6AE6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", position: "sticky", top: 0, zIndex: 51 }}>
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
            <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white" /><polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85" /><circle cx="38" cy="17" r="1.5" fill="#3B6AE6" /><polygon points="32,18 34,24 28,32 26,24" fill="white" /><polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white" /><polygon points="12,36 8,28 10,26 14,32" fill="white" /><line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" /><polygon points="22,44 20,48 24,48 26,44" fill="white" /><polygon points="28,42 27,48 31,48 30,42" fill="white" />
          </svg>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px", color: "#fff" }}>Thesion</span>
        </div>

        {/* Topbar: flikar + åtgärder */}
        <div style={{ borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", height: 42, position: "sticky", top: 40, background: "var(--bg-card)", zIndex: 50 }}>
          <div style={{ display: "flex", overflow: "auto", msOverflowStyle: "none", scrollbarWidth: "none", flex: 1, minWidth: 0 }}>
            {TABS.map(tabItem => (
              <button key={tabItem.id} className={`tab-btn${tab === tabItem.id ? " active" : ""}`} onClick={() => setTab(tabItem.id)}>
                {t(tabItem.key)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {addAssetsButton}
            <NotificationBell />
            <ProfileMenu onNavigate={navigate} direction="down" showName={false} />
          </div>
        </div>

        {modals}

        <div style={{ height: "calc(100vh - 82px)", overflow: "auto", padding: "16px 12px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", paddingLeft: "calc(12px + env(safe-area-inset-left, 0px))", paddingRight: "calc(12px + env(safe-area-inset-right, 0px))" }}>
          {content}
        </div>
      </div>
    );
  }

  // ── Desktop: sidomeny + topbar (DESIGN.md) ──
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .side-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px; border: none; border-radius: 8px; background: none; cursor: pointer; font-family: inherit; font-size: 13px; color: var(--text-secondary); text-align: left; transition: background 0.15s, color 0.15s; }
        .side-item:hover { color: var(--text); background: rgba(108,113,122,0.06); }
        .side-item.active { color: var(--text); background: rgba(108,113,122,0.1); font-weight: 500; }
      `}</style>

      {/* Topbar */}
      <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px" }}>Thesion</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {time.toLocaleTimeString("sv-SE")} CET
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#089981" }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Live</span>
          </div>
          <NotificationBell />
          {addAssetsButton}
        </div>
      </div>

      {modals}

      {/* Sidomeny + innehåll */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", padding: "8px 12px 16px", overflowY: "auto" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map(tabItem => (
              <button
                key={tabItem.id}
                className={`side-item${tab === tabItem.id ? " active" : ""}`}
                onClick={() => setTab(tabItem.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  {NAV_ICONS[tabItem.id]}
                </svg>
                {t(tabItem.key)}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <ProfileMenu onNavigate={navigate} direction="up" />
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 32px 40px" }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
