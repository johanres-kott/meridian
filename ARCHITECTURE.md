# Thesion — Arkitektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNA DATAKALLOR                               │
│                                                                         │
│  Yahoo Finance    Finnhub    FMP    Supabase DB    thesion-scraper      │
│  (kurser, chart)  (sok)    (ROIC)  (auth, scores)  (insider, holdings) │
└────────┬──────────┬─────────┬────────┬──────────────┬───────────────────┘
         │          │         │        │              │
         ▼          ▼         ▼        ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API-LAGER  /api/*  (Vercel Serverless)              │
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ company │ │  chart  │ │  search  │ │   score   │ │ suggestions  │  │
│  │ (211 r) │ │ (48 r)  │ │  (39 r)  │ │  (54 r)   │ │   (80 r)     │  │
│  └─────────┘ └─────────┘ └──────────┘ └───────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ indices │ │commodit.│ │quarterly │ │ earnings  │ │   chat (AI)  │  │
│  │ (59 r)  │ │ (80 r)  │ │  (76 r)  │ │  (58 r)   │ │  (253 r)     │  │
│  └─────────┘ └─────────┘ └──────────┘ └───────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐                   │
│  │ insider │ │holdings │ │notificat.│ │port.-hist.│  Proxys med JWT   │
│  │ (35 r)  │ │ (28 r)  │ │  (45 r)  │ │  (45 r)   │  auth + rate     │
│  └─────────┘ └─────────┘ └──────────┘ └───────────┘  limiting         │
│                                                                         │
│  Gemensamt: _cors.js (setCors/withCors) · _rateLimit.js · _supabase.js │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOOKS  (Data & Cache-lager)                          │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐               │
│  │  useScores   │  │  useFxRates  │  │ usePortfolioData│               │
│  │ 5min TTL     │  │ 5min TTL     │  │ userId-baserad  │               │
│  │ modul-cache  │  │ modul-cache  │  │ chart + history │               │
│  └──────────────┘  └──────────────┘  └─────────────────┘               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐               │
│  │useChatContext│  │   useUser    │  │   useIsMobile   │               │
│  │ lazy-load    │  │  (context)   │  │   useTheme      │               │
│  │ vid chat-opp │  │  auth+prefs  │  │   (lokal state) │               │
│  └──────────────┘  └──────────────┘  └─────────────────┘               │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  App.jsx (377 r) — Router / Shell / Theme                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         FLIKAR                                     │ │
│  │                                                                    │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────────┐  │ │
│  │  │ Oversikt  │ │ Portfolj  │ │ Investera │ │     Analys       │  │ │
│  │  │           │ │           │ │           │ │                  │  │ │
│  │  │ Markets   │ │ Portfolio │ │Investment │ │  GapAnalysis     │  │ │
│  │  │  (60 r)   │ │  (285 r)  │ │Companies │ │   (297 r)        │  │ │
│  │  │           │ │           │ │ (239 r)   │ │                  │  │ │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └────────┬─────────┘  │ │
│  │        │              │              │                │            │ │
│  │  ┌─────▼─────┐  ┌─────▼────┐  ┌─────▼──────┐  ┌─────▼─────┐     │ │
│  │  │SedanSist  │  │CompanyRow│  │CompSelector│  │CompareView│     │ │
│  │  │PortfSumm. │  │AddCompBar│  │HoldingsTab│  │           │     │ │
│  │  │PortfChart │  │PdfImport │  │EventList  │  └───────────┘     │ │
│  │  │WeeklySumm │  │AllocCard │  │Leadership │                    │ │
│  │  │UpcomEarns │  │StratCard │  │InfoCard   │                    │ │
│  │  │InvPlanTr. │  │PortfChart│  └───────────┘                    │ │
│  │  │TodoList   │  │PortfTree │                                   │ │
│  │  └───────────┘  │GroupFilter│                                   │ │
│  │                  └──────────┘                                   │ │
│  │  ┌───────────┐ ┌───────────┐                                   │ │
│  │  │ Marknader │ │    Sok    │                                   │ │
│  │  │           │ │           │                                   │ │
│  │  │Commodities│ │CompSearch │                                   │ │
│  │  │ (204 r)   │ │ (204 r)  │                                   │ │
│  │  │           │ │           │                                   │ │
│  │  └─────┬─────┘ └─────┬─────┘                                   │ │
│  │        │              │                                         │ │
│  │  ┌─────▼──────┐ ┌─────▼──────────┐                              │ │
│  │  │MarketDetail│ │SuggestionDrop. │                              │ │
│  │  └────────────┘ │SearchResultDet.│                              │ │
│  │                  └────────────────┘                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   OVERLAY-KOMPONENTER                              │ │
│  │                                                                    │ │
│  │  ChatPanel (268 r)          CompanyView (258 r)                   │ │
│  │  ├── PurchaseWizard         ├── NotesSection                      │ │
│  │  ├── InvestmentWizard       ├── ProfileInsight                    │ │
│  │  ├── SaveInsightButton      ├── InsiderSection                    │ │
│  │  └── SaveMenu               └── QuarterlyChart                    │ │
│  │                                                                    │ │
│  │  NotificationBell (225 r)   OnboardingModal (225 r)               │ │
│  │  └── NotificationItem       └── onboarding/steps.js               │ │
│  │                                                                    │ │
│  │  LandingPage (48 r)         Documentation (52 r)                  │ │
│  │  ├── Hero                   ├── ScoringDocs                       │ │
│  │  ├── Features               ├── AllocationDocs                    │ │
│  │  └── CtaAndFooter           └── ReferenceDocs                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   DELADE UTILITIES                                 │ │
│  │                                                                    │ │
│  │  lib/apiClient.js ··········· fetchCompany(), searchStocks()      │ │
│  │  lib/profileMatcher.js ······ matchStock(), filterByProfile()     │ │
│  │  lib/sanitize.js ············ sanitizeInput() (XSS)               │ │
│  │  lib/parsePdf.js ············ PDF → portfölj-import               │ │
│  │  lib/parseDCAPlan.js ········ DCA-plan parser                     │ │
│  │  utils/portfolioAllocation.js analyzeAllocation() (Core-Satellite)│ │
│  │  utils/timeAgo.js ··········· relativ tidsformatering             │ │
│  │  SharedComponents.jsx ······· PriceChart, Chg, StatCard, MiniBar │ │
│  │  constants.js ··············· getFlag(), STATUS_COLORS            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

Teknikstack: React 19 · Vite 7 · Supabase · Vercel Serverless · Sentry
Styling: CSS custom properties (light/dark) + inline styles
Auth: Supabase Auth (JWT) · API-proxys verifierar via getUser()
```
