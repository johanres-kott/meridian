import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import { getPensionTotalValue } from "../lib/pension.js";
import { getPortfolioValuation } from "../lib/portfolioValue.js";
import { effectiveValueSek } from "../lib/manualAssets.js";

// Delad nettoförmögenhet: portfölj (via cachad värdering) + pension (ITP i
// preferences) + manuella tillgångar − skulder (manual_assets). Används av
// HomeHero och NetWorthCard så att båda visar samma siffror utan dubbelhämtning.

export default function useNetWorth() {
  const { userId, preferences } = useUser();
  const [portfolioSek, setPortfolioSek] = useState(null);
  const [dailyChangeSek, setDailyChangeSek] = useState(null);
  const [split, setSplit] = useState({ stocksSek: null, fundsSek: null });
  const [holdingsInfo, setHoldingsInfo] = useState({ holdings: [], priced: [], fxToSek: {} });
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const [manualRows, setManualRows] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPortfolioValuation(userId)
      .then(v => {
        if (cancelled) return;
        setPortfolioSek(v.portfolioSek);
        setDailyChangeSek(v.dailyChangeSek);
        setSplit({ stocksSek: v.stocksSek ?? null, fundsSek: v.fundsSek ?? null });
        setHoldingsInfo({ holdings: v.holdings || [], priced: v.priced || [], fxToSek: v.fxToSek || {} });
        setPortfolioLoaded(true);
      })
      .catch(err => {
        console.error("useNetWorth: valuation failed:", err);
        if (!cancelled) setPortfolioLoaded(true);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const reloadManual = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("manual_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at");
    if (!error) setManualRows(data || []);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.from("manual_assets").select("*").eq("user_id", userId).order("created_at")
      .then(({ data, error }) => { if (!cancelled && !error) setManualRows(data || []); });
    return () => { cancelled = true; };
  }, [userId]);

  const pensionValue = getPensionTotalValue(preferences?.pension);
  const assets = manualRows.filter(r => !r.is_debt);
  const debts = manualRows.filter(r => r.is_debt);
  // Ägarandel (metadata.ownershipShare) räknas in — bara användarens andel
  // av t.ex. en samägd bostad och dess lån påverkar nettoförmögenheten.
  const assetSum = assets.reduce((s, r) => s + effectiveValueSek(r), 0);
  const debtSum = debts.reduce((s, r) => s + effectiveValueSek(r), 0);
  const netWorth = (portfolioSek ?? 0) + (pensionValue ?? 0) + assetSum - debtSum;
  const hasAnything = (portfolioSek != null && portfolioSek > 0) || pensionValue != null || manualRows.length > 0;

  return {
    portfolioSek,
    dailyChangeSek,
    stocksSek: split.stocksSek,
    fundsSek: split.fundsSek,
    holdings: holdingsInfo.holdings,
    priced: holdingsInfo.priced,
    fxToSek: holdingsInfo.fxToSek,
    pensionLabel: preferences?.pension?.itpType || null,
    portfolioLoaded,
    manualRows,
    assets,
    debts,
    assetSum,
    debtSum,
    pensionValue,
    netWorth,
    hasAnything,
    reloadManual,
  };
}
