import { shareClass } from "../lib/shareClass.js";

// Small pill showing the Swedish share class (A / B / C / D / PREF) next to a
// company name. Renders nothing for tickers without a share-class suffix.
//
// Pass `classes` as an array to render a grouped row (e.g. ["A","B"] → "A/B").
// Otherwise the class is derived from `ticker`.
export default function ShareClassBadge({ ticker, classes, size = "sm" }) {
  const label = classes && classes.length > 0 ? classes.join("/") : shareClass(ticker);
  if (!label) return null;

  const padding = size === "xs" ? "0px 4px" : "1px 5px";
  const fontSize = size === "xs" ? 9 : 10;

  return (
    <span
      title={`Aktieklass ${label}`}
      style={{
        fontSize,
        padding,
        borderRadius: 3,
        background: "var(--bg-secondary)",
        color: "var(--text-secondary)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        fontFamily: "'IBM Plex Mono', monospace",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}
