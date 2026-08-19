/**
 * Shared constants used across multiple components.
 * Centralised here to avoid duplication and ensure consistency.
 */

// --- Statuses ---
export const STATUSES = ["Bevakar", "Analyserar", "Intressant", "Äger", "Avstår"];

export const STATUS_COLORS = {
  Bevakar:     { bg: "var(--bg-secondary)", color: "var(--text-secondary)" },
  Analyserar:  { bg: "rgba(255,152,0,0.15)", color: "var(--warn)" },
  Intressant:  { bg: "rgba(15,154,108,0.15)", color: "var(--pos)" },
  Äger:        { bg: "rgba(15,122,92,0.15)", color: "var(--accent)" },
  Avstår:      { bg: "rgba(205,74,64,0.15)", color: "var(--neg)" },
};

// --- Country flags by exchange suffix ---
export const FLAG_MAP = {
  ST: "\u{1F1F8}\u{1F1EA}", HE: "\u{1F1EB}\u{1F1EE}", CO: "\u{1F1E9}\u{1F1F0}",
  OL: "\u{1F1F3}\u{1F1F4}", HK: "\u{1F1ED}\u{1F1F0}", L: "\u{1F1EC}\u{1F1E7}",
  PA: "\u{1F1EB}\u{1F1F7}", DE: "\u{1F1E9}\u{1F1EA}", AS: "\u{1F1F3}\u{1F1F1}",
  SW: "\u{1F1E8}\u{1F1ED}", T: "\u{1F1EF}\u{1F1F5}", TO: "\u{1F1E8}\u{1F1E6}",
};

export function getFlag(ticker) {
  if (!ticker) return "";
  const parts = ticker.split(".");
  if (parts.length > 1) return FLAG_MAP[parts[parts.length - 1]] || "\u{1F1FA}\u{1F1F8}";
  return "\u{1F1FA}\u{1F1F8}";
}

// --- Investor profile labels ---
export const PROFILE_LABELS = {
  value: "Värdeinvesterare",
  growth: "Tillväxtinvesterare",
  dividend: "Utdelningsinvesterare",
  mixed: "Blandat",
  index: "Indexinvesterare",
};

// --- Sector translations + emojis ---
export const SECTOR_EMOJI = {
  "Technology": "💻", "Tech": "💻",
  "Financial Services": "🏦", "Finans": "🏦",
  "Healthcare": "🏥", "Hälsovård": "🏥",
  "Industrials": "🏭", "Industri": "🏭",
  "Consumer Cyclical": "🛍️", "Konsument": "🛍️",
  "Consumer Defensive": "🛒",
  "Communication Services": "📡", "Kommunikation": "📡",
  "Basic Materials": "⛏️", "Råvaror": "⛏️",
  "Energy": "⚡", "Energi": "⚡",
  "Real Estate": "🏠", "Fastigheter": "🏠",
  "Utilities": "💡",
};

export const SECTOR_SV = {
  "Financial Services": "Finans", "Technology": "Tech", "Healthcare": "Hälsovård",
  "Industrials": "Industri", "Consumer Cyclical": "Konsument", "Communication Services": "Kommunikation",
  "Basic Materials": "Råvaror", "Energy": "Energi", "Real Estate": "Fastigheter",
  "Consumer Defensive": "Dagligvaror", "Utilities": "Kraftförsörjning",
};

// --- Risk colors (also available via CSS vars --green/--red/--orange) ---
export const COLORS = {
  green: "var(--pos)",
  red: "var(--neg)",
  orange: "var(--warn)",
};
