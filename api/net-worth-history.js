import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

// Läser användarens nettoförmögenhets-snapshots (skrivna av cron). JWT-proxy
// som övriga endpoints — user_id kommer från verifierad token, RLS gäller.
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 60)) return;

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = auth.slice(7);
    const supabase = getSupabase({ global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { data, error } = await supabase
      .from("net_worth_snapshots")
      .select("snapshot_date, net_worth_sek, portfolio_sek, pension_sek, assets_sek, debts_sek")
      .eq("user_id", user.id)
      .order("snapshot_date", { ascending: true })
      .limit(2000);
    if (error) {
      console.error("net-worth-history error:", error);
      {
    console.error("net-worth-history:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
    }
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).json({
      snapshots: (data || []).map(r => ({
        date: r.snapshot_date,
        value: Number(r.net_worth_sek),
        portfolio: r.portfolio_sek != null ? Number(r.portfolio_sek) : null,
        pension: r.pension_sek != null ? Number(r.pension_sek) : null,
        assets: Number(r.assets_sek),
        debts: Number(r.debts_sek),
      })),
    });
  } catch (err) {
    console.error("net-worth-history error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
