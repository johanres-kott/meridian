import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

export function usePremium() {
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/premium-status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setPremium(data.premium === true);
      } catch {
        // Fail open — don't block on errors
      }
      setLoading(false);
    }
    check();
  }, []);

  async function startCheckout() {
    setError(null);
    setCheckoutLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Du måste vara inloggad");
        setCheckoutLoading(false);
        return;
      }

      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Kunde inte starta betalning");
        setCheckoutLoading(false);
      }
    } catch (err) {
      setError("Nätverksfel — försök igen");
      setCheckoutLoading(false);
    }
  }

  return { premium, loading, checkoutLoading, error, startCheckout };
}
