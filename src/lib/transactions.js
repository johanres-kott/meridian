import { supabase } from "../supabase.js";

// Transaktionsmodell för portföljen (migrations/2026-08-20_transactions.sql):
// köp/sälj per ticker lagras i public.transactions och innehavet (antal + GAV)
// räknas fram med genomsnittsmetoden — svensk skattestandard. Resultatet
// skrivs tillbaka till watchlist-raden (shares + gav, i instrumentets valuta)
// så att resten av appen kan läsa watchlist precis som idag.

// Flyttalsstädning: 3 − 3×(0.1+0.2) ska bli 0, inte 1e-16 aktier.
const EPS = 1e-9;

/**
 * Genomsnittsmetoden över en lista transaktioner
 * ({ side, shares, price, fee, trade_date, created_at }).
 *
 * - Köp: nytt GAV = (gammalt antal × gammalt GAV + antal × pris + courtage) / nytt antal.
 *   Courtaget räknas alltså in i omkostnadsbeloppet.
 * - Sälj: antalet minskar men GAV är oförändrat. Realiserat resultat
 *   += antal × (pris − GAV) − courtage.
 * - Sälj av fler än innehavet klampas till innehavet (aldrig negativt antal)
 *   och ger en post i `warnings`.
 *
 * Returnerar { shares, gav (null när shares är 0), realizedPL, warnings }.
 */
export function computeHolding(transactions = []) {
  const sorted = [...transactions].sort((a, b) => {
    const byDate = String(a.trade_date || "").localeCompare(String(b.trade_date || ""));
    if (byDate !== 0) return byDate;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });

  let shares = 0;
  let cost = 0; // totalt omkostnadsbelopp (GAV = cost / shares)
  let realizedPL = 0;
  const warnings = [];

  for (const t of sorted) {
    const qty = Number(t.shares) || 0;
    const price = Number(t.price) || 0;
    const fee = Number(t.fee) || 0;

    if (t.side === "buy") {
      cost += qty * price + fee;
      shares += qty;
    } else if (t.side === "sell") {
      let sellQty = qty;
      if (sellQty > shares + EPS) {
        warnings.push(
          `Sälj ${t.trade_date || ""}: ${qty} st överstiger innehavet (${shares} st) — antalet har klampats.`.trim()
        );
        sellQty = shares;
      }
      const gav = shares > EPS ? cost / shares : 0;
      realizedPL += sellQty * (price - gav) - fee;
      cost -= sellQty * gav;
      shares -= sellQty;
    }

    if (shares <= EPS) {
      shares = 0;
      cost = 0;
    }
  }

  return {
    shares,
    gav: shares > 0 ? cost / shares : null,
    realizedPL,
    warnings,
  };
}

// Vad som ska skrivas tillbaka till watchlist-raden. Sälj ner till 0 ger
// null/null — raden ligger kvar som ren bevakning, precis som idag.
export function holdingToWatchlistUpdates(holding) {
  if (!holding || !(holding.shares > 0)) return { shares: null, gav: null };
  return { shares: holding.shares, gav: holding.gav };
}

// Migrationen är inte körd i Supabase-projektet: PostgREST svarar med
// Postgres-koden 42P01 ("relation ... does not exist") eller PGRST205
// ("Could not find the table ... in the schema cache"). Låter UI:t visa en
// hjälpsam hint i stället för att krascha.
export function isMissingTableError(err) {
  if (!err) return false;
  if (err.code === "42P01" || err.code === "PGRST205") return true;
  const msg = String(err.message || "");
  return /relation .* does not exist/i.test(msg) || /could not find the table/i.test(msg);
}

export async function listTransactions(userId, ticker) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("ticker", ticker)
    .order("trade_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addTransaction(row) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
