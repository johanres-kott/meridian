import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabase.js";

export default function ChatPanel({ open, onClose, contextFn }) {
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
      const context = contextFn ? contextFn() : {};
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
      width: 380, height: "100%", borderLeft: "1px solid #e0e3eb", display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #e0e3eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>AI-assistent</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#787b86", lineHeight: 1 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: "#b2b5be", fontSize: 12, textAlign: "center", marginTop: 40 }}>
            Fråga om din portfölj, marknader, råvaror...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            background: msg.role === "user" ? "#2962ff" : "#f0f3fa",
            color: msg.role === "user" ? "#fff" : "#131722",
          }}>
            {msg.content || (streaming && i === messages.length - 1 ? "..." : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e0e3eb", display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Skriv en fråga..."
          disabled={streaming}
          style={{
            flex: 1, padding: "8px 12px", border: "1px solid #e0e3eb", borderRadius: 6, fontSize: 12,
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            padding: "8px 14px", background: streaming || !input.trim() ? "#e0e3eb" : "#2962ff",
            color: streaming || !input.trim() ? "#787b86" : "#fff", border: "none", borderRadius: 6,
            fontSize: 12, cursor: streaming || !input.trim() ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          Skicka
        </button>
      </div>
    </div>
  );
}
