-- Manual assets & debts for the holistic net-worth view (PIVOT.md fas 3):
-- bostad, sparkonto, buffert, bolån m.m. som användaren matar in själv.
-- Powers the "Min ekonomi" card on the overview tab.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

create table if not exists public.manual_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  label text not null,
  value_sek numeric not null,
  is_debt boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.manual_assets
  drop constraint if exists manual_assets_kind_check;

alter table public.manual_assets
  add constraint manual_assets_kind_check
  check (kind in ('bostad', 'fordon', 'sparkonto', 'buffert', 'ovrigt', 'bolan', 'skuld'));

alter table public.manual_assets
  drop constraint if exists manual_assets_value_check;

alter table public.manual_assets
  add constraint manual_assets_value_check
  check (value_sek >= 0);

create index if not exists manual_assets_user_idx
  on public.manual_assets (user_id);

alter table public.manual_assets enable row level security;

drop policy if exists "manual_assets_select_own" on public.manual_assets;
create policy "manual_assets_select_own" on public.manual_assets
  for select using (auth.uid() = user_id);

drop policy if exists "manual_assets_insert_own" on public.manual_assets;
create policy "manual_assets_insert_own" on public.manual_assets
  for insert with check (auth.uid() = user_id);

drop policy if exists "manual_assets_update_own" on public.manual_assets;
create policy "manual_assets_update_own" on public.manual_assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manual_assets_delete_own" on public.manual_assets;
create policy "manual_assets_delete_own" on public.manual_assets
  for delete using (auth.uid() = user_id);
