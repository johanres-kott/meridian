export default async function handler(req, res) {
  const ticker = req.query.ticker ?? "ERIC-B.ST";
  
  const results = {};
  
  // Test v10
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=financialData,defaultKeyStatistics,summaryDetail,assetProfile`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
    });
    results.v10_status = r.status;
    results.v10_data = await r.json();
  } catch (e) {
    results.v10_error = e.message;
  }

  // Test v11
  try {
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=financialData,defaultKeyStatistics,summaryDetail,assetProfile`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
    });
    results.v11_status = r.status;
    results.v11_data = await r.json();
  } catch (e) {
    results.v11_error = e.message;
  }

  res.status(200).json(results);
}