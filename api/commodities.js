export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const SYMBOLS = [
    // Precious metals
    { symbol: "GC=F",    display: "GC",      group: "Precious Metals", name: "Guld",            unit: "USD/oz" },
    { symbol: "SI=F",    display: "SI",      group: "Precious Metals", name: "Silver",          unit: "USD/oz" },
    { symbol: "PL=F",    display: "PL",      group: "Precious Metals", name: "Platina",         unit: "USD/oz" },
    { symbol: "PA=F",    display: "PA",      group: "Precious Metals", name: "Palladium",       unit: "USD/oz" },
    // Energy
    { symbol: "BZ=F",    display: "BRENT",   group: "Energy",          name: "Olja Brent",      unit: "USD/fat" },
    { symbol: "CL=F",    display: "WTI",     group: "Energy",          name: "Olja WTI",        unit: "USD/fat" },
    { symbol: "NG=F",    display: "NG",      group: "Energy",          name: "Naturgas",        unit: "USD/MMBtu" },
    // Industrial metals
    { symbol: "HG=F",    display: "CU",      group: "Industrial Metals", name: "Koppar",        unit: "USD/lb" },
    { symbol: "ALI=F",   display: "AL",      group: "Industrial Metals", name: "Aluminium",     unit: "USD/lb" },
    // Agriculture
    { symbol: "ZW=F",    display: "WHEAT",   group: "Agriculture",     name: "Vete",            unit: "USD/bushel" },
    { symbol: "ZC=F",    display: "CORN",    group: "Agriculture",     name: "Majs",            unit: "USD/bushel" },
    { symbol: "ZS=F",    display: "SOY",     group: "Agriculture",     name: "Sojabönor",       unit: "USD/bushel" },
    // FX
    { symbol: "USDSEK=X", display: "USD/SEK", group: "FX vs SEK",     name: "Dollarn",         unit: "SEK" },
    { symbol: "EURSEK=X", display: "EUR/SEK", group: "FX vs SEK",     name: "Euron",           unit: "SEK" },
    { symbol: "GBPSEK=X", display: "GBP/SEK", group: "FX vs SEK",     name: "Pundet",          unit: "SEK" },
  ];

  const results = await Promise.all(
    SYMBOLS.map(async (item) => {
      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=1d`;
        const r = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        });
        const d = await r.json();
        const meta = d?.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) {
          return { ...item, price: 0, change: 0, changeAbs: 0, high: 0, low: 0 };
        }
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const changeAbs = price - prev;
        const change = prev > 0 ? (changeAbs / prev) * 100 : 0;
        return {
          ...item,
          price,
          change: parseFloat(change.toFixed(2)),
          changeAbs: parseFloat(changeAbs.toFixed(4)),
          high: meta.regularMarketDayHigh ?? 0,
          low: meta.regularMarketDayLow ?? 0,
        };
      } catch (e) {
        return { ...item, price: 0, change: 0, changeAbs: 0, high: 0, low: 0 };
      }
    })
  );

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  res.status(200).json(results);
}