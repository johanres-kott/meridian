import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

// Proxy för skrivningar mot manual_assets (skapa/radera). Läsningar går direkt
// från klienten, men skrivningar visade sig opålitliga i Safari (fetch mot
// *.supabase.co avbryts: "TypeError: Load failed") — via localhost slipper vi
// hela felklassen, samma mönster som övriga JWT-proxys. RLS gäller fortfarande:
// anon-nyckel + användarens token, user_id sätts server-side från verifierad JWT.

const KINDS = ["bostad", "fordon", "sparkonto", "buffert", "ovrigt", "bolan", "skuld", "vinstandel"];

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 60)) return;
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = auth.slice(7);
    const supabase = getSupabase({
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        return res.status(400).json({ error: "id required" });
      }
      const { error } = await supabase
        .from("manual_assets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        console.error("manual-assets delete error:", error);
        return res.status(500).json({ error: "Could not delete" });
      }
      return res.status(200).json({ ok: true });
    }

    const { kind, label, value_sek, is_debt, metadata } = req.body || {};
    if (!KINDS.includes(kind)) {
      return res.status(400).json({ error: "invalid kind" });
    }
    if (typeof label !== "string" || !label.trim() || label.length > 120) {
      return res.status(400).json({ error: "invalid label" });
    }
    const value = Number(value_sek);
    if (!Number.isFinite(value) || value < 0 || value > 1e12) {
      return res.status(400).json({ error: "invalid value" });
    }
    const meta = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
    if (JSON.stringify(meta).length > 20_000) {
      return res.status(413).json({ error: "metadata too large" });
    }

    const { data, error } = await supabase
      .from("manual_assets")
      .insert({
        user_id: user.id,
        kind,
        label: label.trim(),
        value_sek: value,
        is_debt: !!is_debt,
        metadata: meta,
      })
      .select()
      .single();
    if (error) {
      console.error("manual-assets insert error:", error);
      return res.status(500).json({ error: "Could not save" });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("manual-assets error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
