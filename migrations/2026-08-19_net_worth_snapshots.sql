-- Daglig nettoförmögenhets-snapshot per användare (DESIGN.md): portfölj +
-- pension + manuella tillgångar − skulder. Skrivs av /api/cron/net-worth-snapshot
-- (Vercel cron, service role) och läses av klienten (RLS: egna rader).
-- Ger Hem/Portfölj-grafen äkta historik för hela ekonomin i stället för att
-- platta pension/bostad bakåt.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

create table if not exists public.net_worth_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  net_worth_sek numeric not null,
  portfolio_sek numeric,
  pension_sek numeric,
  assets_sek numeric not null default 0,
  debts_sek numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index if not exists net_worth_snapshots_user_date_idx
  on public.net_worth_snapshots (user_id, snapshot_date desc);

alter table public.net_worth_snapshots enable row level security;

drop policy if exists "net_worth_snapshots_select_own" on public.net_worth_snapshots;
create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
-- Inga insert/update-policies för användare: endast cron (service role) skriver.
