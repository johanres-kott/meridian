import Stripe from "stripe";
import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return res.status(500).json({ error: "Payment not configured" });
  }

  // Verify user is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const stripe = new Stripe(stripeKey);

    const origin = req.headers.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      metadata: { userId: user.id },
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Thesion Premium",
              description: "Tillgång till djupanalyser, sektorrapporter och premium-innehåll",
            },
            unit_amount: 4900, // 49 SEK
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}?premium=success`,
      cancel_url: `${origin}?premium=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
