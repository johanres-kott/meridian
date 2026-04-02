const ALLOWED_ORIGINS = [
  "https://www.thesion.tech",
  "https://thesion.tech",
];

export function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Wrapper that applies CORS and handles OPTIONS preflight.
 * Usage: export default withCors(handler)
 */
export function withCors(handler) {
  return function corsWrapped(req, res) {
    setCors(req, res);
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    return handler(req, res);
  };
}
