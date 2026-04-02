import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import { searchStocks } from "../../lib/apiClient.js";

export default function PurchaseWizard({ onComplete, onCancel, contextFn }) {
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [selected, setSelected] = useState(null);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctx = contextFn ? contextFn() : {};
    const owned = (ctx.portfolio || []).filter(c => c.shares > 0);
    setPortfolio(owned);
  }, []);

  async function searchStock(q) {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchStocks(q, 6);
    setSearchResults(results);
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

      const { data: existing } = await supabase.from("watchlist")
        .select("id, shares, gav")
        .eq("user_id", user.id)
        .eq("ticker", selected.ticker)
        .single();

      if (existing) {
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

      {step === 0 && (
        <div>
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
