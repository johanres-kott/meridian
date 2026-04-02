import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import { RANGES, INDEXES } from "../lib/portfolioChartConstants.js";

/**
 * Custom hook that fetches portfolio history and index comparison data,
 * and provides filtered/normalized points based on the selected range.
 */
export default function usePortfolioData(userId, range) {
  const [allPoints, setAllPoints] = useState([]);
  const [indexDataMap, setIndexDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(false);

    // Fetch portfolio + all indexes in parallel
    Promise.all([
      supabase.auth.getSession().then(({ data: { session: s } }) =>
        fetch("/api/portfolio-history", {
          headers: s?.access_token ? { Authorization: `Bearer ${s.access_token}` } : {},
        }).then(r => r.ok ? r.json() : null)
      ),
      ...INDEXES.map(idx =>
        fetch(`/api/chart?ticker=${encodeURIComponent(idx.ticker)}&range=1y`).then(r => r.ok ? r.json() : null).catch(() => null)
      ),
    ]).then(([portfolioData, ...indexResults]) => {
      // Portfolio
      const raw = portfolioData?.snapshots || portfolioData?.points || portfolioData || [];
      const maxHoldings = Math.max(...raw.map(p => p.holdingsCount || 0), 1);
      const threshold = maxHoldings * 0.5;
      const pts = raw
        .filter(p => (p.holdingsCount || 0) >= threshold)
        .map(p => ({
          date: p.date,
          value: p.totalValue ?? p.value ?? 0,
          estimated: !!p.estimated,
        }));
      setAllPoints(pts);

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
      setIndexDataMap(idxMap);

      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [userId]);

  const points = useMemo(() => {
    if (allPoints.length === 0) return [];
    const rangeDef = RANGES.find(r => r.id === range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (rangeDef?.days || 90));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = allPoints.filter(p => p.date >= cutoffStr);
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

  return { points, indexDataMap, loading, error };
}
