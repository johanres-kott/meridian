import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const SCRAPER_API = "https://thesion-scraper.vercel.app";

/**
 * Proxy for insider transactions — hides scraper URL from client.
 * Public data, no auth required.
 */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (rateLimit(req, res, 30)) return;

  const { ticker } = req.query;
  if (!ticker || ticker.length < 2 || ticker.length > 20) {
    return res.status(400).json({ error: "Invalid ticker" });
  }

  try {
    const upstream = await fetch(
      `${SCRAPER_API}/api/insider?ticker=${encodeURIComponent(ticker)}`
    );
    if (!upstream.ok) {
      console.error("Insider upstream error:", upstream.status, ticker);
      return res.status(upstream.status).json({ error: "Upstream error" });
    }
    const data = await upstream.json();
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Insider proxy error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
