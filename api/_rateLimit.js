// Simple in-memory rate limiter for Vercel serverless functions.
// Note: Each serverless instance has its own memory, so this is
// per-instance, not global. Still effective against single-source abuse.

const windows = new Map();

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of windows) {
    if (now - entry.start > 120_000) windows.delete(key);
  }
}

/**
 * @param {object} req
 * @param {object} res
 * @param {number} maxRequests - Max requests per window (default 60)
 * @param {number} windowMs - Window size in ms (default 60000 = 1 min)
 * @returns {boolean} true if rate limited (already sent 429)
 */
export function rateLimit(req, res, maxRequests = 60, windowMs = 60_000) {
  // Skip rate limiting in local development
  if (process.env.NODE_ENV === "development" || !req.headers["x-forwarded-for"]) {
    return false;
  }
  cleanup();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const key = `${ip}:${req.url?.split("?")[0] || "/"}`;
  const now = Date.now();

  let entry = windows.get(key);
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
    windows.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    res.setHeader("Retry-After", Math.ceil((entry.start + windowMs - now) / 1000));
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return true;
  }

  return false;
}
