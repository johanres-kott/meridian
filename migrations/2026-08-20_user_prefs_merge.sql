-- Atomisk merge av preferences (säkerhetsgranskning 2026-08-20).
--
-- /api/user-prefs gjorde read → merge → write i tre steg, vilket kan tappa
-- skrivningar när två anrop kapplöper (sista skrivningen vinner med gammal
-- läsning). Den här funktionen gör mergen i EN sats i databasen i stället.
--
-- security invoker: funktionen körs med anroparens rättigheter, så RLS på
-- user_prefs gäller precis som vid direkta skrivningar. auth.uid() pekar på
-- den inloggade användaren — anonyma anrop träffar/skapar ingen rad.
-- user_id är primärnyckel i user_prefs (klienten upsert:ar på den), så
-- on conflict (user_id) täcker även fallet att raden inte finns ännu.
--
-- Run this against Supabase via SQL editor. Safe to run multiple times.

create or replace function public.merge_preferences(p_patch jsonb)
returns jsonb
language sql
security invoker
as $$
  insert into public.user_prefs (user_id, preferences)
  values (auth.uid(), p_patch)
  on conflict (user_id) do update
    set preferences = coalesce(public.user_prefs.preferences, '{}'::jsonb) || p_patch
  returning preferences;
$$;
