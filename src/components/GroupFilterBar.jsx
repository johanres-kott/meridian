import { useState } from "react";
import { sanitizeInput } from "../lib/sanitize.js";
import { useUser } from "../contexts/UserContext.jsx";

export default function GroupFilterBar({ items, activeGroup, setActiveGroup, isMobile }) {
  const { preferences, updatePreferences } = useUser();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const groups = preferences.groups || [];

  function createGroup() {
    const name = sanitizeInput(newGroupName);
    if (!name) return;
    if (groups.some(g => g.name === name)) return;
    const updated = [...groups, { name, members: [] }];
    updatePreferences({ groups: updated });
    setNewGroupName("");
    setCreatingGroup(false);
    setActiveGroup(name);
  }

  function deleteGroup(name) {
    if (!window.confirm(`Ta bort gruppen "${name}"?`)) return;
    const updated = groups.filter(g => g.name !== name);
    updatePreferences({ groups: updated });
    if (activeGroup === name) setActiveGroup(null);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : undefined, WebkitOverflowScrolling: isMobile ? "touch" : undefined, paddingBottom: isMobile ? 4 : undefined }}>
      <button
        onClick={() => setActiveGroup(null)}
        style={{
          fontSize: 12, padding: "5px 12px", borderRadius: 14,
          border: activeGroup === null ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: activeGroup === null ? "var(--accent-light)" : "var(--bg-card)",
          color: activeGroup === null ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer", fontFamily: "inherit", fontWeight: activeGroup === null ? 500 : 400,
          flexShrink: 0, whiteSpace: "nowrap",
        }}
      >
        Alla ({items.length})
      </button>
      {groups.map(g => {
        const count = (g.members || []).filter(m => items.some(i => i.id === m)).length;
        const isActive = activeGroup === g.name;
        return (
          <div key={g.name} style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={() => setActiveGroup(isActive ? null : g.name)}
              style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 14,
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: isActive ? "var(--accent-light)" : "var(--bg-card)",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer", fontFamily: "inherit", fontWeight: isActive ? 500 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {g.name} ({count})
            </button>
            {isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteGroup(g.name); }}
                title="Ta bort grupp"
                style={{ marginLeft: 2, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                onMouseEnter={e => e.currentTarget.style.color = "#f23645"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {creatingGroup ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") { setCreatingGroup(false); setNewGroupName(""); } }}
            autoFocus
            placeholder="Gruppnamn..."
            style={{ fontSize: 12, padding: "4px 10px", border: "1px solid var(--accent)", borderRadius: 14, outline: "none", fontFamily: "inherit", width: 140, background: "var(--bg-card)", color: "var(--text)" }}
          />
          <button onClick={createGroup} style={{ fontSize: 11, padding: "4px 8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
          <button onClick={() => { setCreatingGroup(false); setNewGroupName(""); }} style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Avbryt</button>
        </div>
      ) : (
        <button
          onClick={() => setCreatingGroup(true)}
          style={{ fontSize: 12, padding: "5px 12px", borderRadius: 14, border: "1px dashed var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          + Ny grupp
        </button>
      )}
    </div>
  );
}
