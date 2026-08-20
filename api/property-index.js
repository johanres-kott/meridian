import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

// Indexuppräkning av bostadens köpeskilling via SCB:s fastighetsprisindex för
// permanenta småhus (PXWeb, öppet API utan nyckel). Ren aritmetik på officiell
// statistik: factor = index nu / index vid köpkvartalet. Inga påhittade värden —
// saknas index svarar vi med fel, och uppskattningen skrivs aldrig till
// användarens värde utan uttryckligt klick i UI:t (se COMPLIANCE.md/PIVOT.md).

const SCB_URL = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BO/BO0501/BO0501A/FastpiPSRegKv";

// SCB:s regionlista för tabellen (values/valueTexts från metadatat) — hålls i
// synk med REGIONS i src/components/ManualAssetView.jsx.
const REGIONS = {
  "00": "Riket",
  "0010": "Stor-Stockholm",
  "0020": "Stor-Göteborg",
  "0030": "Stor-Malmö",
  RIKS1: "Stockholms län",
  RIKS2: "Östra mellansverige",
  RIKS3: "Småland med öarna",
  RIKS4: "Sydsverige",
  RIKS5: "Västsverige",
  RIKS6: "Norra mellansverige",
  RIKS7: "Mellersta Norrland",
  RIKS8: "Övre Norrland",
};

const FIRST_QUARTER = "1986K1"; // tabellen börjar 1986K1

// "YYYY-MM-DD" eller "YYYY-MM" → "YYYYKn" (månad 1–3 = K1 osv), null om ogiltig
function dateToQuarter(s) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(s || ""));
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  if (m[3] != null) {
    const day = parseInt(m[3], 10);
    if (day < 1 || day > 31) return null;
  }
  return `${year}K${Math.floor((month - 1) / 3) + 1}`;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 30)) return;

  const { price: rawPrice, date, region = "00" } = req.query;

  if (!/^\d+$/.test(String(rawPrice ?? "")) || Number(rawPrice) <= 0) {
    return res.status(400).json({ error: "invalid price — ange köpeskilling i kr som heltal > 0" });
  }
  const price = Number(rawPrice);

  const purchaseQuarterRaw = dateToQuarter(date);
  if (!purchaseQuarterRaw) {
    return res.status(400).json({ error: "invalid date — ange köpdatum som YYYY-MM-DD eller YYYY-MM" });
  }
  if (!(region in REGIONS)) {
    return res.status(400).json({ error: "invalid region — ogiltig SCB-regionkod" });
  }
  // Före tabellens start finns inget index att räkna med
  if (purchaseQuarterRaw < FIRST_QUARTER) {
    return res.status(400).json({ error: `SCB:s småhusindex börjar ${FIRST_QUARTER} — köpdatum före det kan inte räknas upp` });
  }

  try {
    // 1) Metadata → senaste tillgängliga kvartal
    const metaRes = await fetch(SCB_URL);
    if (!metaRes.ok) {
      console.error("property-index: SCB metadata error:", metaRes.status);
      return res.status(502).json({ error: "scb_error" });
    }
    const metaJson = await metaRes.json();
    const tidValues = metaJson?.variables?.find(v => v.code === "Tid")?.values;
    if (!Array.isArray(tidValues) || tidValues.length === 0) {
      return res.status(502).json({ error: "scb_error" });
    }
    const latestQuarter = tidValues[tidValues.length - 1];

    // Klampa framåt: köp i eller efter senaste kvartalet → ingen uppräkning
    // ("YYYYKn" är fast bredd, så strängjämförelse är kronologisk)
    const purchaseQuarter = purchaseQuarterRaw >= latestQuarter ? latestQuarter : purchaseQuarterRaw;
    const quarters = purchaseQuarter === latestQuarter ? [latestQuarter] : [purchaseQuarter, latestQuarter];

    // 2) Indexvärden för köpkvartalet och senaste kvartalet
    const dataRes = await fetch(SCB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: [
          { code: "Region", selection: { filter: "item", values: [region] } },
          { code: "Tid", selection: { filter: "item", values: quarters } },
        ],
        response: { format: "json" },
      }),
    });
    if (!dataRes.ok) {
      console.error("property-index: SCB data error:", dataRes.status);
      return res.status(502).json({ error: "scb_error" });
    }
    const dataJson = await dataRes.json();
    const byQuarter = {};
    for (const d of dataJson?.data || []) byQuarter[d.key[1]] = parseFloat(d.values[0]);

    const indexThen = byQuarter[purchaseQuarter];
    const indexNow = byQuarter[latestQuarter];
    if (!Number.isFinite(indexThen) || !Number.isFinite(indexNow) || indexThen <= 0) {
      console.error("property-index: missing index values for", quarters);
      return res.status(502).json({ error: "scb_error" });
    }

    const clamped = purchaseQuarter === latestQuarter;
    const factor = clamped ? 1 : indexNow / indexThen;
    // Avrundat till närmaste tusenlapp; vid sammanfallande kvartal exakt priset
    const estimate = clamped ? price : Math.round((price * factor) / 1000) * 1000;

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).json({
      estimate,
      factor,
      purchaseQuarter,
      latestQuarter,
      indexThen,
      indexNow,
      region,
      regionText: REGIONS[region],
      source: "SCB fastighetsprisindex, permanenta småhus",
    });
  } catch (err) {
    console.error("property-index error:", err.message);
    return res.status(502).json({ error: "scb_error" });
  }
}
