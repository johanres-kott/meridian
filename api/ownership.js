import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";
import { getSupabase } from "./_supabase.js";

const UA = "Mozilla/5.0";

// --- Supabase source (curated Swedish ownership data) ---

async function getSupabaseOwnership(ticker) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("stock_ownership")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .order("pct_capital", { ascending: false });

    if (error || !data || data.length === 0) return null;

    const topHolders = data.map(row => ({
      name: row.holder_name,
      pctHeld: row.pct_capital,
      pctVotes: row.pct_votes ?? null,
      shares: row.shares ?? 0,
      type: row.holder_type ?? "institution",
    }));

    // Calculate aggregates from the data
    const totalPct = topHolders.reduce((s, h) => s + h.pctHeld, 0);
    const insiderRows = topHolders.filter(h => h.type === "insider");
    const insidersPercent = insiderRows.reduce((s, h) => s + h.pctHeld, 0);
    const institutionalRows = topHolders.filter(h => h.type !== "insider" && h.type !== "retail");
    const institutionsPercent = institutionalRows.reduce((s, h) => s + h.pctHeld, 0);
    const retailPercent = Math.max(0, parseFloat((100 - totalPct).toFixed(2)));

    return {
      source: "curated",
      insidersPercent: insidersPercent > 0 ? insidersPercent : null,
      institutionsPercent: institutionsPercent > 0 ? institutionsPercent : null,
      institutionsCount: institutionalRows.length,
      retailPercent,
      otherInstitutionalPercent: 0,
      topHolders: topHolders.filter(h => h.type !== "insider"),
      lastUpdated: data[0]?.updated_at ?? null,
    };
  } catch {
    return null;
  }
}

// --- Yahoo Finance source ---

// Cache crumb for 5 minutes (per serverless instance)
let crumbCache = { data: null, expires: 0 };

async function getYahooCrumb() {
  if (crumbCache.data && Date.now() < crumbCache.expires) return crumbCache.data;
  try {
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    const cookies = cookieRes.headers.get("set-cookie") ?? "";
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, "Cookie": cookies },
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.length < 3) return null;
    const result = { crumb, cookies };
    crumbCache = { data: result, expires: Date.now() + 5 * 60 * 1000 };
    return result;
  } catch {
    return null;
  }
}

async function getYahooOwnership(ticker, crumbData) {
  if (!crumbData) return null;
  try {
    const { crumb, cookies } = crumbData;
    const modules = "majorHoldersBreakdown,institutionOwnership,fundOwnership";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Referer": "https://finance.yahoo.com", "Cookie": cookies },
    });
    const data = await r.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;

    const breakdown = result.majorHoldersBreakdown ?? {};
    const institutions = result.institutionOwnership?.ownershipList ?? [];
    const funds = result.fundOwnership?.ownershipList ?? [];

    const insidersPercent = breakdown.insidersPercentHeld?.raw
      ? parseFloat((breakdown.insidersPercentHeld.raw * 100).toFixed(2))
      : null;
    const institutionsPercent = breakdown.institutionsPercentHeld?.raw
      ? parseFloat((breakdown.institutionsPercentHeld.raw * 100).toFixed(2))
      : null;
    const institutionsCount = breakdown.institutionsCount?.raw ?? null;

    // Merge institutions and funds, dedup by name
    const holderMap = new Map();

    institutions.forEach(h => {
      const name = h.organization ?? "Unknown";
      const pct = h.pctHeld?.raw ? parseFloat((h.pctHeld.raw * 100).toFixed(2)) : 0;
      if (pct > 0) {
        holderMap.set(name, {
          name, shares: h.position?.raw ?? 0, pctHeld: pct,
          value: h.value?.raw ?? 0, type: "institution",
        });
      }
    });

    funds.forEach(h => {
      const name = h.organization ?? "Unknown";
      const pct = h.pctHeld?.raw ? parseFloat((h.pctHeld.raw * 100).toFixed(2)) : 0;
      if (pct > 0 && !holderMap.has(name)) {
        holderMap.set(name, {
          name, shares: h.position?.raw ?? 0, pctHeld: pct,
          value: h.value?.raw ?? 0, type: "fund",
        });
      }
    });

    const topHolders = [...holderMap.values()]
      .sort((a, b) => b.pctHeld - a.pctHeld)
      .slice(0, 10);

    const topHoldersPct = topHolders.reduce((sum, h) => sum + h.pctHeld, 0);
    const otherInstitutionalPct = institutionsPercent != null
      ? Math.max(0, parseFloat((institutionsPercent - topHoldersPct).toFixed(2)))
      : 0;
    const retailPct = (insidersPercent != null && institutionsPercent != null)
      ? Math.max(0, parseFloat((100 - insidersPercent - institutionsPercent).toFixed(2)))
      : null;

    return {
      source: "yahoo",
      insidersPercent,
      institutionsPercent,
      institutionsCount,
      retailPercent: retailPct,
      otherInstitutionalPercent: otherInstitutionalPct,
      topHolders,
    };
  } catch (err) {
    console.error("getYahooOwnership error:", err);
    return null;
  }
}

// --- Handler ---

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 100)) return;
  res.setHeader("Cache-Control", "s-maxage=3600");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });
  if (!/^[A-Za-z0-9.\-^%]+$/.test(ticker)) return res.status(400).json({ error: "invalid ticker format" });

  try {
    // For Swedish stocks: try curated Supabase data first
    const isSwedish = ticker.toUpperCase().endsWith(".ST");
    let ownership = null;

    if (isSwedish) {
      ownership = await getSupabaseOwnership(ticker);
    }

    // Fallback (or primary for non-Swedish): Yahoo Finance
    if (!ownership) {
      const crumbData = await getYahooCrumb();
      ownership = await getYahooOwnership(ticker, crumbData);
    }

    if (!ownership) {
      return res.status(404).json({ error: `Ingen ägardata hittades för ${ticker}` });
    }

    res.status(200).json({ ticker, ...ownership });
  } catch (err) {
    console.error("Ownership error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
