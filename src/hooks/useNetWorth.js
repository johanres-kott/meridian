import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import { getPensionTotalValue } from "../lib/pension.js";
import { getPortfolioValuation } from "../lib/portfolioValue.js";
import { effectiveValueSek } from "../lib/manualAssets.js";
import { getMembers, isSharedRow } from "../lib/household.js";

// Delad nettoförmögenhet: portfölj (via cachad värdering) + pension (ITP i
// preferences) + manuella tillgångar − skulder (manual_assets). Används av
// HomeHero och NetWorthCard så att båda visar samma siffror utan dubbelhämtning.

export default function useNetWorth() {
  const { userId, preferences } = useUser();
  const [portfolioSek, setPortfolioSek] = useState(null);
  const [dailyChangeSek, setDailyChangeSek] = useState(null);
  const [split, setSplit] = useState({ stocksSek: null, fundsSek: null });
  const [holdingsInfo, setHoldingsInfo] = useState({ holdings: [], priced: [], fxToSek: {} });
  const [unpricedTickers, setUnpricedTickers] = useState([]);
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
        setUnpricedTickers(v.unpricedTickers || []);
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
  // Hushållsvyn (FAMILY.md): fulla value_sek utan ägarandel. Portfölj och
  // pension är personliga i etapp 1 och ingår lika i båda vyerna.
  const householdAssetSum = assets.reduce((s, r) => s + (Number(r.value_sek) || 0), 0);
  const householdDebtSum = debts.reduce((s, r) => s + (Number(r.value_sek) || 0), 0);
  const householdNetWorth = (portfolioSek ?? 0) + (pensionValue ?? 0) + householdAssetSum - householdDebtSum;
  // Min del/Hushållet-växeln visas bara när det finns familjemedlemmar OCH
  // minst en rad med delad andel — annars är vyerna identiska.
  const hasHouseholdView = getMembers(preferences).length > 1 && manualRows.some(isSharedRow);
  const hasAnything = (portfolioSek != null && portfolioSek > 0) || pensionValue != null || manualRows.length > 0;

  return {
    portfolioSek,
    dailyChangeSek,
    stocksSek: split.stocksSek,
    fundsSek: split.fundsSek,
    holdings: holdingsInfo.holdings,
    priced: holdingsInfo.priced,
    unpricedTickers,
    fxToSek: holdingsInfo.fxToSek,
    pensionLabel: preferences?.pension?.itpType || null,
    portfolioLoaded,
    manualRows,
    assets,
    debts,
    assetSum,
    debtSum,
    householdAssetSum,
    householdDebtSum,
    householdNetWorth,
    hasHouseholdView,
    pensionValue,
    netWorth,
    hasAnything,
    reloadManual,
  };
}
