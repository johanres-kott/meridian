import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function InsiderSection({ ticker }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
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
        {t("insiderSection.title")}
      </div>
      {transactions.slice(0, 10).map((tx, i) => {
        const isBuy = tx.type?.toLowerCase().includes("förv") || tx.type?.toLowerCase().includes("acq");
        const value = tx.value || (tx.volume && tx.price ? Math.round(tx.volume * tx.price) : null);
        return (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: i < Math.min(transactions.length, 10) - 1 ? "1px solid var(--border-light)" : "none",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ fontWeight: 500 }}>{tx.person}</span>
                {tx.position && <span style={{ color: "var(--text-secondary)", fontSize: 11 }}> · {tx.position}</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                <span style={{
                  color: isBuy ? "#089981" : "#f23645",
                  fontWeight: 500,
                }}>
                  {isBuy ? t("insiderSection.buy") : t("insiderSection.sell")}
                </span>
                {" · "}
                {tx.volume?.toLocaleString(numberLocale)} {t("insiderSection.shares")}
                {value ? ` · ${value.toLocaleString(numberLocale)} ${tx.currency || "SEK"}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", ...mono, whiteSpace: "nowrap" }}>
              {tx.date}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        {t("insiderSection.source")}
      </div>
    </div>
  );
}
