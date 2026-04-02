import { useState, useEffect } from "react";

export default function InsiderSection({ ticker }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker || !ticker.toUpperCase().endsWith(".ST")) {
      setLoading(false);
      return;
    }
    fetch(`/api/insider?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false); })
      .catch(err => { console.error(`InsiderSection: failed to fetch for ${ticker}:`, err); setLoading(false); });
  }, [ticker]);

  if (loading) return null;
  if (transactions.length === 0) return null;

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>
        Insiderhandel
      </div>
      {transactions.slice(0, 10).map((t, i) => {
        const isBuy = t.type?.toLowerCase().includes("förv") || t.type?.toLowerCase().includes("acq");
        const value = t.value || (t.volume && t.price ? Math.round(t.volume * t.price) : null);
        return (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: i < Math.min(transactions.length, 10) - 1 ? "1px solid var(--border-light)" : "none",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ fontWeight: 500 }}>{t.person}</span>
                {t.position && <span style={{ color: "var(--text-secondary)", fontSize: 11 }}> · {t.position}</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                <span style={{
                  color: isBuy ? "#089981" : "#f23645",
                  fontWeight: 500,
                }}>
                  {isBuy ? "Köp" : "Sälj"}
                </span>
                {" · "}
                {t.volume?.toLocaleString("sv-SE")} aktier
                {value ? ` · ${value.toLocaleString("sv-SE")} ${t.currency || "SEK"}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", ...mono, whiteSpace: "nowrap" }}>
              {t.date}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Källa: Finansinspektionens insynsregister
      </div>
    </div>
  );
}
