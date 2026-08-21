import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "./supabase.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { UserProvider, useUser } from "./contexts/UserContext.jsx";
import Login from "./components/Login.jsx";
import LandingPage from "./components/LandingPage.jsx";
const Overview = lazy(() => import("./components/Overview.jsx"));
const Portfolio = lazy(() => import("./components/Portfolio.jsx"));
const AnalysisTab = lazy(() => import("./components/AnalysisTab.jsx"));
const CompanySearch = lazy(() => import("./components/CompanySearch.jsx"));
const MarketsView = lazy(() => import("./components/MarketsView.jsx"));
import NotificationBell from "./components/NotificationBell.jsx";
import Privacy from "./components/Privacy.jsx";
import Terms from "./components/Terms.jsx";
const InvestmentCompanies = lazy(() => import("./components/InvestmentCompanies.jsx"));
import OnboardingModal from "./components/OnboardingModal.jsx";
const ScoringMethodology = lazy(() => import("./components/ScoringMethodology.jsx"));
const ProfilePage = lazy(() => import("./components/ProfilePage.jsx"));
const Documentation = lazy(() => import("./components/Documentation.jsx"));
const AboutPage = lazy(() => import("./components/AboutPage.jsx"));
const SecurityPage = lazy(() => import("./components/SecurityPage.jsx"));
import ProfileMenu from "./components/ProfileMenu.jsx";
const AddAssetsPage = lazy(() => import("./components/addassets/AddAssetsPage.jsx"));
const GoalsTab = lazy(() => import("./components/GoalsTab.jsx"));
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

// Egen komponent så sekundticket bara re-renderar klockan, inte hela appen
// (AppContent hade setTime i state → aktiv flik inkl. grafer reconcilades 1 g/s).
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
      {time.toLocaleTimeString("sv-SE")} CET
    </span>
  );
}

function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="var(--green-700)" />
      <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white" /><polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85" /><circle cx="38" cy="17" r="1.5" fill="var(--green-700)" /><polygon points="32,18 34,24 28,32 26,24" fill="white" /><polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white" /><polygon points="12,36 8,28 10,26 14,32" fill="white" /><line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" /><polygon points="22,44 20,48 24,48 26,44" fill="white" /><polygon points="28,42 27,48 31,48 30,42" fill="white" />
    </svg>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}>
        Laddar...
      </div>
    );
  }

  if (showPrivacy) return <Privacy onBack={() => setShowPrivacy(false)} />;
  if (showTerms) return <Terms onBack={() => setShowTerms(false)} />;
  if (!session) return <LandingPage onShowPrivacy={() => setShowPrivacy(true)} onShowTerms={() => setShowTerms(true)} />;

  return (
    <UserProvider session={session}>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { preferences, prefsLoaded, updatePreferences } = useUser();
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
  const [showAddAssets, setShowAddAssets] = useState(false);
  const [addAssetsFirstRun, setAddAssetsFirstRun] = useState(false);

  function navigate(targetTab, detail) {
    setDeepLink(detail || null);
    setTab(targetTab);
  }

  const addAssetsButton = (
    <button
      onClick={() => setShowAddAssets(true)}
      style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: 999, padding: isMobile ? "6px 12px" : "7px 16px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
    >
      + {t("nav.addAssets")}
    </button>
  );

  // Lata flikvyer: en kort laddindikator i innehållsytan vid första besöket
  // på en flik — därefter är chunken cachead av webbläsaren.
  const contentFallback = (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Laddar…</div>
  );

  const content = (
    <Suspense fallback={contentFallback}>
      {tab === "markets" && <Overview onNavigate={navigate} onAddAssets={() => setShowAddAssets(true)} />}
      {tab === "goals" && <GoalsTab />}
      {tab === "commodities" && <MarketsView deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "portfolio" && <Portfolio deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} onNavigate={navigate} />}
      {tab === "analysis" && <AnalysisTab onNavigate={navigate} isMobile={isMobile} />}
      {tab === "search" && <CompanySearch deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "investment" && <InvestmentCompanies onNavigate={navigate} deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
      {tab === "methodology" && <ScoringMethodology onBack={() => setTab("markets")} />}
      {tab === "profile" && <ProfilePage onResetProfile={() => updatePreferences({ investorProfile: null, onboardingSkipped: false })} />}
      {tab === "docs" && <Documentation />}
      {tab === "about" && <AboutPage onNavigate={navigate} />}
      {tab === "security" && <SecurityPage />}
      {tab === "terms" && <Terms onBack={() => setTab("markets")} />}
      {tab === "privacy" && <Privacy onBack={() => setTab("markets")} />}
    </Suspense>
  );

  const modals = (
    <>
      {/* Onboarding för nya användare. Gate:ad på prefsLoaded så modalen inte
          blinkar för befintliga användare medan preferences laddar. Quizen går
          att hoppa över (onboardingSkipped) — profilen nås senare via
          profilmenyn. Efter klart/skipp första gången: rakt in i Add
          Assets-katalogen i stället för guide-slides — första handlingen slår
          sex slides (superenkelt-principen, se PIVOT.md/Finary). */}
      {prefsLoaded && !preferences.investorProfile && !preferences.onboardingSkipped && (
        <OnboardingModal
          onComplete={(profile) => {
            const firstRun = !preferences.guideSeen;
            updatePreferences({ investorProfile: profile, guideSeen: true });
            if (firstRun) { setAddAssetsFirstRun(true); setShowAddAssets(true); }
          }}
          onSkip={() => {
            const firstRun = !preferences.guideSeen;
            updatePreferences({ onboardingSkipped: true, guideSeen: true });
            if (firstRun) { setAddAssetsFirstRun(true); setShowAddAssets(true); }
          }}
        />
      )}

      {/* Add assets-katalog (helsida, Finary-inspirerad) */}
      {showAddAssets && (
        <Suspense fallback={contentFallback}>
          <AddAssetsPage onClose={() => { setShowAddAssets(false); setAddAssetsFirstRun(false); }} onNavigate={navigate} firstRun={addAssetsFirstRun} />
        </Suspense>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13 }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          :root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); --sal: env(safe-area-inset-left); --sar: env(safe-area-inset-right); }
          .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 8px; font-size: 11px; font-family: inherit; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
          .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); font-weight: 500; }
        `}</style>

        {/* Mobile logo banner */}
        <div style={{ background: "var(--surface-dark)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", position: "sticky", top: 0, zIndex: 51 }}>
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
            <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white" /><polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85" /><circle cx="38" cy="17" r="1.5" fill="var(--green-700)" /><polygon points="32,18 34,24 28,32 26,24" fill="white" /><polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white" /><polygon points="12,36 8,28 10,26 14,32" fill="white" /><line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" /><polygon points="22,44 20,48 24,48 26,44" fill="white" /><polygon points="28,42 27,48 31,48 30,42" fill="white" />
          </svg>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#fff" }}>Thesion</span>
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .side-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px; border: none; border-radius: 8px; background: none; cursor: pointer; font-family: inherit; font-size: 13px; color: var(--text-secondary); text-align: left; transition: background 0.15s, color 0.15s; }
        .side-item:hover { color: var(--text); background: var(--bg-raised); }
        .side-item.active { color: var(--brand); background: var(--brand-tint); font-weight: 600; }
      `}</style>

      {/* Topbar */}
      <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo />
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>Thesion</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Clock />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pos)" }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Live</span>
          </div>
          <NotificationBell />
          {addAssetsButton}
        </div>
      </div>

      {modals}

      {/* Sidomeny + innehåll */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", padding: "8px 12px 16px", position: "relative", zIndex: 50 }}>
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
