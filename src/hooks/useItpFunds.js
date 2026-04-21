import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

// Module-level cache per provider key — funds rarely change (scraped weekly).
const cache = new Map();

/**
 * Slugify a provider display name to match the provider_key column in itp_funds.
 * "SPP" -> "spp", "Länsförsäkringar" -> "lansforsakringar",
 * "Nordea Pension" -> "nordea-pension".
 */
export function providerToKey(name) {
  if (!name) return null;
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the ITP fund list for a given provider, sourced from Supabase.
 * Pass null/undefined to disable (returns empty list, no fetch).
 */
export function useItpFunds(providerName) {
  const key = providerToKey(providerName);
  const [funds, setFunds] = useState(key ? cache.get(key) || [] : []);
  const [loading, setLoading] = useState(!!key && !cache.has(key));

  useEffect(() => {
    if (!key) {
      setFunds([]);
      setLoading(false);
      return;
    }
    if (cache.has(key)) {
      setFunds(cache.get(key));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("itp_funds")
        .select("isin, sec_id, name, advisor, ongoing_charge, management_fee, currency, star_rating")
        .eq("provider_key", key)
        .order("name");
      if (cancelled) return;
      if (error) {
        console.warn("[useItpFunds] fetch error", error);
        setFunds([]);
      } else {
        cache.set(key, data || []);
        setFunds(data || []);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [key]);

  return { funds, loading, providerKey: key };
}
