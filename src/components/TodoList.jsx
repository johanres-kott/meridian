import { useState } from "react";

export default function TodoList({ todos = [], onUpdate, isMobile }) {
  const [collapsed, setCollapsed] = useState(false);

  if (todos.length === 0) return null;

  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  function toggle(idx) {
    const updated = todos.map((t, i) => i === idx ? { ...t, done: !t.done } : t);
    onUpdate(updated);
  }

  function remove(idx) {
    const updated = todos.filter((_, i) => i !== idx);
    onUpdate(updated);
  }

  function clearDone() {
    onUpdate(todos.filter(t => !t.done));
  }

  return (
    <div style={{
      marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, overflow: "hidden",
    }}>
      <div style={{
        padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid var(--border-light)",
        background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Att göra</span>
          {pending.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
              background: "var(--accent)", color: "#fff",
            }}>
              {pending.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {done.length > 0 && (
            <button onClick={clearDone}
              style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Rensa klara
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 11, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {collapsed ? "Visa ▼" : "Dölj ▲"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: isMobile ? "8px 12px" : "8px 20px" }}>
          {/* Pending */}
          {pending.map((todo, i) => {
            const realIdx = todos.indexOf(todo);
            return (
              <div key={realIdx} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
                borderBottom: "1px solid var(--border-light)",
              }}>
                <input type="checkbox" checked={false} onChange={() => toggle(realIdx)}
                  style={{ marginTop: 3, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {todo.text.length > 200 ? todo.text.slice(0, 200) + "..." : todo.text}
                </div>
                <button onClick={() => remove(realIdx)}
                  style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f23645"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >×</button>
              </div>
            );
          })}

          {/* Done */}
          {done.map((todo, i) => {
            const realIdx = todos.indexOf(todo);
            return (
              <div key={realIdx} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0",
                borderBottom: "1px solid var(--border-light)", opacity: 0.5,
              }}>
                <input type="checkbox" checked={true} onChange={() => toggle(realIdx)}
                  style={{ marginTop: 3, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, textDecoration: "line-through" }}>
                  {todo.text.length > 200 ? todo.text.slice(0, 200) + "..." : todo.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
