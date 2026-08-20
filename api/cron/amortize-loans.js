/* global process, Buffer */
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { applyMonthlyAmortization } from "./_amortize.js";

// Månadsvis nedräkning av lån med amortering (Vercel cron, se vercel.json).
// Körs med service role över alla användare: manual_assets-rader med is_debt
// där användaren slagit på metadata.autoAmortize räknas ned med
// amortizationRate/12 och stämplas med lastAmortizedAt. Idempotent per
// kalendermånad (se _amortize.js) — ett omkörningspass är ofarligt.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function bearerMatches(header, secret) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(String(header || ""));
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export default async function handler(req, res) {
  // Vercel cron skickar Authorization: Bearer <CRON_SECRET>; tillåt även manuell
  // körning med samma hemlighet. Fail-closed: utan CRON_SECRET i miljön körs
  // inget alls (annars vore endpointen öppen för vem som helst att trigga).
  if (!CRON_SECRET) {
    return res.status(500).json({ error: "CRON_SECRET not configured" });
  }
  if (!bearerMatches(req.headers.authorization, CRON_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Missing Supabase service credentials" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data: rows, error: readErr } = await supabase
      .from("manual_assets")
      .select("id, value_sek, is_debt, metadata")
      .eq("is_debt", true);
    if (readErr) {
      console.error("amortize-loans: read error", readErr);
      return res.status(500).json({ error: "read_failed" });
    }

    let updated = 0;
    for (const row of rows || []) {
      const patch = applyMonthlyAmortization(row, today);
      if (!patch) continue;
      const { error: upErr } = await supabase
        .from("manual_assets")
        .update(patch)
        .eq("id", row.id);
      if (upErr) {
        console.error("amortize-loans: update error", row.id, upErr);
        return res.status(500).json({ error: upErr.message });
      }
      updated += 1;
    }

    return res.status(200).json({ ok: true, date: today, processed: (rows || []).length, updated });
  } catch (err) {
    console.error("amortize-loans error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
