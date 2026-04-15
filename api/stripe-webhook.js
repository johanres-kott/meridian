import Stripe from "stripe";
import { getSupabase } from "./_supabase.js";

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    console.error("Stripe env vars not configured");
    return res.status(500).end();
  }

  const stripe = new Stripe(stripeKey);
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (userId) {
      const { error } = await supabase.from("premium_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) console.error("Failed to save subscription:", error.message);
      else console.log("Premium activated for user:", userId);
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const status = subscription.status; // active, canceled, past_due, etc.

    const { error } = await supabase
      .from("premium_subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    if (error) console.error("Failed to update subscription:", error.message);
  }

  return res.status(200).json({ received: true });
}
