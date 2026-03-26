// Fetches news and analysis articles about Swedish investment companies from EFN (efn.se).
// Source: EFN search — https://efn.se/sok/alla?q={query}&index=artiklar
// Cache: 1h fresh, 2h stale-while-revalidate.

const UA = "Mozilla/5.0 (compatible; Meridian/1.0)";
const TIMEOUT_MS = 8000;
const DEFAULT_COUNT = 5;
const MAX_COUNT = 10;
const EFN_BASE = "https://efn.se";

// Search queries tuned per company to minimize irrelevant results
const EFN_QUERIES = {
  investor:       "Investor AB",
  industrivarden: "Industrivärden",
  oresund:        "Investmentbolaget Öresund",
  latour:         "Latour",
  lundbergs:      "Lundbergföretagen",
  svolder:        "Svolder",
  creades:        "Creades",
};

const SV_MONTHS = {
  januari: "01", februari: "02", mars: "03", april: "04",
  maj: "05", juni: "06", juli: "07", augusti: "08",
  september: "09", oktober: "10", november: "11", december: "12",
};

function parseSvDateTime(str) {
  // "23 mars 2026 15:11" → "2026-03-23"
  const m = str.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (!m) return null;
  const month = SV_MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function fetchEfnNews(id, count) {
  const query = EFN_QUERIES[id];
  if (!query) return [];

  const url = `${EFN_BASE}/sok/alla?q=${encodeURIComponent(query)}&index=artiklar`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let html;
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept": "text/html" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const items = [];

  // EFN search result structure (Tailwind CSS):
  // <div class="mb-6"> ...
  //   <p class="text-gray-400 mb-2">23 mars 2026 15:11</p>
  //   ...
  //   <a href="/article-slug"><h2 class="text-xl font-bold mb-1">Title</h2></a>
  // </div>
  //
  // Strategy: find each article block, then extract date and title+url from within it.

  const blockRe = /<div class="mb-6">([\s\S]*?)<div class="my-4/g;
  let blockMatch;

  while ((blockMatch = blockRe.exec(html)) !== null && items.length < count) {
    const block = blockMatch[1];

    // Extract date
    const dateMatch = block.match(/<p class="text-gray-400[^"]*">\s*([^<]+?)\s*<\/p>/);
    const date = dateMatch ? parseSvDateTime(dateMatch[1]) : null;

    // Extract article URL and title from <a href="..."><h2 class="text-xl font-bold...">Title</h2></a>
    const articleMatch = block.match(/<a href="(\/[^"]+)"[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/);
    if (!articleMatch) continue;

    const path = articleMatch[1];
    const title = decodeHtmlEntities(articleMatch[2]);

    // Skip category/topic links (/amne/, /av/)
    if (path.startsWith("/amne/") || path.startsWith("/av/")) continue;

    items.push({
      title,
      url: EFN_BASE + path,
      date,
      source: "EFN",
    });
  }

  // Fallback: if block-based parsing found nothing, try a simpler approach
  if (items.length === 0) {
    const simpleRe = /<a href="(\/[a-z0-9][^"]+)"[^>]*>\s*<h2 class="text-xl font-bold[^"]*">\s*([^<]{5,200})\s*<\/h2>/g;
    let m;
    while ((m = simpleRe.exec(html)) !== null && items.length < count) {
      const path = m[1];
      if (path.startsWith("/amne/") || path.startsWith("/av/") || path.startsWith("/sok/")) continue;
      items.push({
        title: decodeHtmlEntities(m[2]),
        url: EFN_BASE + path,
        date: null,
        source: "EFN",
      });
    }
  }

  return items.slice(0, count);
}

const VALID_IDS = new Set(Object.keys(EFN_QUERIES));

import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 30)) return;
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  const { id, count: countParam } = req.query;
  const count = Math.min(parseInt(countParam) || DEFAULT_COUNT, MAX_COUNT);

  if (!id || !VALID_IDS.has(id)) {
    return res.status(400).json({
      error: "Invalid or missing id. Valid ids: " + [...VALID_IDS].join(", "),
    });
  }

  try {
    const items = await fetchEfnNews(id, count);
    res.status(200).json({
      id,
      query: EFN_QUERIES[id],
      items,
      count: items.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    // EFN is an external dependency — never let it crash the frontend
    res.status(200).json({
      id,
      query: EFN_QUERIES[id],
      items: [],
      count: 0,
      source: "unavailable",
      fetchedAt: new Date().toISOString(),
    });
  }
}
