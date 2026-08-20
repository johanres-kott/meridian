import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { listTransactions, isMissingTableError } from "../lib/transactions.js";

// Har watchlist-raden transaktioner i public.transactions? Då styrs antal/GAV
// av transaktionerna och de manuella fälten låses i redigeringsvyerna.
// Saknas tabellen (migrationen inte körd) svarar hooken lugnt false —
// appen ska aldrig krascha utan migrationen. `setHasTransactions` exponeras
// så att transaktionsvyn kan häva låset när sista transaktionen raderas.
export function useHasTransactions(item) {
  const [hasTransactions, setHasTransactions] = useState(false);

  const userId = item?.user_id;
  const ticker = item?.ticker;

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        let uid = userId;
        if (!uid) {
          const { data: { user } } = await supabase.auth.getUser();
          uid = user?.id;
        }
        if (!uid || !ticker) return;
        const rows = await listTransactions(uid, ticker);
        if (!cancelled) setHasTransactions(rows.length > 0);
      } catch (err) {
        if (!isMissingTableError(err)) console.error(`useHasTransactions: ${ticker}:`, err);
        if (!cancelled) setHasTransactions(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [userId, ticker]);

  return { hasTransactions, setHasTransactions };
}
