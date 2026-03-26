// Scrapes CEO and board chair from each investment company's website.
// Falls back to static data if scraping fails.
// Cache: 12h fresh, 24h stale-while-revalidate (leadership changes rarely).

const UA = "Mozilla/5.0 (compatible; Meridian/1.0)";
const TIMEOUT_MS = 8000;

// Static fallback data — update manually if a scrape keeps failing
const FALLBACK = {
  investor:       { ceo: "Christian Cederholm",  boardChair: "Jacob Wallenberg" },
  industrivarden: { ceo: "Helena Stjernholm",    boardChair: "Fredrik Lundberg" },
  oresund:        { ceo: "Nicklas Paulson",       boardChair: "Mats Qviberg" },
  latour:         { ceo: "Johan Hjertonsson",     boardChair: "Jan Svensson" },
  lundbergs:      { ceo: "Lars Johansson",        boardChair: "Fredrik Lundberg" },
  svolder:        { ceo: "Ulf Hedlundh",          boardChair: "Leif Törnvall" },
  creades:        { ceo: "John Hedberg",          boardChair: "Sven Hagströmer" },
};

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": UA, ...(opts.headers ?? {}) } });
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// --- Per-company scrapers ---

async function scrapeInvestor() {
  const html = await fetchWithTimeout(
    "https://www.investorab.com/about-investor/board-management/board-of-directors/"
  );
  // Pattern: <h3>Name</h3> followed shortly by <p>Chair</p> or <p>Chief Executive Officer</p>
  const members = [...html.matchAll(/<h3>([^<]+)<\/h3>[\s\S]{0,300}?<p>([^<]+)<\/p>/g)];
  let boardChair = null, ceo = null;
  for (const [, name, title] of members) {
    const t = title.trim();
    if (!boardChair && t === "Chair") boardChair = name.trim();
    if (!ceo && t === "Chief Executive Officer") ceo = name.trim();
    if (boardChair && ceo) break;
  }
  return { boardChair, ceo };
}

async function scrapeOresund() {
  const html = await fetchWithTimeout("https://www.oresund.se/bolagsstyrning/styrelse/");
  // Pattern: <strong>Name</strong> <em>Ordförande.</em>
  const chairMatch = html.match(/<strong>([^<]+)<\/strong>\s*<em>Ordf[öo]rande[^<]*<\/em>/i);
  const boardChair = chairMatch ? chairMatch[1].trim() : null;

  // VD from team page
  let ceo = null;
  try {
    const teamHtml = await fetchWithTimeout("https://www.oresund.se/om-oresund/vart-team/");
    const ceoMatch = teamHtml.match(/<strong>([^<]+)<\/strong>[^<]*<em>[^<]*[Vv]erkst[äa]llande direkt[öo]r[^<]*<\/em>/i)
      || teamHtml.match(/Verkst[äa]llande direkt[öo]r[\s\S]{0,200}?<strong>([^<]+)<\/strong>/i);
    if (ceoMatch) ceo = (ceoMatch[1] || ceoMatch[1]).trim();
  } catch { /* fall through to fallback */ }

  return { boardChair, ceo };
}

async function scrapeCreades() {
  const html = await fetchWithTimeout(
    "https://www.creades.se/bolagsstyrning/styrelse-ledande-befattningshavare-och-revisor/"
  );
  // Pattern: <strong>Name</strong> ...Styrelseordförande sedan YYYY
  const chairMatch = html.match(/<strong>([^<]+)<\/strong>[^<]*Styrelseordf[öo]rande\s+sedan/i);
  // Pattern: <strong>Name, VD</strong>
  const ceoMatch = html.match(/<strong>([^<,]+),\s*VD<\/strong>/i);
  return {
    boardChair: chairMatch ? chairMatch[1].trim() : null,
    ceo: ceoMatch ? ceoMatch[1].trim() : null,
  };
}

async function scrapeIndustrivarden() {
  // Try styrelse page — may return 404, in which case we fall back
  const html = await fetchWithTimeout("https://www.industrivarden.se/bolagsstyrning/styrelse/");
  // Pattern varies; look for "Ordförande" near a name
  const chairMatch = html.match(/<[^>]+>([^<]{3,50})<\/[^>]+>\s*<[^>]+>[^<]*Ordf[öo]rande[^<]*<\/[^>]+>/i)
    || html.match(/Styrelseordf[öo]rande[\s\S]{0,300}?<[^>]+>([^<]{3,50})<\/[^>]+>/i);
  const ceoMatch = html.match(/Verkst[äa]llande direkt[öo]r[\s\S]{0,300}?<[^>]+>([^<]{3,50})<\/[^>]+>/i);
  return {
    boardChair: chairMatch ? chairMatch[1].trim() : null,
    ceo: ceoMatch ? ceoMatch[1].trim() : null,
  };
}

// Scrapers map — companies not listed here use only fallback
const SCRAPERS = {
  investor:       scrapeInvestor,
  oresund:        scrapeOresund,
  creades:        scrapeCreades,
  industrivarden: scrapeIndustrivarden,
};

async function getLeadership(id) {
  const fallback = FALLBACK[id] ?? { ceo: null, boardChair: null };
  const scraper = SCRAPERS[id];

  if (!scraper) {
    return { id, ...fallback, source: "fallback", fetchedAt: new Date().toISOString() };
  }

  try {
    const scraped = await scraper();
    const ceo = scraped.ceo || fallback.ceo;
    const boardChair = scraped.boardChair || fallback.boardChair;
    const source = (scraped.ceo || scraped.boardChair) ? "live" : "fallback";
    return { id, ceo, boardChair, source, fetchedAt: new Date().toISOString() };
  } catch {
    return { id, ...fallback, source: "fallback", fetchedAt: new Date().toISOString() };
  }
}

const VALID_IDS = new Set(Object.keys(FALLBACK));

import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (rateLimit(req, res, 30)) return;
  res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");

  const { id, all } = req.query;

  if (all === "true") {
    const results = await Promise.allSettled(
      [...VALID_IDS].map((companyId) => getLeadership(companyId))
    );
    const data = results.map((r) =>
      r.status === "fulfilled" ? r.value : { id: "unknown", source: "error" }
    );
    return res.status(200).json(data);
  }

  if (!id || !VALID_IDS.has(id)) {
    return res.status(400).json({
      error: "Invalid or missing id. Valid ids: " + [...VALID_IDS].join(", "),
    });
  }

  const data = await getLeadership(id);
  res.status(200).json(data);
}
