import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

// Ekonomiläget för Översikten: tre officiella siffror hämtade direkt från
// källorna (Riksbankens SWEA-API och SCB:s PXWeb, båda öppna utan nyckel).
// Ren vidareförmedling av officiell statistik plus enkel aritmetik
// (årstakt/kvartalstakt ur indexserier) — inga påhittade värden. Källorna
// hämtas parallellt och oberoende: fallerar en blir dess block null i svaret,
// vi gissar aldrig (se COMPLIANCE.md).

const RIKSBANK_URL = "https://api.riksbank.se/swea/v1/Observations";
const KPIF_URL = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101G/KPIF2020";
const HOUSING_URL = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BO/BO0501/BO0501A/FastpiPSRegKv";

const round1 = (x) => Math.round(x * 10) / 10;

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} från ${url}`);
  return res.json();
}

function scbPost(query) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, response: { format: "json" } }),
  };
}

// PXWeb-svar → { tidKod: värde }. ContentsCode ingår aldrig i key, så sista
// key-elementet är alltid Tid (jfr property-index där key = [region, kvartal]).
function byTime(dataJson) {
  const map = {};
  for (const d of dataJson?.data || []) map[d.key[d.key.length - 1]] = parseFloat(d.values[0]);
  return map;
}

// Vissa PXWeb-tabeller kräver att ContentsCode väljs explicit — samma mönster
// som mot FastpiPSRegKv (som bara har ett innehåll). KPIF2020 har tre innehåll
// (index, månads- och årsförändring): välj indexserien via valueText, annars
// första värdet.
function contentsSelection(metaJson) {
  const contents = metaJson?.variables?.find(v => v.code === "ContentsCode");
  if (!Array.isArray(contents?.values) || contents.values.length === 0) return [];
  let value = contents.values[0];
  if (Array.isArray(contents.valueTexts)) {
    const i = contents.valueTexts.findIndex(t => /index/i.test(String(t)));
    if (i >= 0 && contents.values[i] != null) value = contents.values[i];
  }
  return [{ code: "ContentsCode", selection: { filter: "item", values: [value] } }];
}

// Styrräntan från Riksbankens SWEA-API: senaste observationen, plus "sedan
// när" genom att gå bakåt i seriens senaste ~2 år till den senaste ändringen.
async function getPolicyRate() {
  const latest = await fetchJson(`${RIKSBANK_URL}/Latest/SECBREPOEFF`);
  const value = Number(latest?.value);
  const date = latest?.date;
  if (!Number.isFinite(value) || typeof date !== "string" || !date) {
    throw new Error("riksbanken: oväntat svar för senaste styrräntan");
  }

  // "Sedan"-datumet: första observationen efter den senaste avvikande — värdet
  // gäller från när det senast ändrades. Hittas ingen ändring i fönstret (eller
  // fallerar serien) blir since null; siffran ovan är fortfarande officiell.
  let since = null;
  try {
    const to = new Date();
    const from = new Date(to.getTime() - 730 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const series = await fetchJson(`${RIKSBANK_URL}/SECBREPOEFF/${fmt(from)}/${fmt(to)}`);
    if (Array.isArray(series)) {
      const sorted = series
        .filter(o => o && typeof o.date === "string" && Number.isFinite(Number(o.value)))
        .sort((a, b) => a.date.localeCompare(b.date));
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (Number(sorted[i].value) !== value) {
          since = sorted[i + 1]?.date ?? null;
          break;
        }
      }
    }
  } catch (err) {
    console.error("econ-overview: styrränteserien fallerade:", err.message);
  }
  return { value, date, since };
}

// KPIF årsförändring ur SCB:s indexserie (KPIF2020): senaste månaden mot samma
// månad förra året.
async function getKpif() {
  const meta = await fetchJson(KPIF_URL);
  const tid = meta?.variables?.find(v => v.code === "Tid")?.values;
  if (!Array.isArray(tid) || tid.length === 0) throw new Error("kpif: metadata utan Tid");
  const latestMonth = tid[tid.length - 1];
  const m = /^(\d{4})M(\d{2})$/.exec(latestMonth);
  if (!m) throw new Error(`kpif: oväntat månadsformat ${latestMonth}`);
  const prevMonth = `${Number(m[1]) - 1}M${m[2]}`;
  if (!tid.includes(prevMonth)) throw new Error(`kpif: ${prevMonth} saknas i tabellen`);

  const dataJson = await fetchJson(KPIF_URL, scbPost([
    ...contentsSelection(meta),
    { code: "Tid", selection: { filter: "item", values: [prevMonth, latestMonth] } },
  ]));
  const idx = byTime(dataJson);
  const now = idx[latestMonth];
  const yearAgo = idx[prevMonth];
  if (!Number.isFinite(now) || !Number.isFinite(yearAgo) || yearAgo <= 0) {
    throw new Error("kpif: indexvärden saknas");
  }
  return { month: latestMonth, yoyPct: round1((now / yearAgo - 1) * 100) };
}

// Småhuspriser kvartal mot kvartal för Riket, samma SCB-tabell som
// api/property-index.js (fastighetsprisindex, permanenta småhus).
async function getHousing() {
  const meta = await fetchJson(HOUSING_URL);
  const tid = meta?.variables?.find(v => v.code === "Tid")?.values;
  if (!Array.isArray(tid) || tid.length < 2) throw new Error("småhus: metadata utan kvartal");
  const latestQuarter = tid[tid.length - 1];
  const prevQuarter = tid[tid.length - 2];

  const dataJson = await fetchJson(HOUSING_URL, scbPost([
    ...contentsSelection(meta),
    { code: "Region", selection: { filter: "item", values: ["00"] } },
    { code: "Tid", selection: { filter: "item", values: [prevQuarter, latestQuarter] } },
  ]));
  const idx = byTime(dataJson);
  const now = idx[latestQuarter];
  const prev = idx[prevQuarter];
  if (!Number.isFinite(now) || !Number.isFinite(prev) || prev <= 0) {
    throw new Error("småhus: indexvärden saknas");
  }
  return { quarter: latestQuarter, qoqPct: round1((now / prev - 1) * 100), region: "Riket" };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 30)) return;

  // Promise.allSettled: delresultat är OK — en fallerad källa ger null för
  // sitt block, aldrig ett påhittat värde och aldrig 500 för helheten.
  const [policyRate, kpif, housing] = (
    await Promise.allSettled([getPolicyRate(), getKpif(), getHousing()])
  ).map(r => {
    if (r.status === "fulfilled") return r.value;
    console.error("econ-overview:", r.reason?.message || r.reason);
    return null;
  });

  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  return res.status(200).json({ policyRate, kpif, housing });
}
