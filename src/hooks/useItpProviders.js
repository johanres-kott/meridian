import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

let cache = null;

export function useItpProviders() {
  const [providers, setProviders] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    async function load() {
      const { data } = await supabase
        .from("itp_providers")
        .select("*")
        .order("sort_order");
      if (data) {
        cache = data;
        setProviders(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { providers, loading };
}
