const FINNHUB_KEY = process.env.FINNHUB_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const q = req.query.q;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: "Query parameter 'q' required (min 2 chars)" });
  }

  if (!FINNHUB_KEY) {
    return res.status(500).json({ error: "FINNHUB_KEY not configured" });
  }

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${FINNHUB_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Search failed" });
  }
}
