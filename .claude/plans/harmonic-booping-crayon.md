# Portföljgrupper + Nyckeltal-sida (ersätter Gap Analysis)

## Context
Gap Analysis-sidan visar hårdkodade Cevian-bolag med manuellt inmatade peer-medianer — en demo som inte är kopplad till användarens data. Ersätts med en nyckeltalstabell för användarens egna bolag.

Dessutom vill användaren kunna gruppera aktier i "fonder" — t.ex. "Johan Resare Aktiefond" (egna innehav), "Cevian", "Öresund" osv. En aktie ska kunna tillhöra flera grupper.

## Del 1: Portföljgrupper

### Databasschema
Ny tabell `portfolio_groups`:
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `name` (text) — t.ex. "Min portfölj", "Cevian"
- `created_at` (timestamptz)

Ny tabell `group_members` (many-to-many):
- `id` (uuid, PK)
- `group_id` (uuid, FK → portfolio_groups)
- `watchlist_id` (uuid, FK → watchlist)
- `created_at` (timestamptz)
- UNIQUE(group_id, watchlist_id)

RLS-policies: användare kan bara se/ändra sina egna grupper (via `portfolio_groups.user_id`).

### UI i Portfolio.jsx
- Ovanför tabellen: horisontell lista med grupper som filterknappar ("Alla" | "Min portfölj" | "Cevian" | "+")
- "+" skapar ny grupp (inline input)
- Klick på grupp filtrerar tabellen
- På varje bolagsrad: möjlighet att tagga/avtagga grupper (liten dropdown eller chips)
- Grupper kan tas bort (med bekräftelse)

### Filer
- **Supabase migration**: Kör via `supabase.rpc()` eller direkt SQL i Supabase Dashboard (instruktioner i plan)
- `src/components/Portfolio.jsx` — grupperingsfilter + tag-UI
- Ev. ny `src/lib/groups.js` för CRUD-operationer mot Supabase

## Del 2: Nyckeltal-sida (ersätter Gap Analysis)

### Vad den visar
Tabell med alla bolag i användarens watchlist (eller filtrerat per grupp), med nyckeltal från `/api/company`:
- Bolagsnamn + ticker
- Kurs + daglig förändring
- P/E Forward, P/E Trailing
- EBITDA-marginal, rörelsemarginal, bruttomarginal
- Tillväxt (revenue growth)
- ROIC/ROE
- Nettoskuld/EBITDA

Sorterbara kolumner (klicka header → toggla asc/desc).

### Filer
- `src/components/GapAnalysis.jsx` — skrivs om helt till `Nyckeltal`-vy
- `src/components/shared.js` — ta bort `PORTFOLIO` (används inte längre)
- `src/App.jsx` — ändra tab-label från "Gap Analysis" till "Nyckeltal"

## Ordning
1. Skapa DB-tabeller (ger instruktioner för Supabase SQL Editor)
2. Bygg nyckeltal-sidan (enklare, standalone)
3. Bygg portföljgrupper i Portfolio.jsx

## Verifiering
1. Nyckeltal-fliken visar nyckeltal för alla bolag i watchlisten
2. Skapa grupp "Min portfölj", tagga bolag, filtrera → bara de visas
3. Samma bolag kan vara i flera grupper
4. Nyckeltal-sidan kan också filtreras per grupp
