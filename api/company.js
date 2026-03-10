export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const FMP_KEY = "DZJzkZrPZXSCrJPErOadzWJ8JzfbsYmq";
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: "ticker query param required" });
  }

  try {
    const [profileRes, ratioRes, incomeRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=1&apikey=${FMP_KEY}`),
    ]);

    const [profile, ratios, income] = await Promise.all([
      profileRes.json(),
      ratioRes.json(),
      incomeRes.json(),
    ]);

    const p = profile[0] ?? {};
    const r = ratios[0] ?? {};
    const i = income[0] ?? {};

    const ebitda = i.ebitda ?? 0;
    const revenue = i.revenue ?? 1;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    res.status(200).json({
      ticker,
      name: p.companyName ?? ticker,
      sector: p.sector ?? "—",
      marketCap: p.mktCap ? Math.round(p.mktCap / 1e9) : 0,
      price: p.price ?? 0,
      peForward: r.peRatioTTM ? parseFloat(r.peRatioTTM.toFixed(1)) : 0,
      roic: r.returnOnCapitalEmployedTTM ? parseFloat((r.returnOnCapitalEmployedTTM * 100).toFixed(1)) : 0,
      debtEbitda: r.netDebtToEBITDATTM ? parseFloat(r.netDebtToEBITDATTM.toFixed(1)) : 0,
      ebitdaMargin: parseFloat(ebitdaMargin.toFixed(1)),
      currency: p.currency ?? "USD",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
