import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://acostgikldxkdmcoavkf.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb3N0Z2lrbGR4a2RtY29hdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDUzMTgsImV4cCI6MjA4ODcyMTMxOH0.WD-y6dRTaIDfJMxxCKO3cw3T-Bz5SSTj1lPHGIy8d4I";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 30)) return;

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  // Single ticker lookup: /api/suggestions?ticker=ATCO-A.ST
  const singleTicker = req.query.ticker;
  if (singleTicker) {
    const { data, error } = await supabase.from("stock_scores").select("*").eq("ticker", singleTicker).single();
    if (error || !data) return res.json(null);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.json({
      ticker: data.ticker, name: data.name, sector: data.sector, risk: data.risk, beta: data.beta,
      scores: {
        piotroski: { raw: data.piotroski_raw, normalized: data.piotroski_score },
        magicFormula: data.magic_formula, growth: data.growth_score,
        dividend: data.dividend_score, quality: data.quality_score,
      },
      composite: { value: data.score_value, growth: data.score_growth, dividend: data.score_dividend, mixed: data.score_mixed },
      data: {
        peForward: data.pe_forward, peTrailing: data.pe_trailing, dividendYield: data.dividend_yield,
        revenueGrowth: data.revenue_growth, operatingMargin: data.operating_margin,
        grossMargin: data.gross_margin, roic: data.roic, debtEbitda: data.debt_ebitda,
      },
      scoredAt: data.scored_at,
    });
  }

  // List suggestions: /api/suggestions?profile=value&risk=low
  const profile = req.query.profile || "mixed";
  const risk = req.query.risk;
  const sector = req.query.sector;
  const market = req.query.market;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
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
