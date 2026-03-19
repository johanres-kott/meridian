import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;

  const symbols = [
    { symbol: "%5EGSPC", display: "SPX", name: "S&P 500", region: "Americas" },
    { symbol: "%5EIXIC", display: "IXIC", name: "Nasdaq Composite", region: "Americas" },
    { symbol: "%5EDJI", display: "DJI", name: "Dow Jones", region: "Americas" },
    { symbol: "%5ESTOXX50E", display: "SX5E", name: "Euro Stoxx 50", region: "Europe" },
    { symbol: "%5EGDAXI", display: "DAX", name: "DAX", region: "Europe" },
    { symbol: "%5EFTSE", display: "FTSE", name: "FTSE 100", region: "Europe" },
    { symbol: "%5EFCHI", display: "CAC", name: "CAC 40", region: "Europe" },
    { symbol: "%5EN225", display: "N225", name: "Nikkei 225", region: "Asia Pacific" },
    { symbol: "%5EHSI", display: "HSI", name: "Hang Seng", region: "Asia Pacific" },
    { symbol: "%5EBSESN", display: "SENSEX", name: "BSE Sensex", region: "Asia Pacific" },
    { symbol: "%5EKS11", display: "KOSPI", name: "KOSPI", region: "Asia Pacific" },
    { symbol: "%5EOMXS30", display: "OMXS30", name: "OMX Stockholm 30", region: "Nordic" },
    { symbol: "%5EOMXHPI", display: "OMXHPI", name: "OMX Helsinki", region: "Nordic" },
    { symbol: "%5EOMXC25", display: "OMXC25", name: "OMX Copenhagen 25", region: "Nordic" },
  ];

  try {
    const results = await Promise.all(
      symbols.map(async ({ symbol, display, name, region }) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        });
        const data = await r.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return { symbol: display, name, region, price: 0, change: 0, changeAbs: 0, high: 0, low: 0 };

        const price = meta.regularMarketPrice ?? 0;
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const changeAbs = price - prevClose;
        const change = prevClose > 0 ? (changeAbs / prevClose) * 100 : 0;

        return {
          symbol: display,
          yahooSymbol: decodeURIComponent(symbol),
          name,
          region,
          price,
          change,
          changeAbs,
          high: meta.regularMarketDayHigh ?? 0,
          low: meta.regularMarketDayLow ?? 0,
          currency: meta.currency ?? "USD",
        };
      })
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}