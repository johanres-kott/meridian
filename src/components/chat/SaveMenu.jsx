import { useState } from "react";
import { supabase } from "../../supabase.js";

export default function SaveMenu({ content, onSaveStrategy, onSaveTodo }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showStocks, setShowStocks] = useState(false);

  async function loadStocks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("watchlist").select("id, ticker, name").eq("user_id", user.id).order("name");
    setStocks(data || []);
    setShowStocks(true);
    setOpen(false);
  }

  async function saveInsight(stock) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase.from("watchlist").select("notes").eq("id", stock.id).single();
    const date = new Date().toLocaleDateString("sv-SE");
    const newNotes = (existing?.notes || "") + `\n\n--- AI-insikt ${date} ---\n` + content;
    await supabase.from("watchlist").update({ notes: newNotes }).eq("id", stock.id).eq("user_id", user.id);
    setSaved("insight");
    setShowStocks(false);
  }

  if (saved) return <span style={{ fontSize: 10, color: "#089981" }}>{saved === "todo" ? "✓ Tillagd som att-göra" : saved === "strategy" ? "✓ Strategi sparad" : "✓ Insikt sparad"}</span>;

  const menuBtn = { display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 11, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "var(--text)", borderRadius: 4 };

  return (
    <div style={{ position: "relative", marginTop: 4 }}>
      <button onClick={() => { setOpen(!open); setShowStocks(false); }}
        style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        Spara ▾
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", padding: "4px 0", zIndex: 100, minWidth: 180, marginBottom: 4 }}>
          {onSaveTodo && <button style={menuBtn} onClick={() => { onSaveTodo(content); setSaved("todo"); setOpen(false); }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>📋 Spara som att-göra</button>}
          {onSaveStrategy && <button style={menuBtn} onClick={() => { onSaveStrategy(content); setSaved("strategy"); setOpen(false); }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>🎯 Spara som strategi</button>}
          <button style={menuBtn} onClick={loadStocks} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>💡 Spara insikt till bolag</button>
        </div>
      )}
      {showStocks && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", padding: "4px 0", zIndex: 100, minWidth: 200, maxHeight: 200, overflow: "auto", marginBottom: 4 }}>
          {stocks.map(s => (
            <button key={s.id} style={menuBtn} onClick={() => saveInsight(s)} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {s.name || s.ticker} <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
