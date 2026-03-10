export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

  const symbols = [
    { symbol: "^GSPC", name: "S&P 500", region: "Americas" },
    { symbol: "^IXIC", name: "Nasdaq 100", region: "Americas" },
    { symbol: "^DJI", name: "Dow Jones", region: "Americas" },
    { symbol: "^STOXX50E", name: "Euro Stoxx 50", region: "Europe" },
    { symbol: "^GDAXI", name: "DAX", region: "Europe" },
    { symbol: "^FTSE", name: "FTSE 100", region: "Europe" },
    { symbol: "^FCHI", name: "CAC 40", region: "Europe" },
    { symbol: "^N225", name: "Nikkei 225", region: "Asia Pacific" },
    { symbol: "^HSI", name: "Hang Seng", region: "Asia Pacific" },
    { symbol: "^BSESN", name: "BSE Sensex", region: "Asia Pacific" },
    { symbol: "^KS11", name: "KOSPI", region: "Asia Pacific" },
    { symbol: "^OMXS30", name: "OMX Stockholm 30", region: "Nordic" },
  ];

  try {
    const results = await Promise.all(
      symbols.map(async ({ symbol, name, region }) => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        return {
          symbol: symbol.replace("^", ""),
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
