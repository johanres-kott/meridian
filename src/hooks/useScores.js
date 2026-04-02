import { useState, useEffect } from "react";

// Module-level cache — shared across all hook instances
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedScores = null;
let cachedAt = 0;
let loadingPromise = null;

/**
 * Hook to load and cache all scoring data from /api/suggestions.
 * Returns a map of ticker (uppercase) → score data.
 * The data is fetched once and cached at module level.
 */
export function useScores() {
  const [scores, setScores] = useState(cachedScores || {});
  const [loading, setLoading] = useState(!cachedScores);

  useEffect(() => {
    if (cachedScores && (Date.now() - cachedAt < CACHE_TTL_MS)) {
      setScores(cachedScores);
      setLoading(false);
      return;
    }

    if (!loadingPromise) {
      loadingPromise = fetch("/api/suggestions?limit=300")
        .then(r => r.json())
        .then(data => {
          const list = data?.suggestions || (Array.isArray(data) ? data : []);
          const map = {};
          list.forEach(s => { map[s.ticker?.toUpperCase()] = s; });
          cachedScores = map;
          cachedAt = Date.now();
          return map;
        })
        .catch(() => {
          cachedScores = {};
          return {};
        });
    }

    loadingPromise.then(map => {
      setScores(map);
      setLoading(false);
    });
  }, []);

  return { scores, loading };
}

/**
 * Invalidate the cache (e.g. after adding new stocks).
 */
export function invalidateScores() {
  cachedScores = null;
  loadingPromise = null;
}
