import { useTranslation } from "react-i18next";

// Min del / Hushållet — liten pill-växel för nettoförmögenhetsvyn (FAMILY.md).
// Renderas av HomeHero och NetWorthCard ENDAST när hushållsvyn är meningsfull
// (medlemmar finns och minst en rad är delad); valet sparas i preferences
// (netWorthView) av föräldern.

export default function NetWorthViewToggle({ value, onChange }) {
  const { t } = useTranslation();
  const options = [
    { id: "mine", label: t("myFinances.viewMine") },
    { id: "household", label: t("myFinances.viewHousehold") },
  ];
  return (
    <div role="group" aria-label={t("myFinances.viewToggle")}
      style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 999, padding: 2, background: "var(--bg-secondary)" }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange?.(o.id)} aria-pressed={active}
            style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: active ? 600 : 400,
              background: active ? "var(--bg-card)" : "transparent",
              color: active ? "var(--text)" : "var(--text-secondary)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
