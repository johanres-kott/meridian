const FMP_KEY = "DZJzkZrPZXSCrJPErOadzWJ8JzfbsYmq";
const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

async function getYahooData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price: meta.regularMarketPrice ?? 0,
    currency: meta.currency ?? "USD",
    exchange: meta.exchangeName ?? "",
  };
}

async function getYahooFundamentals(ticker) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,defaultKeyStatistics,financialData,assetProfile`;
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  const data = await r.json();
  const result = data?.quoteSummary?.result?.[0];
  if (!result) return null;

  const fd = result.financialData ?? {};
  const sd = result.summaryDetail ?? {};
  const ks = result.defaultKeyStatistics ?? {};
  const ap = result.assetProfile ?? {};

  return {
    name: ap.longBusinessSummary ? ticker : ticker,
    sector: ap.sector ?? "—",
    industry: ap.industry ?? "—",
    marketCap: ks.marketCap?.raw ? Math.round(ks.marketCap.raw / 1e9) : 0,
    peForward: ks.forwardPE?.raw ?? sd.forwardPE?.raw ?? 0,
    peTrailing: sd.trailingPE?.raw ?? 0,
    ebitdaMargin: fd.ebitdaMargins?.raw ? parseFloat((fd.ebitdaMargins.raw * 100).toFixed(1)) : 0,
    roic: fd.returnOnEquity?.raw ? parseFloat((fd.returnOnEquity.raw * 100).toFixed(1)) : 0,
    debtEbitda: fd.debtToEquity?.raw ? parseFloat((fd.debtToEquity.raw / 100).toFixed(1)) : 0,
    revenueGrowth: fd.revenueGrowth?.raw ? parseFloat((fd.revenueGrowth.raw * 100).toFixed(1)) : 0,
    grossMargin: fd.grossMargins?.raw ? parseFloat((fd.grossMargins.raw * 100).toFixed(1)) : 0,
    operatingMargin: fd.operatingMargins?.raw ? parseFloat((fd.operatingMargins.raw * 100).toFixed(1)) : 0,
    targetPrice: fd.targetMeanPrice?.raw ?? 0,
    recommendation: fd.recommendationKey ?? "—",
  };
}

async function getFMPData(ticker) {
  try {
    const [profileRes, ratioRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${FMP_KEY}`),
    ]);
    const [profile, ratios] = await Promise.all([profileRes.json(), ratioRes.json()]);
    const p = profile[0] ?? {};
    const r = ratios[0] ?? {};
    return {
      name: p.companyName ?? null,
      sector: p.sector ?? null,
      marketCap: p.mktCap ? Math.round(p.mktCap / 1e9) : null,
      peForward: r.peRatioTTM ? parseFloat(r.peRatioTTM.toFixed(1)) : null,
      roic: r.returnOnCapitalEmployedTTM ? parseFloat((r.returnOnCapitalEmployedTTM * 100).toFixed(1)) : null,
      debtEbitda: r.netDebtToEBITDATTM ? parseFloat(r.netDebtToEBITDATTM.toFixed(1)) : null,
    };
  } catch {
    return {};
  }
}

async function getFinnhubNews(ticker) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${weekAgo}&to=${today}&token=${FINNHUB_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 3).map(n => ({
      headline: n.headline,
      url: n.url,
      source: n.source,
      datetime: n.datetime,
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  try {
    const [yahooQuote, yahooFundamentals, fmpData, news] = await Promise.all([
      getYahooData(ticker),
      getYahooFundamentals(ticker),
      getFMPData(ticker),
      getFinnhubNews(ticker.split(".")[0]), // strip exchange suffix for Finnhub
    ]);

    // Merge — FMP takes priority for US stocks, Yahoo for others
    const result = {
      ticker,
      name: fmpData?.name ?? yahooFundamentals?.name ?? ticker,
      sector: fmpData?.sector ?? yahooFundamentals?.sector ?? "—",
      industry: yahooFundamentals?.industry ?? "—",
      price: yahooQuote?.price ?? 0,
      currency: yahooQuote?.currency ?? "USD",
      marketCap: fmpData?.marketCap ?? yahooFundamentals?.marketCap ?? 0,
      peForward: fmpData?.peForward ?? yahooFundamentals?.peForward ?? 0,
      peTrailing: yahooFundamentals?.peTrailing ?? 0,
      ebitdaMargin: yahooFundamentals?.ebitdaMargin ?? 0,
      operatingMargin: yahooFundamentals?.operatingMargin ?? 0,
      grossMargin: yahooFundamentals?.grossMargin ?? 0,
      roic: fmpData?.roic ?? yahooFundamentals?.roic ?? 0,
      debtEbitda: fmpData?.debtEbitda ?? yahooFundamentals?.debtEbitda ?? 0,
      revenueGrowth: yahooFundamentals?.revenueGrowth ?? 0,
      targetPrice: yahooFundamentals?.targetPrice ?? 0,
      recommendation: yahooFundamentals?.recommendation ?? "—",
      news,
      sources: {
        quote: "Yahoo Finance",
        fundamentals: fmpData?.name ? "FMP + Yahoo Finance" : "Yahoo Finance",
        news: "Finnhub",
      },
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}