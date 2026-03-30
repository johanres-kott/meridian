import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabase.js";

function SaveInsightButton({ content, contextFn }) {
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

    // Get existing notes
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

function SaveStrategyButton({ content, onSave }) {
  const [saved, setSaved] = useState(false);

  if (saved) return <span style={{ fontSize: 10, color: "#089981" }}>Strategi sparad!</span>;

  return (
    <button
      onClick={() => { onSave(content); setSaved(true); }}
      style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0", marginTop: 2 }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
    >
      Spara som investeringsstrategi
    </button>
  );
}

export default function ChatPanel({ open, onClose, contextFn, sharePortfolio = true, onSaveStrategy }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const fullContext = contextFn ? contextFn() : {};
      // Strip portfolio data if user opted out
      const context = sharePortfolio ? fullContext : {
        indices: fullContext.indices,
        commodities: fullContext.commodities,
        investorProfile: fullContext.investorProfile,
      };
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Fel: Kunde inte nå AI-tjänsten." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  if (!open) return null;

  return (
    <div style={{
      width: 380, height: "100%", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-secondary)", flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, var(--accent), #1e88e5)", color: "#fff" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Mats <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Finansassistent (AI)</span></span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12 }}>
              Hej! Jag är Mats — din AI-drivna finansassistent. Fråga mig om din portfölj, aktieanalys, marknader eller investeringsstrategier.
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 6, display: "inline-block" }}>
              {sharePortfolio
                ? "🔓 AI:n har tillgång till din portfölj för personliga svar"
                : "🔒 Portföljdata delas inte med AI:n"}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              background: msg.role === "user" ? "var(--accent)" : "var(--border-light)",
              color: msg.role === "user" ? "#fff" : "var(--text)",
            }}>
              {msg.content || (streaming && i === messages.length - 1 ? "..." : "")}
            </div>
            {msg.role === "assistant" && msg.content && !streaming && (
              <div style={{ display: "flex", gap: 12 }}>
                <SaveInsightButton content={msg.content} contextFn={contextFn} />
                {onSaveStrategy && <SaveStrategyButton content={msg.content} onSave={onSaveStrategy} />}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Skriv en fråga..."
          disabled={streaming}
          style={{
            flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, background: "var(--bg-card)", color: "var(--text)",
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            padding: "8px 14px", background: streaming || !input.trim() ? "var(--border)" : "var(--accent)",
            color: streaming || !input.trim() ? "var(--text-secondary)" : "#fff", border: "none", borderRadius: 6,
            fontSize: 12, cursor: streaming || !input.trim() ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          Skicka
        </button>
      </div>
    </div>
  );
}
