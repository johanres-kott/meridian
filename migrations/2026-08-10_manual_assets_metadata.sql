-- Metadata för manuella tillgångar (PIVOT.md fas 3, bostads-wizarden):
-- bostadstyp, adress, boyta, köpeskilling, pantbrev, långivare, ränta m.m.
-- lagras som jsonb så wizarden kan växa utan nya kolumner. Bolån skapas som
-- egen is_debt-rad och länkas via metadata.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

alter table public.manual_assets
  add column if not exists metadata jsonb not null default '{}'::jsonb;
