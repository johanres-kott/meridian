/* global process */
import crypto from "crypto";
import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

// Värdeindikation för bostad via Boolis officiella API (slutpriser i området).
// Kräver BOOLI_CALLER_ID + BOOLI_PRIVATE_KEY (ansöks hos Booli/SBAB) — utan
// nycklar svarar vi 501 och frontend faller tillbaka till manuell inmatning.
// Vi returnerar bara verkliga slutpriser + median kr/m²; "estimate" är ren
// aritmetik (median × boyta) och märks som uppskattning i UI:t.

const CALLER_ID = process.env.BOOLI_CALLER_ID;
const PRIVATE_KEY = process.env.BOOLI_PRIVATE_KEY;

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 30)) return;

  const { q, livingArea } = req.query;
  if (!q || q.length < 3 || q.length > 100) {
    return res.status(400).json({ error: "invalid query" });
  }
  if (!CALLER_ID || !PRIVATE_KEY) {
    return res.status(501).json({ error: "not_configured" });
  }

  try {
    // Boolis auth-modell: sha1(callerId + time + privateKey + unique)
    const time = Math.floor(Date.now() / 1000).toString();
    const unique = crypto.randomBytes(8).toString("hex");
    const hash = crypto.createHash("sha1").update(CALLER_ID + time + PRIVATE_KEY + unique).digest("hex");
    const params = new URLSearchParams({
      q,
      callerId: CALLER_ID,
      time,
      unique,
      hash,
      limit: "30",
    });

    const r = await fetch(`https://api.booli.se/sold?${params}`);
    if (!r.ok) {
      console.error("Booli error:", r.status);
      return res.status(502).json({ error: "booli_error", status: r.status });
    }
    const data = await r.json();

    const sold = (data.sold || []).filter(s => s.soldPrice > 0 && s.livingArea > 0);
    const ppsqm = sold.map(s => s.soldPrice / s.livingArea).sort((a, b) => a - b);
    const median = ppsqm.length > 0 ? ppsqm[Math.floor(ppsqm.length / 2)] : null;
    const sqm = parseFloat(livingArea);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.status(200).json({
      count: sold.length,
      medianPricePerSqm: median != null ? Math.round(median) : null,
      estimate: median != null && Number.isFinite(sqm) && sqm > 0 ? Math.round(median * sqm) : null,
      samples: sold.slice(0, 8).map(s => ({
        address: s.location?.address?.streetAddress ?? null,
        area: s.location?.namedAreas?.[0] ?? null,
        soldPrice: s.soldPrice,
        livingArea: s.livingArea,
        rooms: s.rooms ?? null,
        soldDate: s.soldDate ?? null,
        objectType: s.objectType ?? null,
      })),
      source: "Booli (slutpriser)",
    });
  } catch (err) {
    console.error("Property valuation error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
