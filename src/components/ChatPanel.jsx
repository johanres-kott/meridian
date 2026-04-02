import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";
import Markdown from "./Markdown.jsx";

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

function PurchaseWizard({ onComplete, onCancel, contextFn }) {
  const [step, setStep] = useState(0); // 0: search stock, 1: shares, 2: price, 3: confirm
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [selected, setSelected] = useState(null); // { ticker, name }
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load portfolio stocks on mount
  useEffect(() => {
    const ctx = contextFn ? contextFn() : {};
    const owned = (ctx.portfolio || []).filter(c => c.shares > 0);
    setPortfolio(owned);
  }, []);

  async function searchStock(q) {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults((data.results || data || []).slice(0, 6));
    } catch { setSearchResults([]); }
    setSearching(false);
  }

  function selectStock(stock) {
    setSelected({ ticker: stock.ticker || stock.symbol, name: stock.name || stock.description });
    setStep(1);
  }

  async function submitPurchase() {
    if (!selected || !shares || !price) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      const numShares = parseFloat(shares);
      const numPrice = parseFloat(price);

      // Check if stock already exists in watchlist
      const { data: existing } = await supabase.from("watchlist")
        .select("id, shares, gav")
        .eq("user_id", user.id)
        .eq("ticker", selected.ticker)
        .single();

      if (existing) {
        // Recalculate GAV: weighted average
        const oldShares = existing.shares || 0;
        const oldGav = existing.gav || 0;
        const totalShares = oldShares + numShares;
        const newGav = totalShares > 0
          ? ((oldShares * oldGav) + (numShares * numPrice)) / totalShares
          : numPrice;

        await supabase.from("watchlist")
          .update({ shares: totalShares, gav: parseFloat(newGav.toFixed(2)), status: "Äger" })
          .eq("id", existing.id);
      } else {
        // Add new stock to watchlist
        await supabase.from("watchlist")
          .insert({
            ticker: selected.ticker,
            name: selected.name,
            user_id: user.id,
            shares: numShares,
            gav: numPrice,
            status: "Äger",
          });
      }

      onComplete({
        ticker: selected.ticker,
        name: selected.name,
        shares: numShares,
        price: numPrice,
        wasExisting: !!existing,
        newTotalShares: existing ? (existing.shares || 0) + numShares : numShares,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const chipStyle = {
    padding: "8px 14px", borderRadius: 16, border: "1px solid var(--border)",
    background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit",
    fontSize: 12, color: "var(--text)", transition: "all 0.15s",
  };

  const inputStyle = {
    width: "100%", padding: "8px 10px", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 12, background: "var(--bg-card)", color: "var(--text)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--border-light)", fontSize: 12, lineHeight: 1.5, color: "var(--text)", marginBottom: 8 }}>
        {step === 0 && "Vilken aktie har du köpt?"}
        {step === 1 && `Hur många aktier köpte du av ${selected?.name}?`}
        {step === 2 && "Till vilken kurs per aktie?"}
        {step === 3 && "Stämmer detta?"}
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
          Registrera köp — Steg {step + 1} av 4
        </div>
      </div>

      {/* Step 0: Select stock */}
      {step === 0 && (
        <div>
          {/* Show portfolio stocks as quick picks */}
          {portfolio.length > 0 && !searchQuery && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Dina aktier:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {portfolio.slice(0, 8).map((s, i) => (
                  <button key={i} onClick={() => selectStock({ ticker: s.ticker, name: s.name })} style={{ ...chipStyle, fontSize: 11, padding: "6px 10px" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
                  >
                    {s.name?.split(" ")[0] || s.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchStock(e.target.value); }}
            placeholder="Sök aktie..."
            autoFocus
            style={inputStyle}
          />
          {searching && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Söker...</div>}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => selectStock(r)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                    color: "var(--text)", textAlign: "left",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <span>{r.name || r.description}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.ticker || r.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Number of shares */}
      {step === 1 && (
        <div>
          <input
            value={shares}
            onChange={e => setShares(e.target.value.replace(/[^0-9.,]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter" && shares) { setStep(2); } }}
            placeholder="Antal aktier..."
            autoFocus
            type="text"
            inputMode="decimal"
            style={inputStyle}
          />
          {shares && (
            <button onClick={() => setStep(2)} style={{ ...chipStyle, marginTop: 6, background: "var(--accent)", color: "#fff", border: "none" }}>
              {shares} st →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Price per share */}
      {step === 2 && (
        <div>
          <input
            value={price}
            onChange={e => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter" && price) { setStep(3); } }}
            placeholder="Kurs per aktie (SEK)..."
            autoFocus
            type="text"
            inputMode="decimal"
            style={inputStyle}
          />
          {price && (
            <button onClick={() => setStep(3)} style={{ ...chipStyle, marginTop: 6, background: "var(--accent)", color: "#fff", border: "none" }}>
              {Number(price).toLocaleString("sv-SE")} kr/st →
            </button>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <div style={{
            padding: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)",
            fontSize: 12, lineHeight: 1.8,
          }}>
            <div><strong>{selected?.name}</strong> <span style={{ color: "var(--text-muted)" }}>({selected?.ticker})</span></div>
            <div>Antal: <strong>{shares} st</strong></div>
            <div>Kurs: <strong>{Number(price).toLocaleString("sv-SE")} kr</strong></div>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6, fontWeight: 500 }}>
              Totalt: {(parseFloat(shares) * parseFloat(price)).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr
            </div>
          </div>
          {error && <div style={{ fontSize: 11, color: "#f23645", marginTop: 6 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={submitPurchase} disabled={saving}
              style={{ ...chipStyle, flex: 1, background: "#089981", color: "#fff", border: "none", textAlign: "center", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Sparar..." : "✓ Registrera köp"}
            </button>
            <button onClick={() => setStep(0)} style={{ ...chipStyle, fontSize: 11, color: "var(--text-secondary)" }}>
              Ändra
            </button>
          </div>
        </div>
      )}

      <button onClick={onCancel} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
        Avbryt
      </button>
    </div>
  );
}

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
              {[
                { emoji: "📊", text: "Analysera min portfölj", q: "Analysera min portfölj — vad är bra och vad kan förbättras?" },
                { emoji: "💡", text: "Ge mig en investeringsplan", wizard: true },
                { emoji: "📈", text: "Vad driver min portfölj?", q: "Analysera vilka aktier som påverkat min portfölj mest — både uppåt och nedåt. Vad har gått bra och vad har gått dåligt?" },
                { emoji: "🔄", text: "Vad borde jag sälja/köpa?", q: "Vilka aktier borde jag sälja och vilka borde jag köpa istället? Ge konkreta förslag." },
                { emoji: "🛒", text: "Registrera köp", purchase: true },
              ].map((item, i) => (
                <button key={i} onClick={() => item.wizard ? setWizardActive(true) : item.purchase ? setPurchaseWizardActive(true) : sendWithMessage(item.q)}
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
              // Add a confirmation message in chat
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
              { emoji: "🛒", text: "Registrera köp", purchase: true },
            ].map((item, i) => (
              <button key={i} onClick={() => item.wizard ? setWizardActive(true) : item.purchase ? setPurchaseWizardActive(true) : sendWithMessage(item.q)}
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
