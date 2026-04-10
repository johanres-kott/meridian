/**
 * Shared API client functions for frontend components.
 * Centralizes fetch patterns to avoid duplication.
 */

/**
 * Fetch company data (price, change, currency, etc.) for a given ticker.
 * Returns null on error or if ticker is invalid.
 */
export async function fetchCompany(ticker) {
  if (!ticker || ticker.includes("=") || ticker.length < 2) return null;
  try {
    const res = await fetch(`/api/company?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`fetchCompany failed for ${ticker}:`, err);
    return null;
  }
}

/**
 * Search for stocks by query string.
 * Returns an array of results (filtered to Common Stock type).
 */
export async function searchStocks(query, limit = 6) {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.result || data.results || data || [])
      .filter(r => r.type === "Common Stock" || !r.type)
      .slice(0, limit);
  } catch (err) {
    console.error(`searchStocks failed for "${query}":`, err);
    return [];
  }
}

/**
 * Search for funds by query string via Morningstar.
 * Returns an array of fund results.
 */
export async function searchFunds(query, limit = 8) {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`/api/fund-search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, limit);
  } catch (err) {
    console.error(`searchFunds failed for "${query}":`, err);
    return [];
  }
}

/**
 * Fetch fund data (NAV, returns, rating, fees) for a Morningstar SecId.
 * Returns null on error.
 */
export async function fetchFund(secId) {
  if (!secId) return null;
  try {
    const res = await fetch(`/api/fund?secId=${encodeURIComponent(secId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`fetchFund failed for ${secId}:`, err);
    return null;
  }
}
