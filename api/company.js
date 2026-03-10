const FMP_KEY = "DZJzkZrPZXSCrJPErOadzWJ8JzfbsYmq";
const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com",
};

async function getYahooV7(ticker) {
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,marketCap,forwardPE,trailingPE,currency,shortName,longName,sector,industry,fiftyTwoWeekHigh,fiftyTwoWeekLow,ebitdaMargins,operatingMargins,grossMargins,returnOnEquity,debtToEquity,revenueGrowth,targetMeanPrice,recommendationKey`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await r.json();
    const q = data?.quoteResponse?.result?.[0];
    if (!q || !q.regularMarketPrice) return null;
    return parseYahooQuote(q, ticker);
  } catch {
    return null;
  }
}

async function getYahooV8(ticker) {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    return {
      name: meta.longName ?? meta.shortName ?? ticker,
      sector: "—",
      industry: "—",
      price: meta.regularMarketPrice,
      currency: meta.currency ?? "USD",
      marketCap: 0,
      peForward: 0,
      peTrailing: 0,
      ebitdaMargin: 0,
      operatingMargin: 0,
      grossMargin: 0,
      roic: 0,
      debtEbitda: 0,
      revenueGrowth: 0,
      targetPrice: 0,
      recommendation: "—",
      week52High: meta.fiftyTwoWeekHigh ?? 0,
      week52Low: meta.fiftyTwoWeekLow ?? 0,
    };
  } catch {
    return null;
  }
}

function parseYahooQuote(q, ticker) {
  return {
    name: q.longName ?? q.shortName ?? ticker,
    sector: q.sector ?? "—",
    industry: q.industry ?? "—",
    price: q.regularMarketPrice ?? 0,
    currency: q.currency ?? "USD",
    marketCap: q.marketCap ? Math.round(q.marketCap / 1e9) : 0,
    peForward: q.forwardPE ? parseFloat(q.forwardPE.toFixed(1)) : 0,
    peTrailing: q.trailingPE ? parseFloat(q.trailingPE.toFixed(1)) : 0,
    ebitdaMargin: q.ebitdaMargins ? parseFloat((q.ebitdaMargins * 100).toFixed(1)) : 0,
    operatingMargin: q.operatingMargins ? parseFloat((q.operatingMargins * 100).toFixed(1)) : 0,
    grossMargin: q.grossMargins ? parseFloat((q.grossMargins * 100).toFixed(1)) : 0,
    roic: q.returnOnEquity ? parseFloat((q.returnOnEquity * 100).toFixed(1)) : 0,
    debtEbitda: q.debtToEquity ? parseFloat((q.debtToEquity / 100).toFixed(1)) : 0,
    revenueGrowth: q.revenueGrowth ? parseFloat((q.revenueGrowth * 100).toFixed(1)) : 0,
    targetPrice: q.targetMeanPrice ?? 0,
    recommendation: q.recommendationKey ?? "—",
    week52High: q.fiftyTwoWeekHigh ?? 0,
    week52Low: q.fiftyTwoWeekLow ?? 0,
  };
}

// FMP only for US tickers (no exchange suffix like .ST, .L, .AS)
async function getFMPData(ticker) {
  if (ticker.includes(".")) return null;
  try {
    const [profileRes, ratioRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${FMP_KEY}`),
    ]);
    const [profile, ratios] = await Promise.all([profileRes.json(), ratioRes.json()]);
    const p = Array.isArray(profile) ? profile[0] : null;
    const r = Array.isArray(ratios) ? ratios[0] : null;
    if (!p) return null;
    return {
      name: p.companyName ?? null,
      sector: p.sector ?? null,
      marketCap: p.mktCap ? Math.round(p.mktCap / 1e9) : null,
      peForward: r?.peRatioTTM ? parseFloat(r.peRatioTTM.toFixed(1)) : null,
      roic: r?.returnOnCapitalEmployedTTM ? parseFloat((r.returnOnCapitalEmployedTTM * 100).toFixed(1)) : null,
      debtEbitda: r?.netDebtToEBITDATTM ? parseFloat(r.netDebtToEBITDATTM.toFixed(1)) : null,
    };
  } catch {
    return null;
  }
}

async function getFinnhubNews(ticker) {
  try {
    const baseTicker = ticker.includes(".") ? ticker.split(".")[0] : ticker;
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const url = `https://finnhub.io/api/v1/company-news?symbol=${baseTicker}&from=${weekAgo}&to=${today}&token=${FINNHUB_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 4).map(n => ({
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
  res.setHeader("Cache-Control", "s-maxage=300");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  try {
    const [yahooData, fmpData, news] = await Promise.all([
      getYahooV7(ticker).then(d => d ?? getYahooV8(ticker)),
      getFMPData(ticker),
      getFinnhubNews(ticker),
    ]);

    if (!yahooData && !fmpData) {
      return res.status(404).json({ error: `Ingen data hittades för ${ticker}` });
    }

    const result = {
      ticker,
      name: fmpData?.name ?? yahooData?.name ?? ticker,
      sector: fmpData?.sector ?? yahooData?.sector ?? "—",
      industry: yahooData?.industry ?? "—",
      price: yahooData?.price ?? 0,
      currency: yahooData?.currency ?? "USD",
      marketCap: fmpData?.marketCap ?? yahooData?.marketCap ?? 0,
      peForward: fmpData?.peForward ?? yahooData?.peForward ?? 0,
      peTrailing: yahooData?.peTrailing ?? 0,
      ebitdaMargin: yahooData?.ebitdaMargin ?? 0,
      operatingMargin: yahooData?.operatingMargin ?? 0,
      grossMargin: yahooData?.grossMargin ?? 0,
      roic: fmpData?.roic ?? yahooData?.roic ?? 0,
      debtEbitda: fmpData?.debtEbitda ?? yahooData?.debtEbitda ?? 0,
      revenueGrowth: yahooData?.revenueGrowth ?? 0,
      targetPrice: yahooData?.targetPrice ?? 0,
      recommendation: yahooData?.recommendation ?? "—",
      week52High: yahooData?.week52High ?? 0,
      week52Low: yahooData?.week52Low ?? 0,
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
