import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";
import Markdown from "./Markdown.jsx";
import SaveMenu from "./chat/SaveMenu.jsx";
import InvestmentWizard from "./chat/InvestmentWizard.jsx";
import PurchaseWizard from "./chat/PurchaseWizard.jsx";

export default function ChatPanel({ open, onClose, contextFn, sharePortfolio = true, onSaveStrategy, onSaveTodo }) {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [wizardActive, setWizardActive] = useState(false);
  const [purchaseWizardActive, setPurchaseWizardActive] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendWithMessage(directText) {
    const text = directText || input.trim();
    if (!text || streaming) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!directText) setInput("");
    setStreaming(true);

    const assistantMsg = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const fullContext = contextFn ? contextFn() : {};
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
          } catch { /* partial SSE chunk, expected */ }
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

  const quickActions = [
    { emoji: "📊", text: "Analysera min portfölj", q: "Analysera min portfölj — vad är bra och vad kan förbättras?" },
    { emoji: "💡", text: "Ge mig en investeringsplan", wizard: true },
    { emoji: "📈", text: "Vad driver min portfölj?", q: "Analysera vilka aktier som påverkat min portfölj mest — både uppåt och nedåt. Vad har gått bra och vad har gått dåligt?" },
    { emoji: "🔄", text: "Vad borde jag sälja/köpa?", q: "Vilka aktier borde jag sälja och vilka borde jag köpa istället? Ge konkreta förslag." },
    { emoji: "🛒", text: "Registrera köp", purchase: true },
  ];

  const compactActions = [
    { emoji: "📊", text: "Analysera portföljen", q: "Analysera min portfölj — vad är bra och vad kan förbättras?" },
    { emoji: "💡", text: "Investeringsplan", wizard: true },
    { emoji: "🔄", text: "Köpa/sälja?", q: "Vilka aktier borde jag sälja och vilka borde jag köpa istället? Ge konkreta förslag." },
    { emoji: "🛒", text: "Registrera köp", purchase: true },
  ];

  function handleAction(item) {
    if (item.wizard) setWizardActive(true);
    else if (item.purchase) setPurchaseWizardActive(true);
    else sendWithMessage(item.q);
  }

  return (
    <div style={{
      ...(isMobile
        ? { position: "fixed", inset: 0, zIndex: 1000, width: "100%", height: "100%" }
        : { width: 380, height: "100%", borderLeft: "1px solid var(--border)", flexShrink: 0 }),
      display: "flex", flexDirection: "column", background: "var(--bg-secondary)",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, var(--accent), #1e88e5)", color: "#fff" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Mats <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Finansassistent (AI)</span></span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              Hej! Jag är Mats. Vad kan jag hjälpa dig med?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {quickActions.map((item, i) => (
                <button key={i} onClick={() => handleAction(item)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "var(--text)",
                    textAlign: "left", transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  {item.text}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "8px 0", textAlign: "center", marginTop: 8 }}>
              {sharePortfolio
                ? "🔓 Mats har tillgång till din portfölj"
                : "🔒 Portföljdata delas inte"}
            </div>
          </div>
        )}
        {wizardActive && (
          <InvestmentWizard
            onComplete={(answers) => {
              setWizardActive(false);
              const isNew = answers.type === "investera färska pengar";
              const parts = [`Jag vill ${answers.type}.`];
              if (isNew && answers.amount) {
                parts.push(`Belopp: ${answers.amount}.`);
              }
              parts.push("Analysera min profil och nuvarande portfölj, föreslå konkreta bolag med ticker, belopp per bolag och motivering.");
              if (!isNew) {
                parts.push("Föreslå vilka aktier jag borde sälja och vad jag borde köpa istället.");
              }
              sendWithMessage(`Ge mig en konkret investeringsplan. ${parts.join(" ")}`);
            }}
            onCancel={() => setWizardActive(false)}
          />
        )}
        {purchaseWizardActive && (
          <PurchaseWizard
            contextFn={contextFn}
            onComplete={(result) => {
              setPurchaseWizardActive(false);
              const confirmMsg = result.wasExisting
                ? `Köp registrerat! ${result.shares} st ${result.name} (${result.ticker}) à ${result.price.toLocaleString("sv-SE")} kr. Du äger nu totalt ${result.newTotalShares} st.`
                : `Köp registrerat! ${result.shares} st ${result.name} (${result.ticker}) à ${result.price.toLocaleString("sv-SE")} kr har lagts till i din portfölj.`;
              setMessages(prev => [
                ...prev,
                { role: "assistant", content: `✅ **${confirmMsg}**\n\nLadda om portföljsidan för att se uppdateringen.` },
              ]);
            }}
            onCancel={() => setPurchaseWizardActive(false)}
          />
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: msg.role === "user" ? "pre-wrap" : undefined,
              background: msg.role === "user" ? "var(--accent)" : "var(--border-light)",
              color: msg.role === "user" ? "#fff" : "var(--text)",
            }}>
              {msg.role === "assistant" && msg.content
                ? <Markdown text={msg.content} compact />
                : (msg.content || (streaming && i === messages.length - 1 ? "..." : ""))}
            </div>
            {msg.role === "assistant" && msg.content && !streaming && (
              <SaveMenu content={msg.content} onSaveStrategy={onSaveStrategy} onSaveTodo={onSaveTodo} />
            )}
          </div>
        ))}
        {messages.length > 0 && !streaming && !wizardActive && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {compactActions.map((item, i) => (
              <button key={i} onClick={() => handleAction(item)}
                style={{
                  padding: "6px 10px", borderRadius: 14, border: "1px solid var(--border)",
                  background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 11, color: "var(--text-secondary)", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                {item.emoji} {item.text}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendWithMessage(); } }}
          placeholder="Skriv en fråga..."
          disabled={streaming}
          style={{
            flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, background: "var(--bg-card)", color: "var(--text)",
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={() => sendWithMessage()}
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
