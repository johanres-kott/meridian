import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

/**
 * One-time seed endpoint. POST /api/analyses-seed with the analysis JSON body.
 * Requires authenticated user. Can be removed after seeding.
 */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return res.status(401).json({ error: "Not authenticated" });

  const analysis = req.body;
  if (!analysis?.slug || !analysis?.title) {
    return res.status(400).json({ error: "slug and title required" });
  }

  // Use service role or bypass RLS via the user's token
  const { data, error } = await supabase
    .from("analyses")
    .upsert(analysis, { onConflict: "slug" })
    .select()
    .single();

  if (error) {
    console.error("Seed error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, id: data.id, slug: data.slug });
}
