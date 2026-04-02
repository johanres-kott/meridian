import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 30)) return;

  const supabase = getSupabase();

  const profile = req.query.profile || "mixed";
  const risk = req.query.risk;
  const sector = req.query.sector;
  const market = req.query.market;
  const limit = Math.min(parseInt(req.query.limit) || 10, 300);
  const exclude = (req.query.exclude || "").split(",").filter(Boolean).map(t => t.toUpperCase());

  const scoreCol = `score_${profile}`;
  const validCols = ["score_value", "score_growth", "score_dividend", "score_mixed"];
  const orderBy = validCols.includes(scoreCol) ? scoreCol : "score_mixed";

  let query = supabase
    .from("stock_scores")
    .select("*")
    .order(orderBy, { ascending: false })
    .limit(limit + exclude.length); // fetch extra to filter excludes

  if (risk) query = query.eq("risk", risk);
  if (sector) query = query.eq("sector", sector);
  if (market) query = query.eq("market", market);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Filter excluded tickers and limit
  const filtered = (data || [])
    .filter(d => !exclude.includes(d.ticker.toUpperCase()))
    .slice(0, limit)
    .map(d => ({
      ticker: d.ticker,
      name: d.name,
      sector: d.sector,
      price: d.price,
      currency: d.currency,
      risk: d.risk,
      beta: d.beta,
      marketCap: d.market_cap,
      compositeScore: d[orderBy],
      subScores: {
        piotroski: d.piotroski_raw,
        piotroskiNorm: d.piotroski_score,
        magicFormula: d.magic_formula,
        growthScore: d.growth_score,
        dividendScore: d.dividend_score,
        qualityScore: d.quality_score,
      },
      dividendYield: d.dividend_yield,
      revenueGrowth: d.revenue_growth,
      highlights: generateHighlights(d),
    }));

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.json({
    suggestions: filtered,
    scoredAt: data?.[0]?.scored_at || null,
    profile,
    count: filtered.length,
  });
}

function generateHighlights(d) {
  const tags = [];
  if (d.piotroski_raw >= 7) tags.push(`F-Score ${d.piotroski_raw}/9`);
  if (d.quality_score >= 70) tags.push("Hög kvalitet");
  if ((d.dividend_yield || 0) >= 3) tags.push(`Utdelning ${d.dividend_yield.toFixed(1)}%`);
  if ((d.revenue_growth || 0) >= 15) tags.push("Stark tillväxt");
  if (d.magic_formula >= 60) tags.push("Magic Formula");
  if (d.risk === "low") tags.push("Låg risk");
  return tags.slice(0, 3);
}
