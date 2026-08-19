/* global process */
import { createClient } from "@supabase/supabase-js";

// Daglig nettoförmögenhets-snapshot (Vercel cron, se vercel.json). Körs med
// service role över alla användare: senaste portföljsnapshot + pension ur
// preferences + manual_assets − skulder → net_worth_snapshots (upsert per
// user+dag, så ett omkörningspass är ofarligt). Inga kursanrop — vi
// återanvänder portfolio_snapshots som scrapern redan fyller.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function pensionTotal(pension) {
  // Speglar src/lib/pension.js getPensionTotalValue utan att importera klientkod
  if (!pension) return null;
  const entries = Array.isArray(pension.entries) ? pension.entries
    : pension.currentValue != null ? [pension] : [];
  let total = 0, any = false;
  for (const e of entries) {
    const v = Number(e?.currentValue);
    if (Number.isFinite(v)) { total += v; any = true; }
  }
  return any ? total : null;
}

export default async function handler(req, res) {
  // Vercel cron skickar Authorization: Bearer <CRON_SECRET>; tillåt även manuell körning med samma hemlighet.
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Missing Supabase service credentials" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [{ data: prefsRows, error: prefsErr }, { data: manualRows, error: manualErr }, { data: snapRows, error: snapErr }] = await Promise.all([
      supabase.from("user_prefs").select("user_id, preferences"),
      supabase.from("manual_assets").select("user_id, value_sek, is_debt"),
      supabase.from("portfolio_snapshots").select("user_id, snapshot_date, total_value_sek").order("snapshot_date", { ascending: false }),
    ]);
    if (prefsErr || manualErr || snapErr) {
      console.error("net-worth-snapshot: read error", prefsErr || manualErr || snapErr);
      return res.status(500).json({ error: "read_failed" });
    }

    // Senaste portföljvärde per användare (raderna är sorterade fallande)
    const latestPortfolio = {};
    for (const s of snapRows || []) {
      if (!(s.user_id in latestPortfolio)) latestPortfolio[s.user_id] = Number(s.total_value_sek);
    }
    const manualByUser = {};
    for (const r of manualRows || []) {
      const m = manualByUser[r.user_id] || (manualByUser[r.user_id] = { assets: 0, debts: 0 });
      if (r.is_debt) m.debts += Number(r.value_sek); else m.assets += Number(r.value_sek);
    }
    const pensionByUser = {};
    for (const p of prefsRows || []) pensionByUser[p.user_id] = pensionTotal(p.preferences?.pension);

    const userIds = new Set([...Object.keys(latestPortfolio), ...Object.keys(manualByUser), ...Object.keys(pensionByUser)]);
    const rows = [];
    for (const userId of userIds) {
      const portfolio = latestPortfolio[userId] ?? null;
      const pension = pensionByUser[userId] ?? null;
      const m = manualByUser[userId] || { assets: 0, debts: 0 };
      // Hoppa över användare utan någon data alls — ingen 0-rad att rita
      if (portfolio == null && pension == null && m.assets === 0 && m.debts === 0) continue;
      rows.push({
        user_id: userId,
        snapshot_date: today,
        net_worth_sek: (portfolio ?? 0) + (pension ?? 0) + m.assets - m.debts,
        portfolio_sek: portfolio,
        pension_sek: pension,
        assets_sek: m.assets,
        debts_sek: m.debts,
      });
    }

    if (rows.length > 0) {
      const { error: upErr } = await supabase
        .from("net_worth_snapshots")
        .upsert(rows, { onConflict: "user_id,snapshot_date" });
      if (upErr) {
        console.error("net-worth-snapshot: upsert error", upErr);
        return res.status(500).json({ error: upErr.message });
      }
    }
    return res.status(200).json({ ok: true, date: today, users: rows.length });
  } catch (err) {
    console.error("net-worth-snapshot error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
