import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import PdfImportModal from "./PdfImportModal.jsx";
import CompanyView from "./CompanyView.jsx";

const STATUSES = ["Bevakar", "Analyserar", "Intressant", "Avstår"];

const STATUS_COLORS = {
  Bevakar: { bg: "#f0f3fa", color: "#787b86" },
  Analyserar: { bg: "#fff8e1", color: "#e65100" },
  Intressant: { bg: "#e8f5e9", color: "#1b5e20" },
  Avstår: { bg: "#fce4ec", color: "#880e4f" },
};

async function fetchPrice(ticker) {
  try {
    const res = await fetch(`/api/company?ticker=${encodeURIComponent(ticker)}`);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

function AddCompanyBar({ onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00`);
        const data = await res.json();
        const filtered = (data.result || []).filter(r => r.type === "Common Stock").slice(0, 6);
        setResults(filtered);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function select(r) {
    const ticker = r.symbol.replace(/ /g, "-");
    onAdd({ ticker, name: r.description });
    setQuery("");
    setResults([]);
  }

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Lägg till bolag — sök på namn eller ticker..."
        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e0e3eb", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#131722", background: "#fff" }}
      />
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, marginTop: 4 }}>
          {results.map(r => (
            <div key={r.symbol} onClick={() => select(r)}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f3fa" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f9fd"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <span style={{ fontWeight: 500, color: "#131722" }}>{r.description}</span>
              <span style={{ color: "#787b86", fontSize: 12, fontFamily: "monospace" }}>{r.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ item, onUpdate, onDelete, onSelect }) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    fetchPrice(item.ticker).then(d => { if (d && d.price) setPrice(d); });
  }, [item.ticker]);

  const chg = price?.changePercent;
  const chgColor = chg > 0 ? "#089981" : chg < 0 ? "#f23645" : "#787b86";
  const pl = (item.gav && item.shares && price?.price) ? ((price.price - item.gav) * item.shares) : null;
  const plPct = (item.gav && price?.price) ? ((price.price - item.gav) / item.gav * 100) : null;

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, marginBottom: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", cursor: "pointer", gap: 12 }} onClick={() => onSelect(item)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 13, color: "#131722" }}>{item.name || item.ticker}</div>
          <div style={{ fontSize: 11, color: "#787b86", fontFamily: "monospace" }}>{item.ticker}</div>
        </div>

        <div onClick={e => e.stopPropagation()}>
          <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value })}
            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, background: STATUS_COLORS[item.status]?.bg || "#f0f3fa", color: STATUS_COLORS[item.status]?.color || "#787b86" }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ textAlign: "right", minWidth: 90 }}>
          {price ? (
            <>
              <div style={{ fontWeight: 500, fontSize: 13, color: "#131722" }}>{price.price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: chgColor }}>{chg > 0 ? "+" : ""}{chg?.toFixed(2)}%</div>
            </>
          ) : <div style={{ fontSize: 11, color: "#c0c3cb" }}>Hamtar...</div>}
        </div>

        {pl !== null && (
          <div style={{ textAlign: "right", minWidth: 80 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: pl >= 0 ? "#089981" : "#f23645" }}>{pl >= 0 ? "+" : ""}{pl.toLocaleString("sv-SE", { maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: 11, color: pl >= 0 ? "#089981" : "#f23645" }}>{plPct >= 0 ? "+" : ""}{plPct?.toFixed(1)}%</div>
          </div>
        )}

        <div style={{ fontSize: 10, color: "#787b86" }}>&rsaquo;</div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("watchlist").select("*").order("created_at");
    setItems(data || []);
    setLoading(false);
  }

  async function addCompany({ ticker, name }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("watchlist").insert({ ticker, name, user_id: user.id, status: "Bevakar" }).select().single();
    if (!error) setItems(prev => [...prev, data]);
  }

  async function updateItem(id, updates) {
    await supabase.from("watchlist").update(updates).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (selected && selected.id === id) setSelected(prev => ({ ...prev, ...updates }));
  }

  async function deleteItem(id) {
    await supabase.from("watchlist").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  if (loading) return <div style={{ color: "#787b86", fontSize: 13 }}>Laddar...</div>;

  async function importHoldings(holdings) {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = holdings.map(h => ({
      ticker: h.ticker, name: h.name, user_id: user.id,
      status: "Bevakar", shares: h.shares, gav: h.gav,
    }));
    const { data, error } = await supabase.from("watchlist").insert(rows).select();
    if (!error && data) {
      setItems(prev => [...prev, ...data]);
    }
    return { data, error };
  }

  if (selected) {
    const freshItem = items.find(i => i.id === selected.id) || selected;
    return <CompanyView item={freshItem} onBack={() => setSelected(null)} onUpdate={updateItem} />;
  }

  return (
    <div>
      {showImport && (
        <PdfImportModal
          onClose={() => setShowImport(false)}
          existingTickers={items.map(i => i.ticker)}
          onImport={importHoldings}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18, color: "#131722", marginBottom: 4 }}>Bevakningslista</div>
          <div style={{ fontSize: 12, color: "#787b86" }}>{items.length} bolag</div>
        </div>
        <button onClick={() => setShowImport(true)}
          style={{ padding: "7px 16px", border: "1px solid #e0e3eb", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "#131722" }}>
          Importera PDF
        </button>
      </div>
      <AddCompanyBar onAdd={addCompany} />
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#787b86", fontSize: 13 }}>
          Inga bolag annu - sok efter ett bolag ovan for att lagga till
        </div>
      ) : (
        items.map(item => <CompanyCard key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} onSelect={setSelected} />)
      )}
    </div>
  );
}
