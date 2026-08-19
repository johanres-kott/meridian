-- Ny tillgångstyp: vinstandelsstiftelse (t.ex. Scania via PRI). Värdet är
-- summan av årgångar; metadata.tranches = [{year, value}], metadata.lockYears.
alter table public.manual_assets
  drop constraint if exists manual_assets_kind_check;
alter table public.manual_assets
  add constraint manual_assets_kind_check
  check (kind in ('bostad', 'fordon', 'sparkonto', 'buffert', 'ovrigt', 'bolan', 'skuld', 'vinstandel'));
