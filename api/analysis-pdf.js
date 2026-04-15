import Stripe from "stripe";
import { setCors } from "./_cors.js";
import { getSupabase } from "./_supabase.js";

/**
 * GET /api/analysis-pdf?slug=ag-equipment
 * Returns a signed URL for the PDF. Requires premium subscription.
 */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "slug required" });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return res.status(401).json({ error: "Not authenticated" });

  // Check premium status
  let isPremium = false;
  const { data: sub } = await supabase
    .from("premium_subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (sub?.status === "active") {
    isPremium = true;
  } else {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
          if (subs.data.length > 0) isPremium = true;
        }
      } catch {}
    }
  }

  if (!isPremium) return res.status(403).json({ error: "Premium required" });

  // Look up the PDF path from the analysis record
  const { data: analysis } = await supabase
    .from("analyses")
    .select("pdf_url")
    .eq("slug", slug)
    .single();

  if (!analysis?.pdf_url) return res.status(404).json({ error: "No PDF for this analysis" });

  // Generate a signed URL (valid for 60 minutes)
  const { data: signed, error: signError } = await supabase.storage
    .from("analyses")
    .createSignedUrl(analysis.pdf_url, 3600);

  if (signError || !signed?.signedUrl) {
    console.error("Signed URL error:", signError?.message);
    return res.status(500).json({ error: "Could not generate download link" });
  }

  return res.status(200).json({ url: signed.signedUrl });
}
