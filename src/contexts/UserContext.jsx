import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";

const UserContext = createContext(null);

export function UserProvider({ session, children }) {
  const [preferences, setPreferences] = useState({});
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const userId = session?.user?.id || null;

  useEffect(() => {
    if (!session) return;
    async function trackVisit() {
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
    const latest = prefsRef.current;
    const merged = { ...latest, ...newPrefs };
    setPreferences(merged);
    prefsRef.current = merged;
    if (session) {
      const { data } = await supabase
        .from("user_prefs")
        .select("preferences")
        .eq("user_id", userId)
        .single();
      const serverMerged = { ...(data?.preferences || {}), ...newPrefs };
      await supabase
        .from("user_prefs")
        .update({ preferences: serverMerged })
        .eq("user_id", userId);
      setPreferences(serverMerged);
      prefsRef.current = serverMerged;
    }
  }

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";

  return (
    <UserContext.Provider value={{ userId, preferences, updatePreferences, lastSeenAt, displayName, session }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
