/**
 * Returns a human-readable relative time string in Swedish.
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export default function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just nu";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} tim sedan`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dag${days > 1 ? "ar" : ""} sedan`;
  return date.toLocaleDateString("sv-SE");
}
