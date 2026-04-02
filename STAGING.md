# Staging - redo att deploya

## Lokala ändringar (ej pushade)
- [x] Mats fullscreen på mobil (ChatPanel responsive)
- [x] S&P 500 + OMXS30 index-jämförelse i PortfolioChart
- [x] Index-stats synliga i compact mode på Översikt
- [x] Registrera köp via Mats (4-stegs wizard)
- [x] SafeCard error boundaries på Översikt
- [x] PortfolioChart hooks-fix (canRender-flagga)
- [x] Core-Satellite portföljallokering (visuellt kort på Portföljsidan)
- [x] Allokeringsdata skickas till Mats i chat-kontext
- [x] Mats system prompt uppdaterad med Core-Satellite-analys
- [x] Fix: loadScores bugg (API returnerar {suggestions:[...]} inte array)
- [x] Fix: suggestions API max limit höjt från 50 till 300
- [x] Fix: AllocationCard visar nu även med 1 innehav (threshold sänkt från 2 till 1)
- [x] Fix: rate limit skippas lokalt (undviker 429 vid dev)
- [x] Fix: priser hämtas bara för bolag med shares (8 istf 58 anrop)
- [x] Förbättrad klassificeringslogik (poängbaserat system istf if/else)
- [x] Core-Satellite dokumentation + glossary-term
- [x] Refactor: delade konstanter (constants.js) - STATUS_COLORS, FLAG_MAP, STATUSES, PROFILE_LABELS, SECTOR_EMOJI
- [x] Refactor: delad Markdown-komponent (Markdown.jsx) - ersätter duplicerad kod i Portfolio + ChatPanel
- [x] Refactor: useFxRates hook + parseFxRates utility - ersätter duplicerad FX-parsing i 3 filer
- [x] Refactor: API Supabase-nyckel centraliserad (_supabase.js) - bort från 4 hårdkodade kopior
- [x] Refactor: company.js rate limit höjd till 200/min

## Att bygga
-

## Kända buggar
-
