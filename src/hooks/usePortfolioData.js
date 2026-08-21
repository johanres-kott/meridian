import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import { INDEXES, rangeCutoff } from "../lib/portfolioChartConstants.js";

// Historikhämtningen (portfölj- + nettoförmögenhetssnapshots + index) cachas
// per användare i 5 min — samma promise-cache-mönster med TTL som
// portfolioValue — så flikbyten inte refetchar allt. invalidateValuation i
// portfolioValue nollställer även denna cache efter skrivningar.

const TTL_MS = 5 * 60 * 1000;
let histCache = { userId: null, at: 0, promise: null };

export function invalidatePortfolioHistory() {
  histCache = { userId: null, at: 0, promise: null };
}

function getPortfolioHistory(userId) {
  const now = Date.now();
  if (histCache.promise && histCache.userId === userId && now - histCache.at < TTL_MS) {
    return histCache.promise;
  }
  const promise = fetchHistory();
  histCache = { userId, at: now, promise };
  promise.catch(() => {
    if (histCache.promise === promise) histCache = { userId: null, at: 0, promise: null };
  });
  return promise;
}

async function fetchHistory() {
  // Fetch portfolio + net worth history + all indexes in parallel
  const [[portfolioData, netWorthData], ...indexResults] = await Promise.all([
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      const headers = s?.access_token ? { Authorization: `Bearer ${s.access_token}` } : {};
      return Promise.all([
        fetch("/api/portfolio-history", { headers }).then(r => r.ok ? r.json() : null),
        fetch("/api/net-worth-history", { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
    }),
    ...INDEXES.map(idx =>
      fetch(`/api/chart?ticker=${encodeURIComponent(idx.ticker)}&range=1y`).then(r => r.ok ? r.json() : null).catch(() => null)
    ),
  ]);
  return { portfolioData, netWorthData, indexResults };
}

/**
 * Custom hook that fetches portfolio history and index comparison data,
 * and provides filtered/normalized points based on the selected range.
 */
export default function usePortfolioData(userId, range) {
  // Ett enda resultatobjekt taggat med userId — loading/error deriveras i
  // stället för att sättas synkront i effekten (react-hooks/set-state-in-effect).
  const [hist, setHist] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPortfolioHistory(userId)
      .then(res => { if (!cancelled) setHist({ userId, ...res }); })
      .catch(() => { if (!cancelled) setHist({ userId, failed: true }); });
    return () => { cancelled = true; };
  }, [userId]);

  const loading = !hist || hist.userId !== userId;
  const error = !loading && !!hist.failed;

  const { allPoints, netWorthPoints, indexDataMap } = useMemo(() => {
    if (loading || hist.failed) return { allPoints: [], netWorthPoints: [], indexDataMap: {} };
    const { portfolioData, netWorthData, indexResults } = hist;

    const nwPts = (netWorthData?.snapshots || []).map(p => ({ date: p.date, value: p.value }));

    // Portfolio
    const raw = portfolioData?.snapshots || portfolioData?.points || portfolioData || [];
    // Inget holdingsCount-tröskelfilter längre: det var en heuristik för att
    // dölja halv-prissatta snapshots, men gömde även legitima dagar när
    // portföljen bantats (färre innehav ≠ dålig data) — grafen "slutade" då
    // veckor bakåt i tiden. Källan är fixad i scraperns snapshot-cron
    // (oprissatta innehav ⇒ ingen snapshot alls), och gamla giftrader städas
    // i databasen i stället för att maskeras här.
    const pts = raw
      .map(p => ({
        date: p.date,
        value: p.totalValue ?? p.value ?? 0,
        estimated: !!p.estimated,
      }));

    // Build index data maps
    const idxMap = {};
    INDEXES.forEach((idx, i) => {
      const data = indexResults[i];
      if (data?.points) {
        const map = {};
        data.points.forEach(p => { map[p.date] = p.close; });
        idxMap[idx.id] = map;
      }
    });

    return { allPoints: pts, netWorthPoints: nwPts, indexDataMap: idxMap };
  }, [hist, loading]);

  const points = useMemo(() => {
    if (allPoints.length === 0) return [];
    const cutoffStr = rangeCutoff(range);
    const filtered = cutoffStr ? allPoints.filter(p => p.date >= cutoffStr) : allPoints;
    if (filtered.length === 0) return [];

    // Normalize to % change from first point
    const firstVal = filtered[0].value;
    const firstDate = filtered[0].date;

    // Get first values for each index
    const firstIndexVals = {};
    INDEXES.forEach(idx => {
      const data = indexDataMap[idx.id];
      if (data) firstIndexVals[idx.id] = data[firstDate];
    });

    return filtered.map(p => {
      const portfolioPct = firstVal > 0 ? ((p.value - firstVal) / firstVal) * 100 : 0;
      const point = { ...p, portfolioPct };

      // Add each index's % change
      INDEXES.forEach(idx => {
        const data = indexDataMap[idx.id];
        const firstIdx = firstIndexVals[idx.id];
        const close = data?.[p.date];
        point[`${idx.id}Pct`] = (firstIdx && close) ? ((close - firstIdx) / firstIdx) * 100 : null;
      });

      return point;
    });
  }, [allPoints, range, indexDataMap]);

  return { points, netWorthPoints, indexDataMap, loading, error };
}
