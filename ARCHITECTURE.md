# Thesion — arkitektur

> Skriven 2026-08-20 genom läsning av koden som den ser ut idag. För
> produktriktningen, se PIVOT.md; för designsystemet DESIGN.md; för
> rådgivningsgränsen COMPLIANCE.md. Repot heter `meridian` (historiskt namn),
> appen heter Thesion (thesion.tech).

## Systemöversikt

Thesion är en svensk privatekonomi-app: nettoförmögenhet först (portfölj +
pension + manuellt inmatade tillgångar − skulder), fond-först-rådgivning i
generisk form, och bolagssidor som "produktsidor". En SPA utan router — all
navigering är React-state i `src/App.jsx`.

```
┌──────────────────────────────┐
│  Webbläsare (React 19 SPA)   │
│  Vite-byggd, ingen router    │
│  i18n sv/en, Sentry          │
└──────┬──────────────┬────────┘
       │ fetch /api/* │ supabase-js (läsningar + transactions/watchlist)
       ▼              ▼
┌─────────────┐  ┌───────────────────────────────┐
│ Vercel       │  │ Supabase                      │
│ serverless   │─▶│  Postgres + RLS               │
│ api/*.js     │  │  Auth (magic link, JWT)       │
│ + api/cron/* │  │  Storage (analys-PDF:er)      │
└──┬───────────┘  └───────────────────────────────┘
   │ proxar mot externa källor:
   ├─ Yahoo Finance ........ kurser, chart, quoteSummary (company/chart/
   │                         quarterly/indices/commodities)
   ├─ Morningstar screener .. fonder (fund, fund-search, fund-top)
   ├─ Finnhub ............... aktiesök, earnings-kalender, bolagsnyheter
   ├─ FMP ................... bolagsprofil + nyckeltal (komplement i company)
   ├─ SCB PXWeb ............. småhusprisindex (property-index)
   ├─ thesion-scraper.vercel.app  eget scraper-projekt (holdings, insider,
   │                         notifications, portfolio-history; fyller även
   │                         portfolio_snapshots + stock_scores i Supabase)
   ├─ Cision/EFN/bolagssajter  press & nyheter för investmentbolag
   ├─ Booli ................. slutpriser (VILANDE — ingen API-nyckel, 501)
   ├─ Stripe ................ premium-prenumeration (VILANDE — UI dolt)
   └─ Anthropic ............. AI-chatt (VILANDE — ChatPanel avmonterad)

Vercel cron ──▶ /api/cron/net-worth-snapshot  (dagligen 05:00 UTC)
           ──▶ /api/cron/amortize-loans       (månadsvis, 1:a kl 06:00 UTC)
```

**Stack:** React 19 + Vite 7, Recharts, lucide-react, i18next, pdfjs-dist
(Avanza-PDF-import), @supabase/supabase-js, @sentry/react. Backend är rena
Vercel-funktioner (Node, ESM) utan ramverk. Test: Vitest + Testing Library
(jsdom) samt Playwright-e2e (`e2e/app.spec.js`).

**Lokal dev:** `vite.config.js` innehåller ett eget `vercelApiPlugin` som
monterar `api/*.js` under `/api/` i Vite-devservern (inkl. body-parsning och
env-bryggning från `.env.local` till `process.env`) så samma handlers körs
lokalt som på Vercel.

## Navigering (App.jsx)

Desktop: sidomeny 220 px + topbar (klocka, Live-prick, notisklocka, "+ Lägg
till"). Mobil: logobanner + horisontell flikrad. Flikarna (interna id:n är
historiska — etiketten i UI:t står efter pilen):

| id | Svensk etikett | Komponent | Innehåll |
|---|---|---|---|
| `markets` | Översikt (Hem) | `Overview.jsx` | Hälsning, TodoList, HomeHero (nettoförmögenhet), PortfolioChart i nettoläge, HomeMovers, NetWorthCard ("Min ekonomi") |
| `portfolio` | Min Portfölj | `Portfolio.jsx` | Graf + AssetBreakdown-donut + AssetTable, underflikar Innehav / Bevakning / Tesgranskning / Pension |
| `goals` | Mål | `GoalsTab.jsx` | Kassaflöde (in/ut/amortering/sparutrymme, Sankey) + sparmål |
| `investment` | Investera | `InvestmentCompanies.jsx` | Underflikar Start (InvestLanding, Din bas, Avgiftskoll) / Toppförslag / Pension / Investmentbolag |
| `analysis` | Analys | `AnalysisTab.jsx` | Nyckeltal (GapAnalysis) / Ägarstruktur (OwnershipOverlay) |
| `commodities` | Marknader | `MarketsView.jsx` | Index per region + råvaror/FX i SI-enheter |
| `search` | Sök | `CompanySearch.jsx` | Fritextsök aktier/fonder med detaljvy |

Dolda vyer (nås via ProfileMenu/deep links, inte i flikraden): profile, docs,
about, security, methodology, terms, privacy. "+ Lägg till" öppnar
`addassets/AddAssetsPage.jsx` — en helsideskatalog (aktier, fonder, bostad,
fordon, sparkonto/buffert, bolån & skulder, pension, vinstandelsstiftelse,
övrigt) med wizards: `BostadWizard`, `FordonWizard`, `VinstandelWizard`.

Bolagsvyn (`CompanyView.jsx`) är delad i **Översikt** (produktsida: om
bolaget, HealthSignal, nyheter, profilmatchning, anteckningar) och
**Detaljer** (kurschart, nyckeltal, kvartal, insider, ägande) — Översikt är
default, enligt PIVOT.md fas 1.

## Datamodell (Supabase Postgres)

Migrationer ligger i `migrations/` och körs **manuellt i Supabase SQL-editorn**
(alla är idempotenta, "safe to run multiple times"). Tabeller som inte har
någon migrationsfil i repot (watchlist, user_prefs, analyses,
premium_subscriptions, portfolio_snapshots, stock_scores, stock_ownership) är
skapade tidigare direkt i Supabase; kolumnerna nedan är härledda ur koden.

### watchlist
En rad per bevakat/ägt instrument och användare. Kärnan i portföljen — resten
av appen läser antal/GAV härifrån.

- `id`, `user_id`, `created_at`
- `ticker`, `name`, `type` (`stock` | `fund` — fondens ticker är Morningstar-SecId)
- `status` ("Bevakar" / "Analyserar" / "Intressant" / "Äger" / "Avstår" — styr
  INTE värderingen; `shares > 0` räknas som innehav oavsett status)
- `shares`, `gav` (i instrumentets valuta; null/null = ren bevakning)
- `notes` (anteckningar på bolagssidan)
- Tesgranskning (`migrations/2026-05-07_thesis_review.sql`): `thesis_text`,
  `thesis_status` (`active` | `weakening` | `broken` | null),
  `thesis_reviewed_at` + index. Logik i `src/lib/thesisReview.js`,
  UI i `ThesisReview.jsx` (fliken Tesgranskning).

Portföljgrupper lagras INTE här utan i `preferences.groups`
(namn + medlems-id:n).

### transactions (`migrations/2026-08-20_transactions.sql`)
Köp/sälj per ticker: `id`, `user_id`, `ticker`, `side` (`buy`|`sell`),
`shares > 0`, `price >= 0` (i instrumentets valuta), `fee` (courtage),
`trade_date`, `created_at`. RLS: egna rader, full CRUD.

Innehavet räknas fram i klienten med **genomsnittsmetoden**
(`src/lib/transactions.js` → `computeHolding`): köp bakar in courtaget i
omkostnadsbeloppet, sälj minskar antalet med oförändrat GAV och ackumulerar
realiserat resultat; översälj klampas till innehavet med varning. Resultatet
skrivs tillbaka till watchlist-radens `shares`/`gav`
(`holdingToWatchlistUpdates`), så resten av appen läser watchlist som förut.
`isMissingTableError` låter UI:t visa en hint om migrationen inte är körd.

### manual_assets (`2026-08-10_manual_assets.sql` + metadata + vinstandel)
Manuellt inmatade tillgångar och skulder ("Min ekonomi", PIVOT.md fas 3):

- `id`, `user_id`, `kind`, `label`, `value_sek >= 0`, `is_debt`, `created_at`
- `kind` ∈ `bostad`, `fordon`, `sparkonto`, `buffert`, `ovrigt`, `bolan`,
  `skuld`, `vinstandel`
- `metadata jsonb` (default `{}`) — wizardarnas fält utan nya kolumner.
  Fältkatalogen per kind finns i `src/components/assetFields.js`. Viktiga
  nycklar:
  - `linkedAssetId` — ett lån pekar på sin tillgång (bostad/fordon).
    `resolveLoanTarget()` i `src/lib/manualAssets.js` löser även olänkade
    bolån: finns exakt en bostad kopplas lånet dit.
  - `ownershipShare` — ägarandel i procent, klampas 1–100.
    `effectiveValueSek()` = `value_sek × andel/100`; används överallt där
    nettoförmögenhet summeras (även speglad i cron-koden).
  - `amortizationRate` (% per år), `autoAmortize` (boolean, opt-in),
    `lastAmortizedAt` (stämplas av cron) — automatisk månadsamortering.
  - `interestRate`, `lender` — visas och förifyller kassaflödesrader.
  - `indexRegion` — senast vald SCB-region för värdeindikationen.
  - `purchasePrice`, `purchaseDate` — bas för SCB-indexuppräkningen.
  - `tranches: [{year, value}]`, `lockYears` — vinstandelsstiftelsens
    årgångar (`2026-08-19_manual_assets_vinstandel.sql`,
    `src/components/addassets/vinstandel.js`).

RLS: egna rader, full CRUD.

### net_worth_snapshots (`2026-08-19_net_worth_snapshots.sql`)
Daglig nettoförmögenhet per användare, skriven av cron (service role):
`user_id`, `snapshot_date`, `net_worth_sek`, `portfolio_sek`, `pension_sek`,
`assets_sek`, `debts_sek`; unik per user+dag. RLS: användare kan bara läsa —
inga insert/update-policies, endast cronens service role skriver.

### user_prefs
`user_id`, `preferences jsonb`, `last_seen_at`. Läses/skrivs via
`src/contexts/UserContext.jsx`. `preferences` är appens kökkenmödding av
användardata (allt merged shallow):

- `display_name`, `language`, `guideSeen`, `accountType`
- `investorProfile` — ekonomiprofilen v2 (onboarding), inkl. härledd
  legacy-profil (investorType/riskProfile/experience)
- `pension` — ITP-data: `itpType`, `monthlyContribution`, `entries[]`
  (provider, insuranceType, currentValue, funds); legacy platt form stöds
  via `src/lib/pension.js` (`getPensionEntries`/`getPensionTotalValue`)
- `cashflow` — `{ incomes: [], expenses: [] }`; rader har `label`, `amount`,
  `period` (month/quarter/year), utgifter `category`, inkomster `incomeType`;
  lånekopplade rader har `loanId` + `rate` i stället för fast belopp
- `savingsGoals` — `[{ id, name, icon, target, saved, createdAt }]`
- `groups` — portföljgrupper, `todos`, `pinned_indices`, `pinned_commodities`,
  `investmentPlan`, `sharePortfolioWithAI`, `thesisThresholdPct`,
  `thesisReviewMonths`

### Tabeller som fylls utanför detta repo
- `portfolio_snapshots` (`user_id`, `snapshot_date`, `total_value_sek`) —
  daglig portföljhistorik, skrivs av scraper-projektet
  (thesion-scraper.vercel.app); läses av net-worth-cronen och via
  `/api/portfolio-history`-proxyn.
- `stock_scores` — förberäknade poäng per ticker (piotroski, magic formula,
  growth/dividend/quality, composite `score_value/growth/dividend/mixed`,
  nyckeltal, beta, market cap). Läses av `/api/score`, `/api/suggestions`,
  `/api/company` (beta). Fylls av scrapern.
- `stock_ownership` — kurerad svensk ägardata, läses av `/api/ownership`
  (fallback: Yahoo).
- `analyses` + Supabase Storage — premiumanalyser (metadata + PDF),
  läses av `/api/analyses` och `/api/analysis-pdf`. Seedas via
  `scripts/seed-analysis.js` / `scripts/upload-pdf.js`. Vilande i UI.
- `premium_subscriptions` — Stripe-status per användare (vilande).

## Nyckelflöden

### Portföljvärdering
`src/lib/portfolioValue.js` → `getPortfolioValuation(userId)`:

1. Läser hela watchlist (direkt supabase-anrop, RLS).
2. Prissätter ALLA rader med `shares > 0` plus max 20 övriga bevakningar —
   fonder via `/api/fund` (NAV), aktier via `/api/company`. **Pence-hantering:**
   Londonnoterade kurser i GBp/GBX delas med 100 och valutan byts till GBP så
   FX-kursen stämmer.
3. FX till SEK parsas ur `/api/commodities` (`parseFxRates` i
   `useFxRates.js`); saknade valutor slås upp via Yahoo (`CURSEK=X`).
4. Summerar per valuta → `totalSek`, `dailyChangeSek`, `portfolioSek`
   (null när en kurs saknas — **aldrig gissad FX**), samt `stocksSek`/`fundsSek`
   för donuten.

Resultatet cachas per användare i 5 min (promise-cache, samma TTL-mönster som
`useScores`). `useNetWorth.js` konsumerar värderingen och lägger på pension
(`getPensionTotalValue(preferences.pension)`) och manual_assets
(`effectiveValueSek` per rad, ägarandel inräknad):
`netWorth = portfolioSek + pensionValue + assetSum − debtSum`.
HomeHero, NetWorthCard, AssetBreakdown, AssetTable och GoalsTab delar samma
hookdata så alla ytor visar identiska siffror.

### Transaktioner → watchlist-synk
`TransactionsPanel.jsx` (monterad i CompanyRow-expandern, FundView och
bolagssidans NotesSection) listar köp/sälj, lägger till/raderar rader i
`transactions`, kör `computeHolding` och skriver tillbaka
`{shares, gav}` till watchlist-raden via `onSynced` (Portfolios
`updateItem`). `useHasTransactions` låser de manuella antal/GAV-fälten i
redigeringsvyerna när transaktioner finns — transaktionerna är då källan.

### Nettoförmögenhetsgraf (hybrid)
`PortfolioChart.jsx` + `usePortfolioData.js`: portföljhistorik från
`/api/portfolio-history` (scraper-data) och äkta snapshots från
`/api/net-worth-history`. I nettoläge (`offsetSek != 0`) används äkta
`net_worth_snapshots`-punkter där de finns; för dagar innan snapshotten
började plattas dagens offset (pension + tillgångar − skulder) bakåt ovanpå
portföljkurvan, med not i UI:t. Indexjämförelsen (OMXS30/S&P 500 via
`/api/chart`) visas bara i rent portföljläge.

### Lånegruppering och tillgångssidan
`NetWorthCard` grupperar skulder under sin tillgång via `resolveLoanTarget`
(länk-id först, entydigt bolån→bostad som fallback); olänkade skulder listas
fristående. `ManualAssetView.jsx` är tillgångssidan (deep link från Min
ekonomi/AssetTable): detaljfält per kind, kopplat lån med belåningsgrad,
eget kapital, amorteringskravs-info och "din andel av eget kapital" vid
samägande; redigering och radering (lånet ligger kvar när tillgången tas
bort).

### Värdeindikation för bostad
Två spår i `ManualAssetView`, båda **skriver aldrig värdet utan uttryckligt
klick på "Använd som värde"** (COMPLIANCE-principen: inga påhittade värden):

1. **SCB-indexuppräkning:** `/api/property-index` hämtar fastighetsprisindex
   för permanenta småhus (SCB PXWeb, öppet API), räknar
   `köpeskilling × (index nu / index vid köpkvartal)` för vald region
   (12 regioner, samma lista i API och UI). Kräver `purchasePrice` +
   `purchaseDate` i metadata.
2. **Egen uppräkning:** användaren läser prisutvecklingen själv (länk till
   Svensk Mäklarstatistik) och anger procent — ren aritmetik på egen siffra,
   på köpeskillingen eller nuvarande värde.

Booli-uppslaget (`/api/property-valuation`, `BooliValuation.jsx`) är
avmonterat i UI:t — se Vilande nedan.

### Kassaflödet i Mål-fliken
`GoalsTab.jsx`: inkomster (typade: lön, partners lön, bidrag …) och utgifter
(kategoriserade, med snabbvals-presets) per månad/kvartal/år, allt
normaliserat till kr/mån (`cashflowPeriods.js`). Utgiftsrader kan **kopplas
till ett inmatat lån** (`loanId` + `rate`): beloppet räknas som
`skuld × procent / 12` och följer lånets aktuella saldo — amorterar du,
sjunker räntekostnaden automatiskt. Ett lån kan ha max en ränte- och en
amorteringsrad. **Amortering räknas som sparande** (`isSaving` i
`cashflowCategories.js`): den exkluderas ur "Pengar ut", visas som eget
statkort och ingår i sparkvoten. `available = in − konsumtion − amortering`
driver sparmålens "klart om X mån" (märkt räkneexempel).
Sankey-flödesgrafen (`CashflowSankey.jsx`) på desktop, stapel + legend på
mobil. Allt lagras i `preferences.cashflow`/`savingsGoals`.

### Cron-jobb (vercel.json)
Båda kräver `Authorization: Bearer CRON_SECRET` (timing-safe jämförelse) och
är **fail-closed**: utan `CRON_SECRET` i miljön svarar de 500 och kör inget.
Båda kör med service role (förbi RLS) över alla användare och är idempotenta.

- **`/api/cron/net-worth-snapshot`** (dagligen 05:00 UTC): senaste
  `portfolio_snapshots`-värde per användare + pension ur `user_prefs` +
  manual_assets (ägarandelsjusterat) → upsert i `net_worth_snapshots`
  per user+dag. Inga kursanrop — speglar `effectiveValueSek` och
  `pensionTotal` som lokala kopior utan att importera klientkod.
- **`/api/cron/amortize-loans`** (månadsvis, 1:a kl 06:00 UTC): skulder med
  `metadata.autoAmortize === true` och `amortizationRate > 0` räknas ned med
  `värde × takt/100/12`, stämplas `lastAmortizedAt`. Idempotent per
  kalendermånad. Ren beräkning i `api/cron/_amortize.js` (delad med tester).

## API-katalog

Alla endpoints sätter CORS (thesion.tech/www + localhost). "Bearer" = kräver
Supabase-JWT; anropet görs då med användarens token så RLS gäller.
Rate limit är in-memory per serverless-instans (`_rateLimit.js`, default
60 req/min per IP+path; skippas lokalt).

| Endpoint | Metod | Syfte | Källa | Auth | Cache |
|---|---|---|---|---|---|
| `/api/company` | GET | Kurs, profil, nyckeltal, nyheter för ticker | Yahoo v8/quoteSummary + FMP (profil/nyckeltal, parallellt) + Finnhub-nyheter + beta ur stock_scores | ingen | s-maxage=300 |
| `/api/chart` | GET | Prishistorik 1m/3m/1y/5y | Yahoo v8 chart | ingen | s-maxage=300 |
| `/api/quarterly` | GET | Kvartalsresultat + estimat | Yahoo quoteSummary | ingen | s-maxage=3600, swr |
| `/api/indices` | GET | 14 marknadsindex | Yahoo | ingen | (ingen header) |
| `/api/commodities` | GET | Råvaror + FX vs SEK, SI-enheter | Yahoo futures | ingen | s-maxage=60, swr |
| `/api/search` | GET | Aktiesök | Finnhub | ingen | s-maxage=60, swr |
| `/api/earnings-calendar` | GET | Kommande rapportdatum | Finnhub | ingen | s-maxage=3600, swr |
| `/api/fund` | GET | Fonddata per SecId (NAV, avgift, betyg) | Morningstar screener | ingen | s-maxage=600, swr |
| `/api/fund-search` | GET | Fondsök | Morningstar | ingen | s-maxage=300, swr |
| `/api/fund-top` | GET | Toppfonder per kategori | Morningstar (1 h in-memory-cache) | ingen | s-maxage=3600, swr |
| `/api/score` | GET | Förberäknad poäng per ticker | Supabase stock_scores | ingen | s-maxage=300, swr |
| `/api/suggestions` | GET | Topplistor per profil/filter | Supabase stock_scores | ingen | s-maxage=300, swr |
| `/api/ownership` | GET | Ägarstruktur + free float-signaler | Supabase stock_ownership, Yahoo-fallback | ingen | s-maxage=3600 |
| `/api/holdings` | GET | Investmentbolagens innehav | thesion-scraper | ingen | max-age=3600 |
| `/api/insider` | GET | Insiderhandel | thesion-scraper | ingen | max-age=3600 |
| `/api/company-news` | GET | Press för investmentbolag | Cision RSS + sajtscrape | ingen | s-maxage=1800, swr |
| `/api/efn-news` | GET | EFN-artiklar om investmentbolag | efn.se-sök | ingen | s-maxage=3600, swr |
| `/api/leadership` | GET | VD/ordförande | Bolagssajter + statisk fallback | ingen | s-maxage=43200, swr |
| `/api/property-index` | GET | SCB-indexuppräkning av köpeskilling | SCB PXWeb | ingen | s-maxage=86400, swr |
| `/api/user-prefs` | POST | Preferences-skrivproxy (server-side merge) | Supabase user_prefs | Bearer | — |
| `/api/manual-assets` | POST/PATCH/DELETE | Skrivproxy för manual_assets | Supabase | Bearer | — |
| `/api/net-worth-history` | GET | Egna nettoförmögenhets-snapshots | Supabase net_worth_snapshots | Bearer | private, max-age=300 |
| `/api/portfolio-history` | GET | Portföljhistorik | thesion-scraper (user_id server-side) | Bearer | private, max-age=300 |
| `/api/notifications` | GET | Notiser | thesion-scraper (user_id server-side) | Bearer | private, max-age=60 |
| `/api/cron/net-worth-snapshot` | GET | Daglig snapshot, alla användare | Supabase (service role) | CRON_SECRET | — |
| `/api/cron/amortize-loans` | GET | Månadsamortering, alla användare | Supabase (service role) | CRON_SECRET | — |

**Vilande endpoints** (koden finns kvar och fungerar, men ingen aktiv
UI-yta / ingen nyckel — se "Vilande features" nedan):

| Endpoint | Status |
|---|---|
| `/api/chat` | POST, Bearer, 10 req/min. Anthropic (Haiku, ev. Borgen-backend via `LLM_BACKEND`). ChatPanel är avmonterad; systemprompten måste skrivas om före återmontering (COMPLIANCE.md). |
| `/api/property-valuation` | GET. Booli slutpriser — svarar 501 utan `BOOLI_CALLER_ID`/`BOOLI_PRIVATE_KEY` (Booli delar inte ut nycklar, aug 2026). UI avmonterat. |
| `/api/premium-status`, `/api/analyses`, `/api/analysis-pdf` | Premium-koll (premium_subscriptions + Stripe-fallback) och analysinnehåll. PremiumAnalyses är dold i UI (importeras inte någonstans). |
| `/api/stripe-checkout`, `/api/stripe-portal`, `/api/stripe-webhook` | Stripe-prenumeration 49 kr/mån. Webhooken uppdaterar premium_subscriptions. Vilande med premiumytan. |

## Mönster och konventioner

- **RLS överallt.** Varje användartabell har row level security på
  `auth.uid() = user_id`. API-proxys skickar användarens JWT vidare till
  Supabase så RLS gäller även server-side; endast cron använder service role.
- **Direkta supabase-anrop vs `/api/`-proxy.** Läsningar går i regel direkt
  från klienten (watchlist, manual_assets, transactions). **Skrivningar mot
  user_prefs och manual_assets går via proxy** (`/api/user-prefs`,
  `/api/manual-assets`) för att Safari stryper fetch-skrivningar mot
  `*.supabase.co` ("TypeError: Load failed"); UserContext har direkt-skrivning
  som fallback. Skrivningar mot watchlist/transactions görs (ännu) direkt.
- **5-minuters-cachen.** Promise-cache per användare med TTL i modulen
  (`portfolioValue.js`, `useScores`) så flera kort delar samma hämtning.
- **Aldrig påhittade värden.** Saknas kurs/FX/score visas ingenting eller
  null — ingen gissning (`portfolioSek = null` vid saknad FX-kurs; HealthSignal
  visas inte utan score). Uppskattningar (SCB-index, egen uppräkning) skrivs
  **aldrig** till användarens data utan uttryckligt klick ("Använd som
  värde"); cron-amortering är opt-in per lån (`autoAmortize`).
- **Compliance.** Generisk utbildning OK, personlig rekommendation aldrig —
  varje yta gås igenom i COMPLIANCE.md. Omdömesytor bär "Utgör inte
  finansiell rådgivning"; beräkningar på användarens egna siffror märks
  "räkneexempel".
- **i18n.** i18next med sv (bas/fallback) + en; språkval i localStorage för
  första målning, synkas via `preferences.language`. Migrationen från
  hårdkodad svenska pågår fil för fil via nattlig rutin
  (`src/i18n/queue.json`): 8 filer klara (App, Portfolio, Overview,
  SedanSist, TodoList, UpcomingEarnings, WeeklySummary, PortfolioSummary),
  ~68 kvar — större delen av UI:t är alltså fortfarande hårdkodad svenska.
- **Design.** Tokens i `src/index.css` (grönt brand `--brand`, Newsreader/
  Schibsted Grotesk/Spline Sans Mono, radie via `--radius-lg`); ikoner via
  `src/components/icons.jsx` + `iconMaps.js` (Lucide, inga emoji). Inline
  styles, ingen CSS-ramverk. Se DESIGN.md.
- **Test.** Vitest + @testing-library/react (jsdom, `src/test-setup.js`).
  Mönster: mocka `supabase.js` och `fetch` per test, rena beräkningsmoduler
  (transactions, _amortize, wizardHelpers, manualAssets) testas utan DOM.
  Testerna bor i `__tests__/`-kataloger intill koden; api-tester i
  `api/__tests__/`. E2E via Playwright (`npm run test:e2e`).
- **Säkerhetsheaders** i vercel.json: strikt CSP (ingen `unsafe-inline` för
  script — därför registreras service workern i `main.jsx`), HSTS,
  frame-deny. `connect-src` vitlistar Supabase-projektet, scrapern, Sentry
  och Google Fonts.
- **Felrapportering:** Sentry (endast production-hostnamn thesion.tech),
  ErrorBoundary runt appen samt SafeCard-boundaries per kort på Hem.

## Drift

- **Hosting:** Vercel (thesion.tech). SPA byggs med `npm run build`;
  `api/` deployas som serverless functions; `vercel.json` definierar crons
  och headers. Koden på GitHub (johanres-kott/meridian).
- **Cron:** Vercel cron anropar endpoints med `Authorization: Bearer
  CRON_SECRET`. `CRON_SECRET` måste vara satt som env i Vercel — annars
  svarar cron-endpoints 500 och ingen snapshot/amortering körs.
- **Miljövariabler** som koden läser:
  - Frontend (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - API: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    (endast cron), `CRON_SECRET`, `FINNHUB_KEY`, `FMP_KEY`,
    `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (vilande),
    `ANTHROPIC_API_KEY`, `LLM_BACKEND`/`BORGEN_API_KEY`/`BORGEN_BASE_URL`
    (vilande chatt), `BOOLI_CALLER_ID`/`BOOLI_PRIVATE_KEY` (vilande),
    `NODE_ENV`
  - Lokalt läggs allt i `.env.local`; vite-pluginet bryggar in dem i
    `process.env` för api-handlers.
- **Migrationer:** körs manuellt i Supabase SQL-editorn (ingen pipeline).
  Klientkoden är defensiv mot okörda migrationer (t.ex.
  `isMissingTableError` för transactions).
- **Vilande features** (kod kvar, avstängt i UI — riv inte utan beslut):
  - **Stripe/premium:** `api/stripe-*.js`, `api/premium-status.js`,
    `api/analyses.js`, `api/analysis-pdf.js`, `usePremium`,
    `PremiumAnalyses.jsx`, `PremiumGate.jsx`. Dold aug 2026 (COMPLIANCE.md).
  - **Booli:** `api/property-valuation.js`, `addassets/BooliValuation.jsx`.
    Booli ger inte ut nycklar; UC/Metria är framtida alternativ (DESIGN.md).
  - **AI-chatten ("Mats"):** `api/chat.js`, `ChatPanel.jsx`,
    `src/components/chat/`, `useChatContext`. Avmonterad tills den har en
    roll i nya berättelsen; systemprompten måste skrivas om först.
  - **Strangler-komponenter** under Portfölj → Bevakning (SedanSist,
    PortfolioSummary, InvestmentPlanTracker, StrategyCard, AllocationCard,
    WeeklySummary, UpcomingEarnings) — arv under observation (DESIGN.md).

## Kända skavanker

Observerade under genomläsningen 2026-08-20 — inga fixar gjorda här:

1. `api/score.js:6` och `api/suggestions.js:6` — `if (setCors(req, res)) return;`
   men `setCors` returnerar inget, och ingen egen OPTIONS-hantering finns:
   CORS-preflight mot dessa svarar 400 i stället för 204.
2. `src/lib/transactions.js:103–116` — transactions skrivs direkt mot
   `*.supabase.co` från klienten, trots att just den felklassen i Safari är
   skälet till proxymönstret för manual_assets/user_prefs. Samma gäller
   watchlist-skrivningarna i `Portfolio.jsx`.
3. `src/lib/portfolioValue.js:8–22` — 5-min-cachen invalideras aldrig vid
   skrivningar: efter en transaktion/watchlist-ändring visar Hem/Min ekonomi
   gamla portföljsiffror tills TTL löper ut eller sidan laddas om.
4. `src/App.jsx:40–48` — flik-id:n är historiska: `markets` renderar Hem
   ("Översikt") och `commodities` renderar MarketsView ("Marknader"), vilket
   är förvirrande vid deep links (`onNavigate("markets")` = gå Hem).
5. `api/cron/net-worth-snapshot.js:70` — portföljdelen bygger på
   `portfolio_snapshots` som fylls av det externa scraper-projektet; slutar
   scrapern skriva blir snapshotens portfölj tyst stående på senaste värdet
   (ingen ålderskontroll på raden).
6. `src/lib/portfolioValue.js:37–39` — endast de 20 första raderna utan
   innehav prissätts; bevakningar bortom 20 får tyst ingen kurs i ytor som
   läser `priced`.
7. `README.md` är fortfarande Vite-mallens standardtext och `STAGING.md`
   beskriver gammalt chatt-arbete ("Mats", Core-Satellite) — båda inaktuella
   mot dagens app.
8. `api/_rateLimit.js:1–5` — rate limiting är in-memory per
   serverless-instans; skyddet är svagt vid många instanser (känd
   begränsning, kommenterad i filen).
9. `api/company.js` m.fl. hämtar Yahoo-crumb (två extra requests) per
   anrop utan återanvändning mellan anrop i samma instans.
10. i18n-migrationen täcker 8 av ~80 filer — engelska språkvalet ger idag en
    blandad sv/en-upplevelse utanför de migrerade ytorna
    (`src/i18n/queue.json`).
