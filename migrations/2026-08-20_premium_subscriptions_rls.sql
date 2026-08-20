-- RLS för premium_subscriptions (säkerhetsgranskning 2026-08-20).
--
-- Tabellen skapades direkt i Supabase (utanför migrations-mappen) och har
-- legat utan row level security — den här migrationen låser den. Klienter
-- får bara LÄSA sin egen rad; alla skrivningar (Stripe-webhook, cache-synk
-- i /api/premium-status) sker med service role, som går förbi RLS. Därför
-- finns medvetet INGA insert/update/delete-policies.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

alter table if exists public.premium_subscriptions enable row level security;

drop policy if exists "premium_subscriptions_select_own" on public.premium_subscriptions;
create policy "premium_subscriptions_select_own" on public.premium_subscriptions
  for select using (auth.uid() = user_id);
