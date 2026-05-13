-- Thesis review feature: track investment thesis text, status, and last review date
-- per watchlist holding. Powers the "Tesgranskning" tab that helps users escape
-- the disposition effect (selling winners too early, holding losers too long).
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

alter table public.watchlist
  add column if not exists thesis_text text,
  add column if not exists thesis_status text,
  add column if not exists thesis_reviewed_at timestamptz;

-- Only valid status values. Null means "no thesis recorded yet".
alter table public.watchlist
  drop constraint if exists watchlist_thesis_status_check;

alter table public.watchlist
  add constraint watchlist_thesis_status_check
  check (thesis_status is null or thesis_status in ('active', 'weakening', 'broken'));

-- Useful for sorting "needs review" rows on the server side later if we add an API.
create index if not exists watchlist_thesis_reviewed_at_idx
  on public.watchlist (thesis_reviewed_at);
