import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import Login from "./components/Login.jsx";
import Markets from "./components/Markets.jsx";
import Portfolio from "./components/Portfolio.jsx";
import GapAnalysis from "./components/GapAnalysis.jsx";
import CompanySearch from "./components/CompanySearch.jsx";
import Commodities from "./components/Commodities.jsx";
import ChatPanel from "./components/ChatPanel.jsx";

const TABS = [
  { id: "markets", label: "Översikt" },
  { id: "commodities", label: "Marknader" },
  { id: "portfolio", label: "Portfölj" },
  { id: "analysis", label: "Nyckeltal" },
  { id: "search", label: "Company Search" },
];

export default function App() {
  const [tab, setTab] = useState("markets");
  const [time, setTime] = useState(new Date());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
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
              {displayName}
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

      {/* Content + Chat */}
      <div style={{ display: "flex", height: "calc(100vh - 46px)" }}>
        <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
          {tab === "markets" && <Markets lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={updatePreferences} userId={session.user.id} displayName={displayName} />}
          {tab === "commodities" && <Commodities />}
          {tab === "portfolio" && <Portfolio preferences={preferences} onUpdatePreferences={updatePreferences} />}
          {tab === "analysis" && <GapAnalysis preferences={preferences} />}
          {tab === "search" && <CompanySearch />}
        </div>
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} contextFn={() => chatContextRef.current} />
      </div>
    </div>
  );
}
