/**
 * Input sanitization utilities to prevent stored XSS.
 *
 * React escapes JSX expressions by default, but we sanitize before
 * persisting to Supabase so that no malicious markup is ever stored.
 */

/**
 * Strip HTML tags and trim whitespace.
 * Use for user-supplied text before storing in the database
 * (search queries, notes, group names, display names).
 */
export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Escape HTML entities for safe rendering in non-React contexts.
 * Converts &, <, >, ", ' to their HTML entity equivalents.
 */
export function sanitizeForDisplay(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate a ticker symbol. Only allows alphanumeric characters,
 * dots, hyphens, and carets (for index symbols like ^GSPC).
 * Returns the validated ticker or null if invalid.
 */
export function validateTicker(ticker) {
  if (typeof ticker !== "string") return null;
  const trimmed = ticker.trim();
  if (!trimmed) return null;
  // Allow A-Z, a-z, 0-9, dots, hyphens, carets, and percent-encoded carets
  if (!/^[A-Za-z0-9.\-^%]+$/.test(trimmed)) return null;
  return trimmed;
}
