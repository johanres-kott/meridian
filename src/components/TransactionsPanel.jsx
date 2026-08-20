import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import {
  computeHolding,
  holdingToWatchlistUpdates,
  isMissingTableError,
  listTransactions,
  addTransaction,
  deleteTransaction,
} from "../lib/transactions.js";

// Transaktionsvyn för en watchlist-rad: lista över köp/sälj, realiserat
// resultat och formulär för ny transaktion. Vid varje ändring räknas innehavet
// om med genomsnittsmetoden och synkas till watchlist-raden via `onSynced`
// (Portfolio.updateItem-mönstret) — resten av appen läser watchlist som idag.

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const num = (v) => parseFloat(String(v).replace(",", "."));

function fmtQty(n) {
  return Number(n).toLocaleString("sv-SE", { maximumFractionDigits: 4 });
}

function fmtPrice(n) {
  return Number(n).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TransactionsPanel({ item, currency = null, onSynced, onCountChange, isMobile = false }) {
  const [rows, setRows] = useState(null); // null = laddar
  const [missingTable, setMissingTable] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [side, setSide] = useState("buy");
  const [date, setDate] = useState(todayStr());
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");

  async function getUserId() {
    if (item.user_id) return item.user_id;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  async function load() {
    try {
      const userId = await getUserId();
      if (!userId) { setRows([]); return; }
      const txs = await listTransactions(userId, item.ticker);
      setRows(txs);
      onCountChange?.(txs.length);
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else { console.error(`TransactionsPanel: kunde inte ladda ${item.ticker}:`, err); setError("Kunde inte ladda transaktionerna."); }
      setRows([]);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- ladda om när tickern byts
  useEffect(() => { load(); }, [item.ticker]);

  // Räkna om innehavet och skriv tillbaka till watchlist-raden.
  async function refreshAfterChange() {
    const userId = await getUserId();
    const txs = await listTransactions(userId, item.ticker);
    setRows(txs);
    onCountChange?.(txs.length);
    await onSynced?.(holdingToWatchlistUpdates(computeHolding(txs)));
  }

  async function handleAdd(e) {
    e.preventDefault();
    const sharesNum = num(qty);
    const priceNum = num(price);
    const feeNum = fee === "" ? null : num(fee);
    if (!(sharesNum > 0) || !(priceNum >= 0) || !date) {
      setError("Fyll i datum, antal (> 0) och pris (>= 0).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const userId = await getUserId();
      await addTransaction({
        user_id: userId,
        ticker: item.ticker,
        side,
        shares: sharesNum,
        price: priceNum,
        fee: Number.isFinite(feeNum) ? feeNum : null,
        trade_date: date,
      });
      await refreshAfterChange();
      setQty(""); setPrice(""); setFee("");
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else { console.error("TransactionsPanel: kunde inte spara:", err); setError("Kunde inte spara transaktionen."); }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    setError(null);
    try {
      await deleteTransaction(id);
      await refreshAfterChange();
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else { console.error("TransactionsPanel: kunde inte radera:", err); setError("Kunde inte radera transaktionen."); }
    } finally {
      setSaving(false);
    }
  }

  const holding = rows ? computeHolding(rows) : null;
  const cur = currency || "";

  if (missingTable) {
    return (
      <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
        Transaktioner kräver att migrationen 2026-08-20_transactions.sql körs i Supabase.
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid var(--card-border)",
    borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-mono)",
  };
  const labelStyle = { fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 };
  const thStyle = { padding: "4px 8px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" };
  const tdStyle = { padding: "4px 8px", fontSize: 12, color: "var(--text)", borderBottom: "1px solid var(--border-light)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" };
  const uid = item.id;

  return (
    <div style={{ padding: isMobile ? "10px 12px" : "12px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 8 }}>
        Transaktioner
      </div>

      {rows === null ? (
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Laddar transaktioner...</div>
      ) : (
        <>
          {rows.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              Inga transaktioner ännu. Lägg till ett köp nedan så räknas antal och GAV fram automatiskt.
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: 10 }}>
              <table style={{ borderCollapse: "collapse", minWidth: 360 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Datum</th>
                    <th style={thStyle}>Typ</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Antal</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Pris</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Courtage</th>
                    <th style={thStyle} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(t => (
                    <tr key={t.id}>
                      <td style={tdStyle}>{t.trade_date}</td>
                      <td style={{ ...tdStyle, fontFamily: "inherit", color: t.side === "buy" ? "var(--pos)" : "var(--neg)", fontWeight: 500 }}>
                        {t.side === "buy" ? "Köp" : "Sälj"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtQty(t.shares)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtPrice(t.price)} {cur}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{t.fee ? fmtPrice(t.fee) : "—"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={saving}
                          title="Radera transaktion"
                          aria-label={`Radera transaktion ${t.trade_date}`}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, padding: "0 4px", lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {holding && rows.length > 0 && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "baseline", marginBottom: 10, fontSize: 12 }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Innehav: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmtQty(holding.shares)} st</span>
                {holding.gav != null && <> à GAV <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{fmtPrice(holding.gav)} {cur}</span></>}
              </span>
              {holding.realizedPL !== 0 && (
                <span style={{ color: holding.realizedPL >= 0 ? "var(--pos)" : "var(--neg)", fontWeight: 500 }}>
                  Realiserat resultat: {holding.realizedPL >= 0 ? "+" : ""}{fmtPrice(holding.realizedPL)} {cur}
                </span>
              )}
            </div>
          )}

          {holding?.warnings?.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: "var(--warn)", marginBottom: 6 }}>{w}</div>
          ))}

          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <span style={labelStyle} aria-hidden>Typ</span>
              <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                {[{ id: "buy", label: "Köp" }, { id: "sell", label: "Sälj" }].map(s => (
                  <button key={s.id} type="button" onClick={() => setSide(s.id)} aria-pressed={side === s.id}
                    style={{
                      fontSize: 11, padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: "inherit",
                      fontWeight: side === s.id ? 600 : 400,
                      background: side === s.id ? (s.id === "buy" ? "var(--pos)" : "var(--neg)") : "var(--bg-card)",
                      color: side === s.id ? "#fff" : "var(--text-secondary)",
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: 130 }}>
              <label style={labelStyle} htmlFor={`tx-date-${uid}`}>Datum</label>
              <input id={`tx-date-${uid}`} type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ width: 90 }}>
              <label style={labelStyle} htmlFor={`tx-qty-${uid}`}>Antal</label>
              <input id={`tx-qty-${uid}`} type="number" step="any" min="0" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div style={{ width: 100 }}>
              <label style={labelStyle} htmlFor={`tx-price-${uid}`}>Pris{cur ? ` (${cur})` : ""}</label>
              <input id={`tx-price-${uid}`} type="number" step="any" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div style={{ width: 90 }}>
              <label style={labelStyle} htmlFor={`tx-fee-${uid}`}>Courtage</label>
              <input id={`tx-fee-${uid}`} type="number" step="any" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <button type="submit" disabled={saving}
              style={{ fontSize: 11, padding: "7px 14px", border: "none", borderRadius: 4, background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              {saving ? "Sparar..." : "Lägg till"}
            </button>
            {holding?.shares > 0 && (
              <button type="button"
                onClick={() => { setSide("sell"); setQty(String(holding.shares)); }}
                title="Förifyll säljformuläret med hela innehavet"
                style={{ fontSize: 11, padding: "7px 12px", border: "1px solid var(--card-border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                Sälj allt
              </button>
            )}
          </form>

          {error && <div style={{ fontSize: 11, color: "var(--neg)", marginTop: 6 }}>{error}</div>}
        </>
      )}
    </div>
  );
}
