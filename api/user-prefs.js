import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

// Proxy för preferences-skrivningar (kassaflöde, sparmål, profil, todos…).
// Direkta PATCH:ar mot *.supabase.co strups i Safari ("TypeError: Load
// failed") — via localhost slipper vi felklassen, samma mönster som
// /api/manual-assets. Mergen görs atomiskt i databasen via RPC:n
// merge_preferences (migrations/2026-08-20_user_prefs_merge.sql) med
// användarens egen token, så RLS gäller. Är migrationen inte körd faller vi
// tillbaka på gamla läs → merge → skriv-vägen (som kan kapplöpa).

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 120)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  const patch = req.body;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return res.status(400).json({ error: "body must be an object" });
  }
  if (JSON.stringify(patch).length > 200_000) {
    return res.status(413).json({ error: "payload too large" });
  }

  try {
    const token = auth.slice(7);
    const supabase = getSupabase({ global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    // Atomisk merge i en sats — ingen läs/skriv-lucka mellan två anrop
    const { data: rpcPrefs, error: rpcErr } = await supabase.rpc("merge_preferences", { p_patch: patch });
    if (!rpcErr) {
      return res.status(200).json({ preferences: rpcPrefs });
    }
    // 42883 (Postgres) / PGRST202 (PostgREST) = funktionen finns inte, dvs
    // migrationen är inte körd — då tar gamla vägen över. Andra fel är hårda.
    if (rpcErr.code !== "42883" && rpcErr.code !== "PGRST202") {
      console.error("user-prefs merge_preferences error:", rpcErr);
      return res.status(500).json({ error: "Could not save preferences" });
    }
    console.warn("merge_preferences saknas (kör migrations/2026-08-20_user_prefs_merge.sql) — faller tillbaka på läs → merge → skriv");

    const { data: existing, error: readErr } = await supabase
      .from("user_prefs")
      .select("preferences")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readErr) {
      console.error("user-prefs read error:", readErr);
      return res.status(500).json({ error: "Could not read preferences" });
    }

    const merged = { ...(existing?.preferences || {}), ...patch };
    const { error: writeErr } = existing
      ? await supabase.from("user_prefs").update({ preferences: merged }).eq("user_id", user.id)
      : await supabase.from("user_prefs").insert({ user_id: user.id, preferences: merged });
    if (writeErr) {
      console.error("user-prefs write error:", writeErr);
      return res.status(500).json({ error: "Could not save preferences" });
    }
    return res.status(200).json({ preferences: merged });
  } catch (err) {
    console.error("user-prefs error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
