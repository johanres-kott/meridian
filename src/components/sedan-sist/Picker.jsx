import { useState } from "react";

export default function Picker({ items, selected, onSave, onCancel, isMobile }) {
  const [checked, setChecked] = useState(new Set(selected));

  function toggle(symbol) {
    const next = new Set(checked);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    setChecked(next);
  }

  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "2px 8px" : "2px 16px" }}>
        {items.map(item => (
          <label key={item.symbol} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={checked.has(item.symbol)}
              onChange={() => toggle(item.symbol)}
              style={{ accentColor: "var(--accent)" }}
            />
            <span style={{ color: "var(--text)" }}>{item.name}</span>
            <span style={{ color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{item.symbol}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onSave([...checked])}
          style={{ fontSize: 11, color: "#fff", background: "var(--accent)", border: "none", borderRadius: 3, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Spara
        </button>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Avbryt
        </button>
        {checked.size > 0 && (
          <button
            onClick={() => onSave([])}
            style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}
          >
            Aterstall
          </button>
        )}
      </div>
    </div>
  );
}
