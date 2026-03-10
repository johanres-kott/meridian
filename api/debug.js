export default async function handler(req, res) {
  const ticker = req.query.ticker ?? "ERIC-B.ST";
  const results = {};

  try {
    // Get crumb
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    const cookies = cookieRes.headers.get("set-cookie") ?? "";
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": "Mozilla/5.0", "Cookie": cookies },
    });
    const crumb = await crumbRes.text();
    results.crumb = crumb;

    // Test v10 with crumb
    const modules = "financialData,defaultKeyStatistics,summaryDetail,assetProfile";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.yahoo.com", "Cookie": cookies },
    });
    results.v10_status = r.status;
    const data = await r.json();
    results.v10_result = data?.quoteSummary?.result?.[0] ? "HAS_DATA" : "NULL";
    results.v10_error = data?.quoteSummary?.error ?? null;
    if (data?.quoteSummary?.result?.[0]) {
      const fd = data.quoteSummary.result[0].financialData ?? {};
      results.ebitdaMargin = fd.ebitdaMargins?.raw ?? "missing";
      results.operatingMargin = fd.operatingMargins?.raw ?? "missing";
    }
  } catch (e) {
    results.error = e.message;
  }

  res.status(200).json(results);
}