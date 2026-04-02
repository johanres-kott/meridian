import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const SCRAPER_API = "https://thesion-scraper.vercel.app";

/**
 * Proxy for investment company holdings — hides scraper URL from client.
 * Public data, no auth required.
 */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (rateLimit(req, res, 30)) return;

  try {
    const upstream = await fetch(`${SCRAPER_API}/api/holdings`);
    if (!upstream.ok) {
      console.error("Holdings upstream error:", upstream.status);
      return res.status(upstream.status).json({ error: "Upstream error" });
    }
    const data = await upstream.json();
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Holdings proxy error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
