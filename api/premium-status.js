import Stripe from "stripe";
import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(200).json({ premium: false });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return res.status(200).json({ premium: false });

  // Check local DB first
  const { data: localSub } = await supabase
    .from("premium_subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (localSub?.status === "active") {
    return res.status(200).json({ premium: true });
  }

  // Fallback: check Stripe directly by customer email
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(200).json({ premium: false });

  try {
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // Sync to local DB for faster future lookups
        await supabase.from("premium_subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptions.data[0].id,
          status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        return res.status(200).json({ premium: true });
      }
    }
  } catch (err) {
    console.error("Stripe check error:", err.message);
  }

  return res.status(200).json({ premium: false });
}
