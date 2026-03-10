import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import Login from "./components/Login.jsx";
import Markets from "./components/Markets.jsx";
import Portfolio from "./components/Portfolio.jsx";
import GapAnalysis from "./components/GapAnalysis.jsx";
import CompanySearch from "./components/CompanySearch.jsx";
import Commodities from "./components/Commodities.jsx";

const TABS = [
  { id: "markets", label: "Global Markets" },
  { id: "commodities", label: "Råvaror" },
  { id: "portfolio", label: "Portfolio" },
  { id: "analysis", label: "Gap Analysis" },
  { id: "search", label: "Company Search" },
];

export default function App() {
  const [tab, setTab] = useState("markets");
  const [time, setTime] = useState(new Date());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif", color: "#787b86" }}>
        Laddar...
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#131722", fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 14px; font-size: 13px; font-family: inherit; color: #787b86; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .tab-btn.active { color: #131722; border-bottom-color: #2962ff; font-weight: 500; }
        .tab-btn:hover { color: #131722; }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid #e0e3eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 46, position: "sticky", top: 0, background: "#fff", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, background: "#2962ff", borderRadius: 4 }} />
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.02em" }}>Meridian</span>
          </div>
          <div style={{ display: "flex" }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace" }}>
            {time.toLocaleTimeString("sv-SE")} CET
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#089981" }} />
            <span style={{ fontSize: 11, color: "#787b86" }}>Live</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 11, color: "#787b86", background: "none", border: "1px solid #e0e3eb", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* Content - full width with padding */}
      <div style={{ padding: "24px 32px" }}>
        {tab === "markets" && <Markets />}
        {tab === "commodities" && <Commodities />}
        {tab === "portfolio" && <Portfolio />}
        {tab === "analysis" && <GapAnalysis />}
        {tab === "search" && <CompanySearch />}
      </div>
    </div>
  );
}
