export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Unit conversions: Yahoo returns prices in imperial units, we convert to SI/metric.
  // Factor converts FROM Yahoo unit TO display unit (multiply price by factor).
  const OZ_TO_G = 1 / 31.1035;       // troy oz → gram
  const LB_TO_KG = 1 / 0.453592;     // lb → kg
  const MMBTU_TO_MWH = 1 / 0.293071; // MMBtu → MWh
  // Bushel weight varies by commodity
  const BUSHEL_WHEAT_KG = 27.216;     // 1 bushel wheat ≈ 27.216 kg
  const BUSHEL_CORN_KG = 25.401;      // 1 bushel corn ≈ 25.401 kg
  const BUSHEL_SOY_KG = 27.216;       // 1 bushel soybeans ≈ 27.216 kg

  const SYMBOLS = [
    // Precious metals
    { symbol: "GC=F",    display: "GC",      group: "Precious Metals", name: "Guld",            unit: "USD/g",   conv: OZ_TO_G },
    { symbol: "SI=F",    display: "SI",      group: "Precious Metals", name: "Silver",          unit: "USD/g",   conv: OZ_TO_G },
    { symbol: "PL=F",    display: "PL",      group: "Precious Metals", name: "Platina",         unit: "USD/g",   conv: OZ_TO_G },
    { symbol: "PA=F",    display: "PA",      group: "Precious Metals", name: "Palladium",       unit: "USD/g",   conv: OZ_TO_G },
    // Energy
    { symbol: "BZ=F",    display: "BRENT",   group: "Energy",          name: "Olja Brent",      unit: "USD/fat" },
    { symbol: "CL=F",    display: "WTI",     group: "Energy",          name: "Olja WTI",        unit: "USD/fat" },
    { symbol: "NG=F",    display: "NG",      group: "Energy",          name: "Naturgas",        unit: "USD/MWh", conv: MMBTU_TO_MWH },
    // Industrial metals
    { symbol: "HG=F",    display: "CU",      group: "Industrial Metals", name: "Koppar",        unit: "USD/kg",  conv: LB_TO_KG },
    { symbol: "ALI=F",   display: "AL",      group: "Industrial Metals", name: "Aluminium",     unit: "USD/kg",  conv: LB_TO_KG },
    // Agriculture (Yahoo quotes in cents/bushel for grains)
    { symbol: "ZW=F",    display: "WHEAT",   group: "Agriculture",     name: "Vete",            unit: "USD/kg",  conv: 1 / BUSHEL_WHEAT_KG },
    { symbol: "ZC=F",    display: "CORN",    group: "Agriculture",     name: "Majs",            unit: "USD/kg",  conv: 1 / BUSHEL_CORN_KG },
    { symbol: "ZS=F",    display: "SOY",     group: "Agriculture",     name: "Sojabönor",       unit: "USD/kg",  conv: 1 / BUSHEL_SOY_KG },
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
        const rawPrice = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? rawPrice;
        const change = prev > 0 ? ((rawPrice - prev) / prev) * 100 : 0;
        const f = item.conv || 1;
        const price = rawPrice * f;
        const changeAbs = (rawPrice - prev) * f;
        return {
          ...item,
          yahooSymbol: item.symbol,
          conv: item.conv || 1,
          price: parseFloat(price.toPrecision(6)),
          change: parseFloat(change.toFixed(2)),
          changeAbs: parseFloat(changeAbs.toPrecision(4)),
          high: parseFloat(((meta.regularMarketDayHigh ?? 0) * f).toPrecision(6)),
          low: parseFloat(((meta.regularMarketDayLow ?? 0) * f).toPrecision(6)),
        };
      } catch (e) {
        return { ...item, price: 0, change: 0, changeAbs: 0, high: 0, low: 0 };
      }
    })
  );

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  res.status(200).json(results);
}