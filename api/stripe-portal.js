import Stripe from "stripe";
import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

/**
 * POST /api/stripe-portal
 * Creates a Stripe Customer Portal session so the user can manage their subscription.
 */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return res.status(401).json({ error: "Not authenticated" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  // Find customer by email
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) {
    return res.status(404).json({ error: "No subscription found" });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${req.headers.origin || "http://localhost:3000"}/#analysis`,
  });

  return res.status(200).json({ url: session.url });
}
