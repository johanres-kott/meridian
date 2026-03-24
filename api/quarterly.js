import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const UA = "Mozilla/5.0";

async function getYahooCrumb() {
  try {
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    const cookies = cookieRes.headers.get("set-cookie") ?? "";
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, "Cookie": cookies },
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.length < 3) return null;
    return { crumb, cookies };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker parameter required" });

  try {
    const crumbData = await getYahooCrumb();
    if (!crumbData) return res.status(502).json({ error: "Could not get Yahoo auth" });

    const { crumb, cookies } = crumbData;
    const modules = "incomeStatementHistoryQuarterly,earningsHistory";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

    const response = await fetch(url, {
      headers: { "User-Agent": UA, "Referer": "https://finance.yahoo.com", "Cookie": cookies },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(502).json({ error: "Yahoo API error" });

    const data = await response.json();
    const result = data?.quoteSummary?.result?.[0];
    const statements = result?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];

    const quarters = statements.map(q => {
      const revenue = q.totalRevenue?.raw || 0;
      const grossProfit = q.grossProfit?.raw || 0;
      const operatingIncome = q.operatingIncome?.raw || 0;
      const netIncome = q.netIncome?.raw || 0;
      const eps = q.dilutedEPS?.raw ?? q.basicEPS?.raw ?? null;
      return {
        date: q.endDate?.fmt || "",
        revenue,
        grossProfit,
        operatingIncome,
        netIncome,
        eps,
        grossMargin: revenue > 0 ? parseFloat((grossProfit / revenue * 100).toFixed(1)) : null,
        operatingMargin: revenue > 0 ? parseFloat((operatingIncome / revenue * 100).toFixed(1)) : null,
        netMargin: revenue > 0 ? parseFloat((netIncome / revenue * 100).toFixed(1)) : null,
      };
    }).reverse(); // oldest first for charts

    res.status(200).json({ ticker, quarters });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch quarterly data" });
  }
}
