import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";

const UserContext = createContext(null);

export function UserProvider({ session, children }) {
  const [preferences, setPreferences] = useState({});
  // true när preferences-hämtningen slutförts (även vid fel — då med {}).
  // Ytor som avgör "ny användare?" (OnboardingModal) väntar på den
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

  // Sparstatus för inställningar: "idle" (inget skrivet ännu) | "saving" |
  // "saved" | "error". Vid fel samlas patchen i pendingRef så att
  // retrySave() kan skicka om exakt det som aldrig nådde servern — utan
  // detta såg en misslyckad skrivning sparad ut (optimistisk state) men
  // försvann vid nästa laddning.
  const [saveStatus, setSaveStatus] = useState("idle");
  const pendingRef = useRef(null);
  const inflightRef = useRef(0);

  // Nätverksdelen: proxy först (Safari), direkt Supabase som fallback —
  // BÅDA med verklig felkoll. Kastar när ingen väg lyckas.
  async function pushPatch(patch) {
    try {
      const res = await fetch("/api/user-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { preferences: serverMerged } = await res.json();
      return serverMerged || null;
    } catch (err) {
      console.error("updatePreferences: proxy save failed, falling back to direct write:", err);
      const { data, error: readErr } = await supabase.from("user_prefs").select("preferences").eq("user_id", userId).single();
      if (readErr) throw readErr;
      const serverMerged = { ...(data?.preferences || {}), ...patch };
      const { error: writeErr } = await supabase.from("user_prefs").update({ preferences: serverMerged }).eq("user_id", userId);
      if (writeErr) throw writeErr;
      return serverMerged;
    }
  }

  function applyServerMerged(serverMerged) {
    if (!serverMerged) return;
    setPreferences(serverMerged);
    prefsRef.current = serverMerged;
  }

  function settleStatus() {
    if (pendingRef.current) setSaveStatus("error");
    else if (inflightRef.current > 0) setSaveStatus("saving");
    else setSaveStatus("saved");
  }

  async function updatePreferences(newPrefs) {
    const latest = prefsRef.current;
    const merged = { ...latest, ...newPrefs };
    setPreferences(merged);
    prefsRef.current = merged;
    if (!session) return;

    inflightRef.current++;
    setSaveStatus("saving");
    try {
      // Skicka även tidigare misslyckade ändringar så inget tappas på vägen
      const patch = { ...(pendingRef.current || {}), ...newPrefs };
      const serverMerged = await pushPatch(patch);
      pendingRef.current = null;
      applyServerMerged(serverMerged);
    } catch (err) {
      console.error("updatePreferences: kunde inte spara:", err);
      pendingRef.current = { ...(pendingRef.current || {}), ...newPrefs };
    } finally {
      inflightRef.current--;
      settleStatus();
    }
  }

  // Skicka om ändringar som inte nådde servern (Spara igen-knappen).
  async function retrySave() {
    const patch = pendingRef.current;
    if (!patch || !session) return;
    inflightRef.current++;
    setSaveStatus("saving");
    try {
      const serverMerged = await pushPatch(patch);
      pendingRef.current = null;
      applyServerMerged(serverMerged);
    } catch (err) {
      console.error("retrySave: kunde inte spara:", err);
    } finally {
      inflightRef.current--;
      settleStatus();
    }
  }

  const displayName = preferences.display_name || session?.user?.email?.split("@")[0] || "";

  return (
    <UserContext.Provider value={{ userId, preferences, prefsLoaded, updatePreferences, saveStatus, retrySave, lastSeenAt, displayName, session }}>
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
