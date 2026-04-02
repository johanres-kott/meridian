import { useState } from "react";
import { supabase } from "../../supabase.js";

export default function SaveInsightButton({ content }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [stocks, setStocks] = useState([]);

  async function loadStocks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("watchlist").select("id, ticker, name").eq("user_id", user.id).order("name");
    setStocks(data || []);
    setShowPicker(true);
  }

  async function saveToStock(stock) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase.from("watchlist").select("notes").eq("id", stock.id).single();
    const date = new Date().toLocaleDateString("sv-SE");
    const insightHeader = `\n\n--- AI-insikt ${date} ---\n`;
    const newNotes = (existing?.notes || "") + insightHeader + content;

    await supabase.from("watchlist").update({ notes: newNotes }).eq("id", stock.id).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    setShowPicker(false);
  }

  if (saved) return <span style={{ fontSize: 10, color: "#089981" }}>Sparat!</span>;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={loadStocks}
        disabled={saving}
        style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0", marginTop: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        Spara insikt till bolag →
      </button>
      {showPicker && (
        <div style={{
          position: "absolute", bottom: "100%", left: 0, background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          padding: "4px 0", zIndex: 100, minWidth: 200, maxHeight: 200, overflow: "auto", marginBottom: 4,
        }}>
          {stocks.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)" }}>Inga bolag i portföljen</div>
          ) : stocks.map(s => (
            <button key={s.id} onClick={() => saveToStock(s)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 12px", fontSize: 11, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "var(--text)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {s.name || s.ticker}
              <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 6 }}>{s.ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
