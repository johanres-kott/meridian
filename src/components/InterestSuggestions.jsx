import { useState, useEffect } from "react";
import { Chg } from "./SharedComponents.jsx";

// Curated stock suggestions per interest category
const SUGGESTIONS = {
  tech: [
    { ticker: "SINCH.ST", name: "Sinch" },
    { ticker: "HEX-B.ST", name: "Hexagon" },
    { ticker: "AAPL", name: "Apple" },
    { ticker: "MSFT", name: "Microsoft" },
    { ticker: "NVDA", name: "Nvidia" },
  ],
  finance: [
    { ticker: "SEB-A.ST", name: "SEB" },
    { ticker: "SHB-A.ST", name: "Handelsbanken" },
    { ticker: "SWED-A.ST", name: "Swedbank" },
    { ticker: "AZA.ST", name: "Avanza" },
    { ticker: "NIBE-B.ST", name: "NIBE" },
  ],
  industry: [
    { ticker: "ATCO-A.ST", name: "Atlas Copco" },
    { ticker: "SAND.ST", name: "Sandvik" },
    { ticker: "VOLV-B.ST", name: "Volvo" },
    { ticker: "SKF-B.ST", name: "SKF" },
    { ticker: "ALFA.ST", name: "Alfa Laval" },
  ],
  healthcare: [
    { ticker: "AZN.ST", name: "AstraZeneca" },
    { ticker: "SOBI.ST", name: "Sobi" },
    { ticker: "GETI-B.ST", name: "Getinge" },
    { ticker: "LIFCO-B.ST", name: "Lifco" },
  ],
  realestate: [
    { ticker: "WALL-B.ST", name: "Wallenstam" },
    { ticker: "SAGA-B.ST", name: "Sagax" },
    { ticker: "FABG.ST", name: "Fabege" },
    { ticker: "CAST.ST", name: "Castellum" },
  ],
  food: [
    { ticker: "SCST.ST", name: "Scandi Standard" },
    { ticker: "AAK.ST", name: "AAK" },
    { ticker: "AXFO.ST", name: "Axfood" },
    { ticker: "CLAS-B.ST", name: "Clas Ohlson" },
  ],
  energy: [
    { ticker: "LUNE.ST", name: "Lundin Energy" },
    { ticker: "EQNR", name: "Equinor" },
  ],
  gold: [
    { ticker: "BOLI.ST", name: "Boliden" },
    { ticker: "LUMI.ST", name: "Lundin Mining" },
  ],
  sustainability: [
    { ticker: "NIBE-B.ST", name: "NIBE" },
    { ticker: "Vwsb.ST", name: "Vestas" },
    { ticker: "EOLU-B.ST", name: "Eolus Vind" },
  ],
  gaming: [
    { ticker: "EMBRAC-B.ST", name: "Embracer" },
    { ticker: "STAR-B.ST", name: "Starbreeze" },
    { ticker: "PNDX-B.ST", name: "Paradox" },
  ],
  fashion: [
    { ticker: "HM-B.ST", name: "H&M" },
    { ticker: "NWG.ST", name: "New Wave" },
    { ticker: "FENIX.ST", name: "Fenix Outdoor" },
  ],
  defense: [
    { ticker: "SAAB-B.ST", name: "Saab" },
    { ticker: "SECU-B.ST", name: "Securitas" },
  ],
  ev: [
    { ticker: "VOLV-B.ST", name: "Volvo" },
    { ticker: "TSLA", name: "Tesla" },
  ],
  crypto: [
    { ticker: "COIN", name: "Coinbase" },
  ],
};

const INTEREST_LABELS = {
  tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård",
  realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld",
  sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar",
  ev: "Elbilar", crypto: "Krypto",
};

export default function InterestSuggestions({ interests, existingTickers, isMobile, onNavigate }) {
  const [enriched, setEnriched] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interests || interests.length === 0) return;

    const existingSet = new Set((existingTickers || []).map(t => t.toUpperCase()));

    // Pick 2 suggestions per interest, excluding already owned
    const picks = [];
    for (const interest of interests) {
      const candidates = (SUGGESTIONS[interest] || []).filter(s => !existingSet.has(s.ticker.toUpperCase()));
      picks.push(...candidates.slice(0, 2));
    }

    // Deduplicate
    const seen = new Set();
    const unique = picks.filter(p => { if (seen.has(p.ticker)) return false; seen.add(p.ticker); return true; }).slice(0, 8);

    if (unique.length === 0) { setLoading(false); return; }

    // Fetch prices for suggestions
    Promise.all(unique.map(async (s) => {
      try {
        const res = await fetch(`/api/company?ticker=${encodeURIComponent(s.ticker)}`);
        const d = await res.json();
        return { ...s, price: d.price, changePercent: d.changePercent, currency: d.currency, sector: d.sector };
      } catch {
        return s;
      }
    })).then(results => {
      const map = {};
      results.forEach(r => { map[r.ticker] = r; });
      setEnriched(map);
      setLoading(false);
    });
  }, [interests, existingTickers]);

  if (!interests || interests.length === 0) return null;

  const items = Object.values(enriched);
  if (!loading && items.length === 0) return null;

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid #f0f3fa", background: "#f8f9fd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#131722" }}>Baserat på dina intressen</span>
        <div style={{ display: "flex", gap: 4 }}>
          {interests.slice(0, 4).map(i => (
            <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "#e8f5e9", color: "#1b5e20", fontWeight: 500 }}>
              {INTEREST_LABELS[i] || i}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "#787b86" }}>Hämtar förslag...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            {items.map(item => (
              <div
                key={item.ticker}
                onClick={() => onNavigate?.("search")}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 6, border: "1px solid #f0f3fa",
                  cursor: "pointer", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#2962ff"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f3fa"}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#131722" }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: "#787b86", ...mono }}>{item.ticker}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {item.price != null && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#131722", ...mono }}>
                        {item.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 10, ...mono }}>
                        <Chg value={parseFloat((item.changePercent || 0).toFixed(2))} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
