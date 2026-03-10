import { useState, useEffect } from "react";
import { Chg } from "./shared.js";

const COMMODITY_GROUPS = [
  {
    label: "Precious Metals",
    items: [
      { symbol: "GC%3DF", display: "GC", name: "Guld", unit: "USD/oz" },
      { symbol: "SI%3DF", display: "SI", name: "Silver", unit: "USD/oz" },
      { symbol: "PL%3DF", display: "PL", name: "Platina", unit: "USD/oz" },
      { symbol: "PA%3DF", display: "PA", name: "Palladium", unit: "USD/oz" },
    ],
  },
  {
    label: "Energy",
    items: [
      { symbol: "BZ%3DF", display: "BRENT", name: "Olja Brent", unit: "USD/fat" },
      { symbol: "CL%3DF", display: "WTI", name: "Olja WTI", unit: "USD/fat" },
      { symbol: "NG%3DF", display: "NG", name: "Naturgas", unit: "USD/MMBtu" },
      { symbol: "TTF%3DF", display: "TTF", name: "Gas TTF (Europa)", unit: "EUR/MWh" },
    ],
  },
  {
    label: "Industrial Metals",
    items: [
      { symbol: "HG%3DF", display: "CU", name: "Koppar", unit: "USD/lb" },
      { symbol: "ALI%3DF", display: "AL", name: "Aluminium", unit: "USD/lb" },
      { symbol: "ZNC%3DF", display: "ZN", name: "Zink", unit: "USD/t" },
    ],
  },
  {
    label: "Agriculture",
    items: [
      { symbol: "ZW%3DF", display: "WHEAT", name: "Vete", unit: "USD/bushel" },
      { symbol: "ZC%3DF", display: "CORN", name: "Majs", unit: "USD/bushel" },
      { symbol: "ZS%3DF", display: "SOY", name: "Sojabönor", unit: "USD/bushel" },
    ],
  },
  {
    label: "FX vs SEK",
    items: [
      { symbol: "USDSEK%3DX", display: "USD/SEK", name: "Dollarn", unit: "SEK" },
      { symbol: "EURSEK%3DX", display: "EUR/SEK", name: "Euron", unit: "SEK" },
      { symbol: "GBPSEK%3DX", display: "GBP/SEK", name: "Pundet", unit: "SEK" },
    ],
  },
];

export default function Commodities() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
    const allItems = COMMODITY_GROUPS.flatMap(g => g.items);
    const results = await Promise.all(
      allItems.map(async ({ symbol, display }) => {
        try {
          const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          const d = await r.json();
          const meta = d?.chart?.result?.[0]?.meta;
          if (!meta) return { display, price: 0, change: 0, changeAbs: 0 };
          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.chartPreviousClose ?? price;
          const changeAbs = price - prev;
          const change = prev > 0 ? (changeAbs / prev) * 100 : 0;
          return { display, price, change, changeAbs, high: meta.regularMarketDayHigh ?? 0, low: meta.regularMarketDayLow ?? 0 };
        } catch {
          return { display, price: 0, change: 0, changeAbs: 0 };
        }
      })
    );
    const map = {};
    results.forEach(r => { map[r.display] = r; });
    setData(map);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 120000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Råvaror & Valutor</h1>
        <p style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>Realtidspriser · Yahoo Finance</p>
      </div>

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#787b86" }}>Hämtar råvarudata...</div>}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {COMMODITY_GROUPS.map(group => (
            <div key={group.label} style={{ border: "1px solid #e0e3eb", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: "#f8f9fd", borderBottom: "1px solid #e0e3eb", fontSize: 11, fontWeight: 500, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.label}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Symbol", "Råvara", "Pris", "Förändring", "Enhet"].map(h => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: ["Symbol","Råvara","Enhet"].includes(h) ? "left" : "right", fontSize: 11, fontWeight: 500, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => {
                    const d = data[item.display];
                    return (
                      <tr key={item.display}>
                        <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #f0f3fa", color: "#2962ff" }}>{item.display}</td>
                        <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f3fa" }}>{item.name}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, borderBottom: "1px solid #f0f3fa" }}>
                          {d?.price > 0 ? d.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", borderBottom: "1px solid #f0f3fa" }}>
                          {d?.price > 0 ? <Chg value={d.change} /> : "—"}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 11, color: "#787b86", borderBottom: "1px solid #f0f3fa" }}>{item.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
