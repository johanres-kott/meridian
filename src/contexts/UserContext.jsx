import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";

const UserContext = createContext(null);

export function UserProvider({ session, children }) {
  const [preferences, setPreferences] = useState({});
  // true när preferences-hämtningen slutförts (även vid fel — då med {}).
  // Ytor som avgör "ny användare?" (OnboardingModal/QuickGuide) väntar på den
  // här flaggan så de inte blinkar för befintliga användare på långsamt nät.
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const userId = session?.user?.id || null;

  useEffect(() => {
    if (!session) return;
    async function trackVisit() {
      try {
        const { data } = await supabase
          .from("user_prefs")
          .select("last_seen_at, preferences")
          .eq("user_id", userId)
          .single();
        setLastSeenAt(data?.last_seen_at || null);
        setPreferences(data?.preferences || {});
      } catch (err) {
        console.error("UserContext: kunde inte läsa preferences:", err);
      } finally {
        setPrefsLoaded(true);
      }
      await supabase
        .from("user_prefs")
        .upsert({ user_id: userId, last_seen_at: new Date().toISOString() });
    }
    trackVisit();
  }, [session]);

  async function updatePreferences(newPrefs) {
    const latest = prefsRef.current;
    const merged = { ...latest, ...newPrefs };
    setPreferences(merged);
    prefsRef.current = merged;
    if (!session) return;

    // Skriv via vår egen proxy (/api/user-prefs) — direkta PATCH:ar mot
    // supabase.co strups i Safari. Server-side merge med användarens token.
    try {
      const res = await fetch("/api/user-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(newPrefs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { preferences: serverMerged } = await res.json();
      if (serverMerged) {
        setPreferences(serverMerged);
        prefsRef.current = serverMerged;
      }
    } catch (err) {
      console.error("updatePreferences: proxy save failed, falling back to direct write:", err);
      // Fallback: direkt mot Supabase (fungerar i Chrome m.fl.)
      const { data } = await supabase.from("user_prefs").select("preferences").eq("user_id", userId).single();
      const serverMerged = { ...(data?.preferences || {}), ...newPrefs };
      await supabase.from("user_prefs").update({ preferences: serverMerged }).eq("user_id", userId);
      setPreferences(serverMerged);
      prefsRef.current = serverMerged;
    }
  }

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";

  return (
    <UserContext.Provider value={{ userId, preferences, prefsLoaded, updatePreferences, lastSeenAt, displayName, session }}>
      {children}
    </UserContext.Provider>
  );
}

// Hooken bor medvetet ihop med providern (etablerat mönster i appen och hos
// alla konsumenter); regeln gäller bara HMR-granularitet, inte korrekthet.
// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
