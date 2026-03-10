export default async function handler(req, res) {
  const ticker = req.query.ticker ?? "ERIC-B.ST";
  const results = {};

  // Test crumb fetch
  try {
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    results.cookie_status = cookieRes.status;
    const cookies = cookieRes.headers.get("set-cookie") ?? "";
    results.has_cookies = cookies.length > 0;

    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": "Mozilla/5.0", "Cookie": cookies },
    });
    results.crumb_status = crumbRes.status;
    results.crumb = await crumbRes.text();
  } catch (e) {
    results.crumb_error = e.message;
  }

  // Test v7 price
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.yahoo.com" },
    });
    results.v7_status = r.status;
    const d = await r.json();
    results.v7_price = d?.quoteResponse?.result?.[0]?.regularMarketPrice ?? "null";
  } catch (e) {
    results.v7_error = e.message;
  }

  // Test v8 price
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.yahoo.com" },
    });
    results.v8_status = r.status;
    const d = await r.json();
    results.v8_price = d?.chart?.result?.[0]?.meta?.regularMarketPrice ?? "null";
  } catch (e) {
    results.v8_error = e.message;
  }

  res.status(200).json(results);
}
