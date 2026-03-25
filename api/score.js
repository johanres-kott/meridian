import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://acostgikldxkdmcoavkf.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb3N0Z2lrbGR4a2RtY29hdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDUzMTgsImV4cCI6MjA4ODcyMTMxOH0.WD-y6dRTaIDfJMxxCKO3cw3T-Bz5SSTj1lPHGIy8d4I";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 60)) return;

  const ticker = req.query.ticker;
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await supabase
    .from("stock_scores")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (error || !data) return res.json(null);

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.json({
    ticker: data.ticker,
    name: data.name,
    sector: data.sector,
    risk: data.risk,
    beta: data.beta,
    scores: {
      piotroski: { raw: data.piotroski_raw, normalized: data.piotroski_score },
      magicFormula: data.magic_formula,
      growth: data.growth_score,
      dividend: data.dividend_score,
      quality: data.quality_score,
    },
    composite: {
      value: data.score_value,
      growth: data.score_growth,
      dividend: data.score_dividend,
      mixed: data.score_mixed,
    },
    data: {
      peForward: data.pe_forward,
      peTrailing: data.pe_trailing,
      dividendYield: data.dividend_yield,
      revenueGrowth: data.revenue_growth,
      operatingMargin: data.operating_margin,
      grossMargin: data.gross_margin,
      roic: data.roic,
      debtEbitda: data.debt_ebitda,
    },
    scoredAt: data.scored_at,
  });
}
