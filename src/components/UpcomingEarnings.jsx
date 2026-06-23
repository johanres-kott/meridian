import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";

export default function UpcomingEarnings({ isMobile }) {
  const { t, i18n } = useTranslation();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data: watchlist } = await supabase
          .from("watchlist")
          .select("ticker, name")
          .eq("user_id", userId)
          .order("created_at");

        if (!watchlist || watchlist.length === 0) {
          setLoading(false);
          return;
        }

        const tickers = watchlist.map(w => w.ticker).join(",");
        const res = await fetch(`/api/earnings-calendar?tickers=${encodeURIComponent(tickers)}`);
        const data = await res.json();

        // Build a name lookup from watchlist
        const nameMap = {};
        for (const w of watchlist) {
          nameMap[w.ticker] = w.name || w.ticker;
        }

        // Attach names and sort by date, limit to 10
        const entries = (Array.isArray(data) ? data : [])
          .map(e => ({
            ...e,
            companyName: e.name || nameMap[e.ticker] || e.ticker,
          }))
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
          .slice(0, 10);

        setEarnings(entries);
      } catch (err) {
        console.error("UpcomingEarnings load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: "20px 24px", marginBottom: 24, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 12 }}>
        {t("upcomingEarnings.loading")}
      </div>
    );
  }

  if (!userId) return null;

  const sectionHeader = {
    fontSize: isMobile ? 10 : 11,
    fontWeight: 500,
    color: "var(--text-secondary)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: isMobile ? 6 : 10,
  };
  const listItem = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMobile ? "4px 0" : "5px 0",
    borderBottom: "1px solid var(--border-light)",
  };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  // Group earnings by date
  const grouped = {};
  for (const e of earnings) {
    const key = e.date || t("upcomingEarnings.unknownDate");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const locale = i18n.language === "en" ? "en-GB" : "sv-SE";
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  }

  return (
    <div style={{ marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{t("upcomingEarnings.title")}</span>
      </div>

      <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
        <div style={sectionHeader}>{t("upcomingEarnings.sectionHeader")}</div>

        {earnings.length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{t("upcomingEarnings.noEarnings")}</div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {items.map(item => (
                <div key={item.ticker} style={listItem}>
                  <div style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 500,
                    color: "var(--bg-card)",
                    background: "var(--text)",
                    borderRadius: 4,
                    padding: isMobile ? "2px 6px" : "2px 8px",
                    marginRight: isMobile ? 8 : 12,
                    whiteSpace: "nowrap",
                    ...mono,
                  }}>
                    {formatDate(date)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.companyName}
                    </div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)", ...mono }}>
                      {item.ticker}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
