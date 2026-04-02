import { useState, useEffect } from "react";

/**
 * Shared hook that fetches FX rates from /api/commodities and parses USD/SEK, EUR/SEK, GBP/SEK.
 * Returns { fxRates: { SEK: 1, USD: x, EUR: x, GBP: x }, loading: boolean }
 *
 * Replaces duplicated FX parsing in Portfolio.jsx, PortfolioSummary.jsx, and App.jsx.
 */
const DEFAULT_RATES = { SEK: 1 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Module-level cache so multiple components share the same data
let cachedRates = null;
let cachedAt = 0;
let fetchPromise = null;

async function fetchRates() {
  if (cachedRates && (Date.now() - cachedAt < CACHE_TTL_MS)) return cachedRates;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/commodities")
    .then(r => r.json())
    .then(data => {
      const rates = { SEK: 1 };
      for (const c of data) {
        if (c.display === "USD/SEK" && c.price > 0) rates.USD = c.price;
        if (c.display === "EUR/SEK" && c.price > 0) rates.EUR = c.price;
        if (c.display === "GBP/SEK" && c.price > 0) rates.GBP = c.price;
      }
      cachedRates = rates;
      cachedAt = Date.now();
      fetchPromise = null;
      return rates;
    })
    .catch(() => {
      fetchPromise = null;
      return DEFAULT_RATES;
    });

  return fetchPromise;
}

export function useFxRates() {
  const [fxRates, setFxRates] = useState(cachedRates || DEFAULT_RATES);
  const [loading, setLoading] = useState(!cachedRates);

  useEffect(() => {
    let cancelled = false;
    fetchRates().then(rates => {
      if (!cancelled) {
        setFxRates(rates);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { fxRates, loading };
}

/**
 * Utility function for non-hook contexts (e.g., App.jsx loadContext).
 * Returns a promise that resolves to FX rates.
 */
export { fetchRates as getFxRates };

/**
 * Parse FX rates from an already-fetched commodities array.
 * Useful when commodities data is already available.
 */
export function parseFxRates(commoditiesData) {
  const rates = { SEK: 1 };
  for (const c of (commoditiesData || [])) {
    if (c.display === "USD/SEK" && c.price > 0) rates.USD = c.price;
    if (c.display === "EUR/SEK" && c.price > 0) rates.EUR = c.price;
    if (c.display === "GBP/SEK" && c.price > 0) rates.GBP = c.price;
  }
  return rates;
}
