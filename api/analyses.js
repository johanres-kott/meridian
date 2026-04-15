import Stripe from "stripe";
import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();
  const { slug } = req.query;

  // Check premium status
  const authHeader = req.headers.authorization;
  let isPremium = false;

  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (user) {
      // Check local DB
      const { data: sub } = await supabase
        .from("premium_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (sub?.status === "active") {
        isPremium = true;
      } else {
        // Fallback: check Stripe
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          try {
            const stripe = new Stripe(stripeKey);
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
              const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
              if (subs.data.length > 0) isPremium = true;
            }
          } catch {}
        }
      }
    }
  }

  try {
    if (slug) {
      // Single analysis
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !data) return res.status(404).json({ error: "Not found" });

      if (!isPremium) {
        // Return teaser only
        return res.status(200).json({
          id: data.id,
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle,
          date: data.date,
          sector: data.sector,
          tags: data.tags,
          summary: data.summary,
          premium: false,
        });
      }

      return res.status(200).json({ ...data, premium: true });
    }

    // List all published analyses
    const { data, error } = await supabase
      .from("analyses")
      .select("id, slug, title, subtitle, date, sector, tags, summary")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Analyses list error:", error.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(200).json({ analyses: data || [], premium: isPremium });
  } catch (err) {
    console.error("Analyses error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
