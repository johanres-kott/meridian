import { withCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

const SCRAPER_API = "https://thesion-scraper.vercel.app";

/**
 * Proxy for notifications — keeps user_id server-side.
 * Verifies Supabase auth token and extracts user_id.
 */
async function handler(req, res) {
  if (rateLimit(req, res, 30)) return;

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

    const upstream = await fetch(
      `${SCRAPER_API}/api/notifications?user_id=${encodeURIComponent(user.id)}`
    );
    if (!upstream.ok) {
      console.error("Notifications upstream error:", upstream.status);
      return res.status(upstream.status).json({ error: "Upstream error" });
    }
    const data = await upstream.json();
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Notifications proxy error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export default withCors(handler);
