// Fetches press releases / news for each investment company.
// Sources: Cision RSS (Investor, Industrivärden, Latour, Öresund),
//          direct HTML scraping (Creades, Svolder, Lundbergs).
// Cache: 30min fresh, 1h stale-while-revalidate.

const UA = "Mozilla/5.0 (compatible; Meridian/1.0)";
const TIMEOUT_MS = 8000;
const DEFAULT_COUNT = 5;
const MAX_COUNT = 10;

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, ...(opts.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// --- Helpers ---

function parseRssDate(str) {
  // RFC 822 format: "Mon, 09 Mar 2026 14:03:00 +0000"
  try {
    return new Date(str).toISOString().split("T")[0];
  } catch {
    return str ?? null;
  }
}

function parseRss(xml, baseUrl) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                   block.match(/<title>([^<]*)<\/title>/))?.[1]?.trim();
    const link  = (block.match(/<link>([^<]*)<\/link>/) ||
                   block.match(/<guid[^>]*>([^<]*)<\/guid>/))?.[1]?.trim();
    const date  = block.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]?.trim();
    if (title && link) {
      items.push({
        title,
        url: link.startsWith("http") ? link : baseUrl + link,
        date: parseRssDate(date),
        source: "cision",
      });
    }
  }
  return items;
}

// --- Cision RSS (most reliable; four companies use Cision) ---

const CISION_SLUGS = {
  investor:       "investor",
  industrivarden: "industrivarden",
  latour:         "latour",
  oresund:        "investment-ab-oresund",
};

async function fetchCisionNews(slug) {
  const xml = await fetchWithTimeout(`https://news.cision.com/se/${slug}/rss/`);
  return parseRss(xml, "https://news.cision.com");
}

// --- Creades: WordPress-style archive ---

async function fetchCreadesNews() {
  const html = await fetchWithTimeout("https://www.creades.se/pressmeddelanden/");
  const items = [];
  // Pattern: <a href="/pressmeddelanden/pressmeddelanden/YYYY/slug/">Title</a>
  const re = /href="(\/pressmeddelanden\/[^"]+)"[^>]*>([^<]{5,200})</g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    const title = m[2].trim();
    // Extract year from path as approximate date
    const yearMatch = path.match(/\/(\d{4})\//);
    items.push({
      title,
      url: "https://www.creades.se" + path,
      date: yearMatch ? yearMatch[1] : null,
      source: "creades.se",
    });
  }
  return items;
}

// --- Svolder: look for press releases ---

async function fetchSvolderNews() {
  // Try multiple candidate URLs
  const candidates = [
    "https://svolder.se/press-och-ir/pressmeddelanden/",
    "https://svolder.se/ir/pressmeddelanden/",
    "https://svolder.se/pressmeddelanden/",
    "https://svolder.se/nyheter/",
  ];
  for (const url of candidates) {
    try {
      const html = await fetchWithTimeout(url);
      const items = [];
      // Look for news links containing date-like patterns or year in URL
      const re = /href="(https?:\/\/svolder\.se\/[^"]*(?:release|pressmed|nyhet|rapport)[^"]*)"[^>]*>([^<]{5,200})</gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        items.push({ title: m[2].trim(), url: m[1], date: null, source: "svolder.se" });
      }
      if (items.length > 0) return items;
    } catch { /* try next */ }
  }
  return [];
}

// --- Lundbergs: Drupal-based ---

async function fetchLundbergsNews() {
  const candidates = [
    "https://www.lundbergforetagen.se/sv/media/pressmeddelanden",
    "https://www.lundbergforetagen.se/sv/press",
    "https://www.lundbergforetagen.se/press",
  ];
  for (const url of candidates) {
    try {
      const html = await fetchWithTimeout(url);
      const items = [];
      // Pattern: <a href="/sv/press/slug">Title</a> or similar
      const re = /href="(\/sv\/(?:press|media)[^"]+)"[^>]*>\s*([^<]{5,200})\s*</g;
      let m;
      while ((m = re.exec(html)) !== null) {
        items.push({
          title: m[2].trim(),
          url: "https://www.lundbergforetagen.se" + m[1],
          date: null,
          source: "lundbergforetagen.se",
        });
      }
      if (items.length > 0) return items;
    } catch { /* try next */ }
  }
  return [];
}

// --- Industrivärden: direct scrape as backup to Cision ---

async function fetchIndustrivardenNews() {
  const html = await fetchWithTimeout("https://www.industrivarden.se/media/pressmeddelanden/");
  const items = [];
  // Pattern: <li><a href="/media/Pressmeddelanden/YYYY/slug/">DATE TITLE</a></li>
  const re = /href="(\/media\/[Pp]ressmeddelanden\/[^"]+)"[^>]*>\s*([^<]{5,300})\s*</g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const fullText = m[2].trim();
    // Text starts with date like "3 mar 2026 " then title
    const dateMatch = fullText.match(/^(\d{1,2}\s+\w+\s+\d{4})\s+(.*)/);
    items.push({
      title: dateMatch ? dateMatch[2].trim() : fullText,
      url: "https://www.industrivarden.se" + m[1],
      date: dateMatch ? parseSvDate(dateMatch[1]) : null,
      source: "industrivarden.se",
    });
  }
  return items;
}

const SV_MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", maj: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", okt: "10", nov: "11", dec: "12",
};

function parseSvDate(str) {
  // "3 mar 2026" → "2026-03-03"
  const m = str.trim().match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/i);
  if (!m) return null;
  const month = SV_MONTHS[m[2].toLowerCase().slice(0, 3)];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

// --- Router ---

const FETCHERS = {
  investor:       () => fetchCisionNews(CISION_SLUGS.investor),
  industrivarden: async () => {
    // Try Cision first, fall back to direct scrape
    try { return await fetchCisionNews(CISION_SLUGS.industrivarden); }
    catch { return fetchIndustrivardenNews(); }
  },
  latour:         () => fetchCisionNews(CISION_SLUGS.latour),
  oresund:        () => fetchCisionNews(CISION_SLUGS.oresund),
  creades:        fetchCreadesNews,
  svolder:        fetchSvolderNews,
  lundbergs:      fetchLundbergsNews,
};

const VALID_IDS = new Set(Object.keys(FETCHERS));

import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 30)) return;
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

  const { id, count: countParam } = req.query;
  const count = Math.min(parseInt(countParam) || DEFAULT_COUNT, MAX_COUNT);

  if (!id || !VALID_IDS.has(id)) {
    return res.status(400).json({
      error: "Invalid or missing id. Valid ids: " + [...VALID_IDS].join(", "),
    });
  }

  try {
    const items = await FETCHERS[id]();
    const sliced = items.slice(0, count);
    res.status(200).json({ id, items: sliced, count: sliced.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error(`Company news fetch error for ${id}:`, err);
    // Always return 200 to frontend — empty list is better than an error page
    res.status(200).json({ id, items: [], count: 0, error: "scraping_failed", fetchedAt: new Date().toISOString() });
  }
}
