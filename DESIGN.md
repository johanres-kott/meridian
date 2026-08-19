# Thesion designsystem

> **Aug 2026: nytt brand applicerat.** Källan är paketet "Thesion design-system"
> (readme + tokens + komponenter, levererat 2026-08-19). Det ersätter avsnittet
> "Uppmätta Finary-tokens" nedan — Finary-analysen gäller fortfarande för
> *layout och mönster*, men färg/typ/radier kommer nu från det egna systemet.
>
> **Kärnan:** grönt brand (`--brand #0F7A5C`) med guldaccent (`--gold-500`,
> sparsamt: premium/Äger/CTA på mörkgrönt), nära-vit bakgrund `#FCFCFC`
> (aldrig beige), **Newsreader** (serif) för rubriker och stora tal,
> **Schibsted Grotesk** för UI, **Spline Sans Mono** (tabular) för siffror.
> Kort radie 14 + `--shadow-card` (gröntonad), knappar/badges pill (999),
> inga gradienter, **inga emoji** — Lucide-ikoner (stroke 1.5) via
> `src/components/icons.jsx` + `iconMaps.js`. Svensk du-form, meningsversal.
> Logotyp: `public/brand/logo-green.svg` (förslag, godkänt tills vidare —
> ny logotyp + namn utreds senare). Tokens: `src/index.css`.
>
> **Gjort:** tokens in, 559 typ/färg-ersättningar i 89 filer, 100 kort →
> radie 14 + skugga, appskal (logo, Newsreader på hälsning/hero), emoji →
> Lucide i alla nya vyer. **Kvar:** emoji i arv-komponenter (PensionInvest,
> InvestmentPlanTracker, QuickGuide, docs/, chat/ — chat är avmonterad),
> LandingPage i nya brandet (ui_kits/marketing som förebild), dark mode-QA.

Underlag: designstudie av app.finary.com (aug 2026) med uppmätta värden ur
deras DOM, se PIVOT.md för produktanalysen. Principen är **copy with pride**:
vi tar deras layoutspråk och mönster, men behåller Thesions blå identitet och
SEK-först-perspektiv.

## Uppmätta Finary-tokens (referens)

| Token | Finary | Thesion-motsvarighet |
|---|---|---|
| Canvas (sidbakgrund) | `#F5F6F7` | `--bg: #f5f6f7` (ljust läge) |
| Ytor/kort | `#FFFFFF`, radius 10–12 | `--bg-card: #fff`, radius 10 |
| Text primär | `#131314` | `--text` |
| Text sekundär (nav) | `#3E4147` | `--text-secondary` |
| Accent/CTA | `#EDB068` (orange pill, radius 999, mörk text) | `--accent: #2962ff`, pill radius 999, **vit** text |
| Sidomeny | 220 px bred, item h48, padding 12, radius 8 | samma mått |
| Aktiv nav-item | `rgba(108,113,122,0.1)`-pill | samma rgba fungerar på vår canvas |
| Typografi | Inter; 14 px nav, stora feta siffror för pengar | Inter (finns), IBM Plex Mono för siffror (behåll — bättre än Finary) |

## Skalet

```
┌────────────────────────────────────────────────────────┐
│ topbar h56: [logo]              [🕐] [+ Lägg till] [🔔] │
├──────────┬─────────────────────────────────────────────┤
│ sidomeny │  innehåll (max-width ~1240, luftig padding) │
│ 220px    │  vita kort på grå canvas                    │
│          │                                             │
│ [profil] │                                             │
└──────────┴─────────────────────────────────────────────┘
```

- **Sidomeny (desktop):** Hem, Portfölj, Investera, Analys, Marknader, Sök.
  Ikon + label, aktiv = grå pill. Profil längst ner (avatar + namn + ⋮,
  popover öppnas uppåt) — Finarys signaturmönster.
- **Topbar:** logo vänster, höger: klocka/Live, "+ Lägg till"-pill (accent),
  notisklocka. Ingen flikrad på desktop — navigering sker i sidomenyn.
- **Mobil:** behåller bannern + horisontella flikar (sidomeny ryms inte).

## Mönster att följa (från Finary)

1. **Inga tomma vyer.** Varje tom yta trattar mot EN handling ("+ Lägg till").
2. **Nettoförmögenhet är hjärtat.** Stor siffra + graf med tidsspann-chips
   (1D 7D 1M 3M 6M YTD 1Y ALL) överst på Hem.
3. **Add Assets är en helsida**, inte en modal: sök + kategorikort med stor
   halvtransparent illustration till höger (AddAssetsPage.jsx).
4. **Manuella flöden är 2–3 steg** med stegnav till vänster (Details →
   Ownership) och förifyllda rimliga val.
5. **Manuellt + automatiskt värde:** Finary auto-värderar bostäder via
   PriceHubble varje vecka. Vår väg: manuellt värde + länk till Booli/hitta.se
   nu, ev. Booli-API senare. Aldrig påhittade värden.
6. **Produktkort** med gradient-header, ✓-punkter och pill-CTA (InvestLanding.jsx).
7. **Pill-knappar** (radius 999) för primära CTA:er; sekundära är outline.

## Vad vi INTE tar

- Orange accent (vi är blå), USD/EUR-först (vi är SEK-först).
- Deras Investing-flik som bara säljer egna produkter.
- Mats/AI-chatten är avmonterad tills vidare — AI återinförs när den har en
  tydlig roll i den nya berättelsen.

## Ombyggnadsplan (status)

- [x] Canvas-färg: `--bg` → `#f5f6f7` i ljust läge
- [x] Appskal: sidomeny + topbar med "+ Lägg till" (App.jsx, ProfileMenu.jsx)
- [x] Add Assets-katalog (AddAssetsPage.jsx)
- [x] Investera-startvy med produktkort (InvestLanding.jsx)
- [x] Hem: nettoförmögenhet som hero (HomeHero.jsx + useNetWorth-hook) med
      dagsförändring och breakdown-chips; portföljgrafen (med tidsspann +
      indexjämförelse) direkt under
- [x] Mål-fliken (GoalsTab.jsx): sparmål med progress + manuellt kassaflöde
      (lön/utgifter → sparutrymme + sparkvot, Finarys Budget-statrad "Money
      in/out/Available" utan bankkoppling). Lagras i preferences
      (savingsGoals, cashflow); "klart om X mån" är räkneexempel på
      användarens egna siffror
- [x] Hem-grafen visar hela nettoförmögenheten (PortfolioChart offsetSek:
      pension + manuella tillgångar − skulder ovanpå portföljhistoriken, med
      not om att de ingår till nuvarande värde; indexjämförelsen döljs i
      nettoläget eftersom den avser portföljen)
- [x] Bostadsvärdering via svensk adress: /api/property-valuation hämtar
      slutpriser i området från Boolis officiella API (kräver BOOLI_CALLER_ID
      + BOOLI_PRIVATE_KEY i env; 501 + manuell fallback utan). UI i
      bostadsformuläret: adress + boyta → median kr/m², slutprislista och
      indikation (median × boyta) märkt som grov uppskattning
- [x] Bostads-wizard (BostadWizard.jsx): Finarys Add Real Estate-flöde
      (stegnav vänster: Beskrivning → Värde → Finansiering → Summering) men
      med det Finary saknar — svensk finansiering: bolån/långivare/ränta,
      kontantinsats, uttagna pantbrev, live-beräknad belåningsgrad (med
      amorteringskravs-info) och eget kapital. Bostad sparas som tillgång och
      bolånet som länkad skuld (metadata.linkedAssetId, jsonb-kolumn via
      migrations/2026-08-10_manual_assets_metadata.sql — körd i Supabase).
      Finarys wizard i referens: adress-först (PriceHubble, funkar för
      svenska adresser!), typ/kategori, characteristics (köpeskilling,
      värdering, ytor, byggår, avgifter), details (rum-steppers), quality
      (kök/badrum-skick som matar estimatet), ownership. Ingen finansiering
      alls hos Finary — vår differentiering.
- [x] Fordons-wizard (FordonWizard.jsx): samma fyrstegsflöde som bostaden
      (typ/regnr/årsmodell/miltal → värde m. Blocket-uppslag → billån med
      lån/värde-kvot och eget kapital → summering). Delade byggstenar i
      wizardShared.jsx + wizardHelpers.js. Leasing-notering: leasat fordon är
      ingen tillgång och ska inte läggas in.
- [!] Bostadsvärdering via API — Booli ger inte ut API-nycklar (svar aug
      2026), så /api/property-valuation förblir vilande (501). Mr Koll är
      persons-sök, ingen värderingsdata. Realistiska B2B-alternativ när det
      finns intäkter: UC bostadsvärdering (uc.se/api) eller Metria
      (avtalstjänster). Tills dess: manuell inmatning + Booli/hitta.se-länkar.
- [x] Portfölj: AssetBreakdown-hero överst — Finarys Assets|Liabilities-donut
      per tillgångsslag (aktier/fonder/pension/bostad/fordon/sparkonto/övrigt,
      skulder separat) med legend, andel och klick-navigering. Data via
      useNetWorth (portfolioValue levererar nu stocksSek/fundsSek), så
      siffrorna är identiska med Hem. Innehavstabellen har fått radie 10 +
      kortbakgrund. Kvar: filterchips (Typ/Institution) ovanför tabellen.
- [x] Kortradier/spacing-pass: 80 kortcontainrar i 46 filer → radie 10
      (riktad transformation: bara bg-card+border-kort, inte knappar/inputs)
- [x] Kassaflöde: inkomsttyper (flera inkomster) + 18 måste-ha-utgifter som
      snabbval-chips med förifylld kategori. Beslut: INGEN wizard för
      kassaflödet — det är en checklista man återvänder till, snabbvalen ger
      vägledningen utan tvånget.
- [ ] Sparmål ↔ tillgångar: låt ett mål peka på t.ex. buffert-posten i
      manual_assets så "sparat" uppdateras därifrån
- [x] Nettoförmögenhetshistorik på riktigt: net_worth_snapshots (migration
      körd) fylls dagligen 05:00 UTC av /api/cron/net-worth-snapshot (Vercel
      cron i vercel.json, service role, upsert per user+dag; första körningen
      gjord 2026-08-19). /api/net-worth-history läser (JWT/RLS). Grafen kör
      hybrid i nettoläge: äkta punkter där de finns, portfölj + offset innan.
      **Deploy-krav:** sätt `CRON_SECRET` (finns i .env.local) som env i
      Vercel — utan den svarar cron-endpointen öppet.

## Informationsarkitektur — en fråga per sida (beslut aug 2026)

Finarys modell rakt av: **Home är en enkel dashboard, Portfolio har allt**,
"+ Lägg till" finns överst på varje sida.

| Sida | Frågan den svarar på | Innehåll |
|---|---|---|
| **Hem** | Hur mår min ekonomi? | Hero (nettoförmögenhet + dagsförändring), nettoförmögenhetsgraf, Rörelser idag, Min ekonomi, att-göra |
| **Portfölj** | Vad äger jag? | Graf, AssetBreakdown-donut, **AssetTable** (en rad per tillgång över alla slag, typ-chips + sök), underflikar Innehav / Bevakning / Tesgranskning / Pension |
| **Mål** | Vart är jag på väg? | Kassaflöde (lön → sparutrymme), sparmål |
| **Investera** | Vad ska jag göra? | Din bas, Avgiftskoll, produktkorten, Toppförslag, Pension (investera), Investmentbolag |
| **Analys / Marknader / Sök** | Kryddan | Oförändrade (arv) |

Regel: en komponent som inte passar in i sidans fråga flyttas eller tas bort
— aldrig "behålls för säkerhets skull". Inga dubbletter: pensionsvyn bor under
Portfölj (Investera länkar dit), portföljgrafen på Hem och Portfölj är samma
komponent med samma data.

### Strangler-läge: arv under observation
Komponenter som lever vidare bakom Portfölj → Bevakning tills de antingen
byggs om i Finary-stil eller visar sig oanvända och tas bort:
SedanSist, PortfolioSummary, InvestmentPlanTracker, StrategyCard,
AllocationCard, WeeklySummary, UpcomingEarnings, PortfolioTreemap,
GroupFilterBar. Beslut per komponent tas när Bevakning-fliken utvärderas.

## Målgrupp (aug 2026)

Människor som vill ha **helhetssyn på sin ekonomi och sina tillgångar** —
inte traders. Därav: nettoförmögenhet först, manuell inmatning av allt
(bostad, fordon, lån, lön), sparmål, och indexfonder som huvudspår.
Aktieanalysen finns kvar men som "kryddan", inte identiteten.
