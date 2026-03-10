const FMP_KEY = "DZJzkZrPZXSCrJPErOadzWJ8JzfbsYmq";
const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com",
};

// Fetch Yahoo crumb — required for v10 quoteSummary
async function getYahooCrumb() {
  try {
    // Step 1: get cookies
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: YAHOO_HEADERS,
      redirect: "follow",
    });
    const cookies = cookieRes.headers.get("set-cookie") ?? "";

    // Step 2: get crumb using those cookies
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        ...YAHOO_HEADERS,
        "Cookie": cookies,
      },
    });
    const crumb = await crumbRes.text();
    return { crumb, cookies };
  } catch {
    return null;
  }
}

// Price via v7
async function getYahooPrice(ticker) {
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,marketCap,currency,shortName,longName,fiftyTwoWeekHigh,fiftyTwoWeekLow`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await r.json();
    const q = data?.quoteResponse?.result?.[0];
    if (!q || !q.regularMarketPrice) return null;
    return {
      name: q.longName ?? q.shortName ?? ticker,
      price: q.regularMarketPrice ?? 0,
      currency: q.currency ?? "USD",
      marketCap: q.marketCap ? Math.round(q.marketCap / 1e9) : 0,
      week52High: q.fiftyTwoWeekHigh ?? 0,
      week52Low: q.fiftyTwoWeekLow ?? 0,
    };
  } catch {
    return null;
  }
}

// Price fallback via v8
async function getYahooPriceV8(ticker) {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    return {
      name: meta.longName ?? meta.shortName ?? ticker,
      price: meta.regularMarketPrice,
      currency: meta.currency ?? "USD",
      marketCap: 0,
      week52High: meta.fiftyTwoWeekHigh ?? 0,
      week52Low: meta.fiftyTwoWeekLow ?? 0,
    };
  } catch {
    return null;
  }
}

// Fundamentals via v10 with crumb
async function getYahooFundamentals(ticker, crumbData) {
  if (!crumbData) return null;
  try {
    const { crumb, cookies } = crumbData;
    const modules = "financialData,defaultKeyStatistics,summaryDetail,assetProfile";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const r = await fetch(url, {
      headers: { ...YAHOO_HEADERS, "Cookie": cookies },
    });
    const data = await r.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;
    const fd = result.financialData ?? {};
    const ks = result.defaultKeyStatistics ?? {};
    const sd = result.summaryDetail ?? {};
    const ap = result.assetProfile ?? {};
    return {
      sector: ap.sector ?? "—",
      industry: ap.industry ?? "—",
      ebitdaMargin: fd.ebitdaMargins?.raw ? parseFloat((fd.ebitdaMargins.raw * 100).toFixed(1)) : 0,
      operatingMargin: fd.operatingMargins?.raw ? parseFloat((fd.operatingMargins.raw * 100).toFixed(1)) : 0,
      grossMargin: fd.grossMargins?.raw ? parseFloat((fd.grossMargins.raw * 100).toFixed(1)) : 0,
      roic: fd.returnOnEquity?.raw ? parseFloat((fd.returnOnEquity.raw * 100).toFixed(1)) : 0,
      revenueGrowth: fd.revenueGrowth?.raw ? parseFloat((fd.revenueGrowth.raw * 100).toFixed(1)) : 0,
      debtEbitda: fd.debtToEquity?.raw ? parseFloat((fd.debtToEquity.raw / 100).toFixed(1)) : 0,
      peForward: sd.forwardPE?.raw ? parseFloat(sd.forwardPE.raw.toFixed(1)) : 0,
      peTrailing: ks.trailingPE?.raw ? parseFloat(ks.trailingPE.raw.toFixed(1)) : 0,
      targetPrice: fd.targetMeanPrice?.raw ?? 0,
      recommendation: fd.recommendationKey ?? "—",
    };
  } catch {
    return null;
  }
}

// FMP only for US tickers
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
    // Get crumb first, then fetch everything in parallel
    const crumbData = await getYahooCrumb();

    const [priceData, fundamentals, fmpData, news] = await Promise.all([
      getYahooPrice(ticker).then(d => d ?? getYahooPriceV8(ticker)),
      getYahooFundamentals(ticker, crumbData),
      getFMPData(ticker),
      getFinnhubNews(ticker),
    ]);

    if (!priceData && !fundamentals && !fmpData) {
      return res.status(404).json({ error: `Ingen data hittades för ${ticker}` });
    }

    const result = {
      ticker,
      name: fmpData?.name ?? priceData?.name ?? ticker,
      sector: fmpData?.sector ?? fundamentals?.sector ?? "—",
      industry: fundamentals?.industry ?? "—",
      price: priceData?.price ?? 0,
      currency: priceData?.currency ?? "USD",
      marketCap: fmpData?.marketCap ?? priceData?.marketCap ?? 0,
      peForward: fmpData?.peForward ?? fundamentals?.peForward ?? 0,
      peTrailing: fundamentals?.peTrailing ?? 0,
      ebitdaMargin: fundamentals?.ebitdaMargin ?? 0,
      operatingMargin: fundamentals?.operatingMargin ?? 0,
      grossMargin: fundamentals?.grossMargin ?? 0,
      roic: fmpData?.roic ?? fundamentals?.roic ?? 0,
      debtEbitda: fmpData?.debtEbitda ?? fundamentals?.debtEbitda ?? 0,
      revenueGrowth: fundamentals?.revenueGrowth ?? 0,
      targetPrice: fundamentals?.targetPrice ?? 0,
      recommendation: fundamentals?.recommendation ?? "—",
      week52High: priceData?.week52High ?? 0,
      week52Low: priceData?.week52Low ?? 0,
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