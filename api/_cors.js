export const ALLOWED_ORIGINS = [
  "https://www.thesion.tech",
  "https://thesion.tech",
];

/** Sant för kända produktions-origins och localhost (dev). */
export function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
}

export function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
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
