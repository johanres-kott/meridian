export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

  const symbols = [
    { symbol: "OANDA:SPX500_USD", display: "SPX500", name: "S&P 500", region: "Americas" },
    { symbol: "OANDA:NAS100_USD", display: "NAS100", name: "Nasdaq 100", region: "Americas" },
    { symbol: "OANDA:US30_USD", display: "US30", name: "Dow Jones", region: "Americas" },
    { symbol: "OANDA:DE30_EUR", display: "DE30", name: "DAX", region: "Europe" },
    { symbol: "OANDA:UK100_GBP", display: "UK100", name: "FTSE 100", region: "Europe" },
    { symbol: "OANDA:FR40_EUR", display: "FR40", name: "CAC 40", region: "Europe" },
    { symbol: "OANDA:EU50_EUR", display: "EU50", name: "Euro Stoxx 50", region: "Europe" },
    { symbol: "OANDA:JP225_USD", display: "JP225", name: "Nikkei 225", region: "Asia Pacific" },
    { symbol: "OANDA:HK33_HKD", display: "HK33", name: "Hang Seng", region: "Asia Pacific" },
    { symbol: "OANDA:CN50_USD", display: "CN50", name: "China A50", region: "Asia Pacific" },
    { symbol: "OANDA:SE30_SEK", display: "SE30", name: "OMX Stockholm 30", region: "Nordic" },
  ];

  try {
    const results = await Promise.all(
      symbols.map(async ({ symbol, display, name, region }) => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        return {
          symbol: display,
          name,
          region,
          price: data.c ?? 0,
          change: data.dp ?? 0,
          changeAbs: data.d ?? 0,
          high: data.h ?? 0,
          low: data.l ?? 0,
        };
      })
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}