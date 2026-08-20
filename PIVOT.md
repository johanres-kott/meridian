# Thesion — Pivotplan (aug 2026)

## Vision

Thesion ska inte vara en Avanza-kopia eller en analytiker-terminal. Ny berättelse i tre lager:

1. **Basen** — huvudbudskapet är att spara i billiga globala indexfonder. Tråkigt, billigt, korrekt.
2. **Satelliterna** — aktieköp drivs av intresse för bolag ("jag älskar Apples produkter — går bolaget bra?"). Bolagssidan är en *produktsida*, inte en graf-terminal.
3. **Paraplyet** — helhetssyn på privatekonomin (Finary-inspirerat): portfölj + pension + bostad + sparkonton = förmögenhet.

## Finary-analys (finary.com)

### Positionering
- Tagline: "Track. Optimize. Invest." — aggregerings- och analyslager, **inte** en handelsplattform. Trades exekveras hos användarens befintliga mäklare.
- Kärnlöfte: automatisering ("sparar 5 timmar/månad", slipp Excel), konsolidering (allt på ett ställe), optimering (avgiftsscanner, diversifieringsanalys).
- 1M+ användare, trust-tungt (regulatoriska badges, press-logotyper, community).

### Prismodell (freemium)
| Tier | Pris | Innehåll |
|---|---|---|
| Free | €0 | 2 kontokopplingar, 2 mål, grundtracking |
| Lite | €55/år | Obegränsade kopplingar och mål |
| Plus | €150/år | Analytics: avgiftsscanner, diversifiering, utdelningar, budget, månadsrapporter, familjeläge |
| Pro | €350/år | Företagskonton, holdingläge |

Extra intäkter: kryptospreadar (0,99–1,49 %) och distribution av livförsäkring (Finary Life).

### Tillgångsklasser
Aktier/fonder, fastigheter, krypto, sparkonton, startup-equity, crowdlending, samlarobjekt. Aggregering via Powens/Plaid ("20 000 banker").

### Vad Thesion lånar
- **Nettoförmögenhet-först**: dashboarden svarar på "hur mycket är jag värd, åt vilket håll går det?" — inte "hur gick börsen idag?".
- **Optimize-framing**: avgiftsscannern är genial — den kvantifierar sitt eget värde ("du betalar X kr/år i onödiga avgifter"). Thesions motsvarighet: flagga dyra aktiva fonder mot indexalternativ.
- **Manuell inmatning som fullvärdig citizen**: Finary låter användare mata in tillgångar manuellt. Vi börjar där — aggregering är dyrt och kommer sist, om alls.
- **Mål-tracking** som gratisfunktionens krok.

### Vad Thesion INTE kopierar
- Kryptobörs och försäkringsprodukter (intäktsmodell som kräver tillstånd och skala).
- Aggregering-först (Powens/Plaid/Tink är dyrt; valideras sist).
- Finary har **ingen** bolagsupptäckts-berättelse — deras aktievy är kurslistor. Thesions intressedrivna produktsida är vår differentiering.

### Svensk kontext Finary saknar
ISK/KF-logik, ITP/tjänstepension (finns redan i Thesion), svenska fondtorg, Morningstar-data (finns redan).

### Observationer från inloggad app (app.finary.com, aug 2026)
- **Navigering:** Home · Portfolio · Goals · Insights · Budget · Investing · Tools · Community. Allt utom Investing är tomt/gated tills första kontot är kopplat — hela appen trattar mot en enda handling: "Add Asset". Inga tomma dashboards.
- **Add Asset-katalogen** är själva onboardingen: Real Estate, Stocks & Funds, Investment Accounts, Life insurance, Crypto, Checking accounts, Brokerage, Employee Savings Plan, Savings accounts, Loans, Startups & SMEs, Crowdlending, Watches/exotiska.
- **"Manuell" bostad är inte statisk:** man anger adressen och Finary omvärderar den *automatiskt varje vecka* via PriceHubble. Manuell inmatning + automatisk uppdatering är deras mönster. Svensk motsvarighet att utreda senare: Booli/Hemnet-värdering för fas 3-bostäder.
- **Investing-fliken säljer bara egna produkter** (Finary Crypto, Finary Life-försäkring) — ingen aktie- eller fondupptäckt alls. Bekräftar att Thesions produktsida + fondtorg är differentiering, inte kopiering.
- **Tools** är externa kalkylatorer (budget, ränta-på-ränta, wealth simulator) som marknadsföringsyta.
- **Add Asset-flödet i praktiken** (testat med manuellt sparkonto): bank väljs ur sökbar lista med "Manually add X" som fallback, sedan bara typ + saldo + valuta (+ frivillig ränta), sist ett Ownership-steg (ägare 100 % förifyllt, fler medlemmar = familjeläge). Tre skärmar, ingen friktion. Direkt efter submit: dashboard med nettoförmögenhetsgraf, donut per tillgång och tillgångstabell med Type/Institution/Owners-filter — även med EN enda tillgång känns appen levande.
- Läxa för Thesions "Min ekonomi": lägg-till-flödet ska kännas lika lätt (typ → namn → belopp), och fordon är en egen kategori värd att ha (tillagd i manual_assets).

## Faser

### Fas 1 — Bolagssidan blir produktsida (nu)
Folk tänker "jag gillar produkten → är bolaget bra?", inte i kvartalsgrafer.

> **Status aug 2026: byggd.** 1a (AboutCompany), 1b (HealthSignal, visar
> inget utan score), 1c (CompanyView delad i Översikt/Detaljer, Översikt
> default) finns i koden.

- **1a** `/api/company`: exponera `longBusinessSummary`, `website`, `fullTimeEmployees`, `city`, `country` — hämtas redan från Yahoo `assetProfile`, släng inte bort dem.
- **1b** Hälsosignal ("Går bolaget bra?"): Ja / Sådär / Nej byggd på befintliga `/api/score` (composite + quality/growth/dividend), förklarad i vardagsspråk. Saknas score → visa ingenting (aldrig fabricera).
- **1c** CompanyView delas i **Översikt** (om bolaget, hälsosignal, nyheter, profilmatchning, anteckningar) och **Detaljer** (kurschart, nyckeltal, kvartal, analytiker, insider, ägande). Översikt är default — graferna degraderas till Detaljer.

### Fas 2 — Fond-först (basen)
- **2a** "Din bas"-kort överst på Översiktsfliken: har användaren en global indexfond? Ja → visa den + status. Nej → pedagogisk nudge till Toppfonder/Global med indexfilter förvalt.
- **2b** Onboarding leder med basen (indexfond) innan aktieintressen.
- **2c** Avgiftsjämförelse: aktiv fond i portföljen? Visa vad avgiftsskillnaden mot ett indexalternativ kostar över tid (Morningstar-data finns).

> **Status aug 2026: byggd.** 2a (BaseFundCard), 2b (onboardingen är nu en
> ekonomiprofil som leder med basen — se DESIGN.md), 2c (FeeScanCard,
> räkneexempel utan byt-uppmaning) finns under Investera → Start.

### Fas 3 — Helhetsvy (manuellt)
- **3a** Ny datamodell `manual_assets` (bostad, bolån, sparkonto, buffert, övrigt) med manuell inmatning.
- **3b** Nettoförmögenhet-kort: portfölj + pension (ITP finns) + manuella tillgångar − skulder. Blir Översiktens topp.
- **3c** Flikstruktur ses över: "Min ekonomi" som hem.

> **Status aug 2026: byggd — och mer därtill.** 3a (manual_assets med
> metadata-jsonb, wizards för bostad/fordon/vinstandel), 3b (nettoförmögenhet
> som hero på Hem med daglig snapshot-historik via cron), 3c (Hem är en enkel
> dashboard med "Min ekonomi", Portfölj har allt — se DESIGN.md-IA:n).
> Utöver planen: transaktionsmodell med genomsnittsmetoden (köp/sälj → antal
> + GAV synkas till watchlist), ägarandelar (metadata.ownershipShare räknas
> i nettoförmögenheten), lån länkade till tillgång med belåningsgrad/eget
> kapital, värdeindikation för bostad via SCB:s prisindex + egen uppräkning
> (opt-in, skrivs aldrig automatiskt), automatisk månadsamortering (opt-in,
> cron), kassaflöde med lånekopplade räntor/amortering, sparmål.
> Kvar i fas 3: sparmål ↔ tillgångar-koppling (se DESIGN.md-statuslistan).

### Fas 4 — Aggregering (endast om fas 3 bevisar sig)
Tink/open banking utvärderas först när helhetsvyn har användning. Dyrast, sist.

## Regulatorisk princip

Generisk utbildning ("globala indexfonder har låga avgifter") — OK. Personlig rådgivning ("du borde köpa X") — tillståndspliktig, undviks. Alla rekommendationsytor formuleras generiskt och pedagogiskt, med källor. Befintlig disclaimer-praxis ("Utgör inte finansiell rådgivning") behålls och utökas. Var gränsen går per yta dokumenteras i COMPLIANCE.md.
