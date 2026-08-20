-- Transaktionsmodell för aktie/fond-portföljen: köp och sälj per ticker med
-- datum, antal, pris per aktie (i instrumentets valuta) och courtage.
-- Innehavet (antal + GAV enligt genomsnittsmetoden) räknas fram ur
-- transaktionerna i klienten och skrivs tillbaka till watchlist-raden,
-- så att resten av appen (portföljvärde, P&L, Min ekonomi) läser watchlist
-- precis som idag.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  side text not null check (side in ('buy', 'sell')),
  shares numeric not null check (shares > 0),
  price numeric not null check (price >= 0),
  fee numeric,
  trade_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_ticker_date_idx
  on public.transactions (user_id, ticker, trade_date);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);
