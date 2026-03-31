import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabase.js";

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (!boldMatch) { parts.push(remaining); break; }
    const idx = boldMatch.index;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
    remaining = remaining.slice(idx + boldMatch[0].length);
  }
  return parts;
}

function ChatMarkdown({ text }) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <div key={i} style={{ fontWeight: 600, fontSize: 12, marginTop: i > 0 ? 6 : 0 }}>{renderInline(line.slice(4))}</div>;
    if (line.startsWith("## ")) return <div key={i} style={{ fontWeight: 600, fontSize: 13, marginTop: i > 0 ? 8 : 0 }}>{renderInline(line.slice(3))}</div>;
    if (line.startsWith("# ")) return <div key={i} style={{ fontWeight: 700, fontSize: 13, marginTop: i > 0 ? 8 : 0 }}>{renderInline(line.slice(2))}</div>;
    if (/^---+$/.test(line.trim())) return <hr key={i} style={{ border: "none", borderTop: "1px solid currentColor", opacity: 0.15, margin: "6px 0" }} />;
    if (/^\d+\.\s/.test(line)) return <div key={i} style={{ paddingLeft: 4, marginTop: 2 }}>{renderInline(line)}</div>;
    if (line.startsWith("- ")) return <div key={i} style={{ paddingLeft: 4, marginTop: 2 }}>{renderInline(line)}</div>;
    if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
    return <div key={i} style={{ marginTop: 1 }}>{renderInline(line)}</div>;
  });
}

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

function SaveMenu({ content, contextFn, onSaveStrategy, onSaveTodo }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(null); // null | "todo" | "strategy" | "insight"
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

function SaveTodoButton({ content, onSave }) {
  const [saved, setSaved] = useState(false);

  if (saved) return <span style={{ fontSize: 10, color: "#089981" }}>Tillagd!</span>;

  return (
    <button
      onClick={() => { onSave(content); setSaved(true); }}
      style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0", marginTop: 2 }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
    >
      Spara som att-göra
    </button>
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

const PLAN_QUESTIONS = [
  {
    key: "type",
    question: "Vill du sätta in nya pengar eller omfördela det du redan har?",
    options: [
      { label: "Nya pengar", value: "investera färska pengar" },
      { label: "Omfördela", value: "omfördela min befintliga portfölj" },
    ],
  },
  {
    key: "amount",
    question: "Hur mycket vill du investera?",
    options: [
      { label: "5 000 kr", value: "5000" },
      { label: "10 000 kr", value: "10000" },
      { label: "25 000 kr", value: "25000" },
      { label: "50 000 kr", value: "50000" },
      { label: "100 000 kr", value: "100000" },
    ],
    allowCustom: true,
    customPlaceholder: "Ange belopp i kr...",
    onlyIf: (answers) => answers.type === "investera färska pengar",
  },
];

function InvestmentWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customValue, setCustomValue] = useState("");

  // Find the next applicable question
  function nextApplicableStep(fromStep, currentAnswers) {
    for (let i = fromStep; i < PLAN_QUESTIONS.length; i++) {
      const q = PLAN_QUESTIONS[i];
      if (!q.onlyIf || q.onlyIf(currentAnswers)) return i;
    }
    return -1; // no more questions
  }

  const effectiveStep = nextApplicableStep(step, answers);
  const q = effectiveStep >= 0 ? PLAN_QUESTIONS[effectiveStep] : null;

  function select(value) {
    const updated = { ...answers, [q.key]: value };
    setAnswers(updated);
    setCustomValue("");
    const next = nextApplicableStep(effectiveStep + 1, updated);
    if (next >= 0) {
      setStep(next);
    } else {
      onComplete(updated);
    }
  }

  function submitCustom() {
    const val = customValue.trim();
    if (!val) return;
    select(val + " kr");
  }

  const chipStyle = {
    padding: "8px 14px", borderRadius: 16, border: "1px solid var(--border)",
    background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit",
    fontSize: 12, color: "var(--text)", transition: "all 0.15s",
  };

  if (!q) return null;

  // Count which visible step we're on
  const applicableQuestions = PLAN_QUESTIONS.filter(pq => !pq.onlyIf || pq.onlyIf(answers));
  const visibleStepIndex = applicableQuestions.indexOf(q) + 1;

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--border-light)", fontSize: 12, lineHeight: 1.5, color: "var(--text)", marginBottom: 8 }}>
        {q.question}
        {applicableQuestions.length > 1 && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            Steg {visibleStepIndex} av {applicableQuestions.length}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {q.options.map(opt => (
          <button key={opt.value} onClick={() => select(opt.value)} style={chipStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {q.allowCustom && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input
            value={customValue}
            onChange={e => setCustomValue(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter") submitCustom(); }}
            placeholder={q.customPlaceholder}
            style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit", outline: "none" }}
          />
          {customValue && (
            <button onClick={submitCustom} style={{ ...chipStyle, background: "var(--accent)", color: "#fff", border: "none" }}>
              {Number(customValue).toLocaleString("sv-SE")} kr
            </button>
          )}
        </div>
      )}
      <button onClick={onCancel} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
        Avbryt
      </button>
    </div>
  );
}

export default function ChatPanel({ open, onClose, contextFn, sharePortfolio = true, onSaveStrategy, onSaveTodo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [wizardActive, setWizardActive] = useState(false);
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
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              Hej! Jag är Mats. Vad kan jag hjälpa dig med?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { emoji: "📊", text: "Analysera min portfölj", q: "Analysera min portfölj — vad är bra och vad kan förbättras?" },
                { emoji: "💡", text: "Ge mig en investeringsplan", wizard: true },
                { emoji: "📈", text: "Vad driver min portfölj?", q: "Analysera vilka aktier som påverkat min portfölj mest — både uppåt och nedåt. Vad har gått bra och vad har gått dåligt?" },
                { emoji: "🔄", text: "Vad borde jag sälja/köpa?", q: "Vilka aktier borde jag sälja och vilka borde jag köpa istället? Ge konkreta förslag." },
              ].map((item, i) => (
                <button key={i} onClick={() => item.wizard ? setWizardActive(true) : sendWithMessage(item.q)}
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
                ? <ChatMarkdown text={msg.content} />
                : (msg.content || (streaming && i === messages.length - 1 ? "..." : ""))}
            </div>
            {msg.role === "assistant" && msg.content && !streaming && (
              <SaveMenu content={msg.content} contextFn={contextFn} onSaveStrategy={onSaveStrategy} onSaveTodo={onSaveTodo} />
            )}
          </div>
        ))}
        {messages.length > 0 && !streaming && !wizardActive && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {[
              { emoji: "📊", text: "Analysera portföljen", q: "Analysera min portfölj — vad är bra och vad kan förbättras?" },
              { emoji: "💡", text: "Investeringsplan", wizard: true },
              { emoji: "🔄", text: "Köpa/sälja?", q: "Vilka aktier borde jag sälja och vilka borde jag köpa istället? Ge konkreta förslag." },
            ].map((item, i) => (
              <button key={i} onClick={() => item.wizard ? setWizardActive(true) : sendWithMessage(item.q)}
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
