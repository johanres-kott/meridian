# Integrationer — bankdata in i Thesion

**Datum:** 2026-08-21

Två spår, i ordning:

## Etapp 1 (byggd): kontoutdrags-import via CSV

Regulationsfri väg till bankdata — användaren exporterar själv ett kontoutdrag
som CSV från internetbanken och släpper filen i appen (Komplettera din portfölj
→ Importera kontoutdrag). Ingen licens behövs eftersom ingen tredje part hämtar
data åt användaren.

- Kod: `src/lib/parseBankStatement.js` (ren parsning + tester) och
  `src/components/addassets/KontoutdragImport.jsx` (UI).
- Format grundade i riktiga exporter: **Nordea**
  (`Bokföringsdag;Belopp;Avsändare;Mottagare;Rubrik;Saldo;Valuta`, semikolon,
  svensk taltyp "1 234,56", "Reserverad" på ej bokförda rader) och **SEB**
  (`Bokföringsdatum,Valutadatum,Verifikationsnummer,Text/mottagare,Belopp,Saldo`).
  Okända banker faller tillbaka på generisk kolumnigenkänning (datum + belopp).
- Filen läses **lokalt i webbläsaren** — transaktionerna laddas aldrig upp och
  sparas inte. Det enda som skrivs är saldot, och bara när användaren klickar
  (nytt sparkonto eller uppdatering av befintligt) — i linje med principen att
  aldrig skriva värden utan användarens aktiva val.
- Månadssammanställningen (in/ut/netto per månad) visas som referens för
  kassaflödet men sparas inte.
- Encoding: UTF-8 med strikt avkodning, fallback till ISO-8859-1 (vissa
  bankexporter är Latin-1 — annars blir å/ä/ö fel).

## Etapp 2 (utforskad nedan): PSD2 / open banking

Empirisk kartläggning av bankernas utvecklarsandlådor (Nordea, SEB,
Swedbank/Handelsbanken) **utan** registrerat bolag eller AISP-licens, testad
från utvecklingsmiljön via curl.

## Sammanfattning i en mening

Alla sandlådor kräver *någon* form av registrering för att få nycklar — men **Nordea** och **Handelsbanken** släpper in privatpersoner med enbart e-postregistrering (ingen licens, ingen riktig eIDAS-cert), medan **SEB** och **Swedbank** förutsätter TPP/eIDAS-cert redan i sandlådan. Ingen bank har helt öppna, oautentiserade data-endpoints — men API:erna svarar med riktiga, verifierbara felmeddelanden på anrop härifrån (se testerna nedan). Den snabbaste vägen till *riktig* bankdata för Thesion är att gå via en aggregator (GoCardless Bank Account Data / ex-Nordigen, enable:banking eller Tink) som redan har licensen.

---

## Metodanmärkning: vad "testa härifrån" betyder

Utgående HTTPS går via en proxy. Jag har **inte** skapat konton eller skickat in persondata någonstans. Jag har bara:
- läst publik dokumentation, och
- anropat endpoints som är publikt nåbara utan registrering (och fått tillbaka bankernas riktiga fel-svar, vilket bevisar att endpointen finns och att auth-lagret fungerar).

Det jag **inte** kunnat verifiera utan konto: faktiska konto-/transaktionssvar (200-svar), exakt utseende på Client ID/Secret-utfärdandet, och test-SSN/testanvändare bakom inloggning. Detta är tydligt utmärkt per bank.

---

## Nordea

### Registreringskrav
- Utvecklarportal: **developer.nordeaopenbanking.com** (HTTP 200 härifrån). Dokumentation: **documentation.nordeaopenbanking.com**. Support/guide ligger på support.nordeaopenbanking.com (Cloudflare-skyddad, ej skrapbar med curl).
- **Privatperson kan registrera sig med e-post.** Signup: fyll i uppgifter → bekräftelsemejl → bekräfta inom 24 h (annars låses kontot) → logga in i testmiljön. Lösenordskrav: min 8 tecken, versal/gemen/siffra, undvik å/ä/ö.
- Inget bolag eller AISP-registrering krävs för **sandlådan**.
- eIDAS: för att *signera* API-anrop krävs certifikat, men i sandlådan accepteras **självsignerat eller Nordea-signerat** cert (eIDAS krävs alltså inte för sandbox — bara i produktion). Kravet på cert-signering av anrop gäller sedan sept 2019.
- Efter att man skapat en "app" i konsolen får man **Client ID** och **Client Secret** för sandbox-anrop.

### Vad vi kunde testa härifrån
Nordeas produktions-/sandbox-API på `api.nordeaopenbanking.com` är publikt nåbart och svarar med riktiga fel — bekräftar att auth-lagret (IBM API Connect / DataPower) och endpoint-strukturen finns:

```bash
$ curl -sS -i https://api.nordeaopenbanking.com/personal/v5/accounts
HTTP/2 401
content-type: application/json
x-global-transaction-id: dd51bf1b6a88429c06615181
{"httpCode":"401","httpMessage":"Unauthorized","moreInformation":"Invalid client id or secret."}
```

```bash
# Fel HTTP-metod på authorize-endpoint ger 405 (GET), rätt endpoint finns:
$ curl -sS -i https://api.nordeaopenbanking.com/personal/v5/authorize
HTTP/2 405
{"httpCode":"405","httpMessage":"Method Not Allowed","moreInformation":"The method is not allowed for the requested URL"}

# POST utan giltiga nycklar -> 401 med tydligt meddelande:
$ curl -sS -i -X POST https://api.nordeaopenbanking.com/personal/v5/authorize -H 'Content-Type: application/json' -d '{}'
HTTP/2 401
{"httpCode":"401","httpMessage":"Unauthorized","moreInformation":"Invalid client id or secret."}
```

**Kunde INTE verifiera utan konto:** faktiska 200-svar med konton/transaktioner, testanvändarnas SSN, samt exakt Client ID/Secret-format. (Enligt dokumentationen genereras transaktionsdata i sandlådan automatiskt över tid och man kan skapa/radera konton och transaktioner via sandbox-endpoints.)

### Auth-flöde
- OAuth 2.0. Anrop kräver headers: `Authorization: Bearer <token>`, `X-IBM-Client-Id`, `X-IBM-Client-Secret`, samt en `Signature`-header (RSA-SHA256 över bl.a. `Date`-headern) och `Date`.
- Bärartoken genereras vid inloggning/authorize; Client ID/Secret kommer från app-konsolen.
- Endpoints (personal v5):
  - `GET /personal/v5/accounts` — lista konton
  - `GET /personal/v5/accounts/{id}` — kontodetaljer
  - `GET /personal/v5/accounts/{id}/transactions` — transaktioner (paginerat)
  - Sandbox-only: POST/DELETE för att skapa/radera konton och transaktioner.

### Väg till produktion
- eIDAS **QWAC + QSEAL** från en QTSP.
- TPP-auktorisation (AISP-roll) från nationell behörig myndighet — i Sverige **Finansinspektionen** (eller passportering från annat EES-land).
- Compliance-API:erna stödjer EU-TPP:er under eIDAS samt UK Open Banking.

**Bedömning:** Nordea har den mest "öppna" sandlådan — privatperson kommer in med e-post och kan köra riktiga anrop med genererade nycklar. Bäst för att lära sig flödet.

---

## SEB

### Registreringskrav
- Två portaler: **developer.sebgroup.com** (SEB-koncernen, HTTP 200 men SPA utan skrapbart innehåll) och **developer.baltics.sebgroup.com** (SEB Baltics, det getting-started-flöde som är mest dokumenterat).
- Dokumentationen förutsätter att man registrerar sig **som en enligt PSD2 licensierad TPP**. Formuleringen genomgående är "After you sign up as a TPP licensed according to PSD2 ...". Sandlådan är alltså inte tydligt öppen för privatpersoner på samma sätt som Nordea.
- Vid signup för-genereras en **Client (TPP)-profil** åt dig, plus en förkonfigurerad sandlåda: 2 kunder per land i SEB Baltics (+ ett företagskonto för Estland), varje kund med 3 konton med saldo. Förgenererade sandbox-access tokens medföljer.
- **Certifikat:** TLS-cert används för TPP-autentisering; för att testa auth-flödet utanför portalen kan man skapa eller ladda upp ett **QWAC** i "TPP-certificate"-fliken. I portalen kan man alltså komma igång utan eget cert, men flödet är byggt kring cert.

### Vad vi kunde testa härifrån
- Portalerna svarar (HTTP 200) men är SPA:er utan publik data-endpoint som går att anropa oautentiserat.
- SEB Baltics API-host (`api.baltics.sebgroup.com`) gick **inte** att nå via denna proxy (CONNECT tunnel 502 — proxy-/nätverksbegränsning, inte ett svar från banken). Kunde därför inte fånga ett riktigt fel-svar som för Nordea.

**Kunde INTE verifiera härifrån:** några callbara endpoints, testanvändarnas identiteter, eller att sandbox-signup verkligen släpper in en privatperson utan TPP-uppgifter. Dokumentationens ordval antyder att TPP-status förväntas.

### Auth-flöde
- OAuth 2.0 + TLS/QWAC-baserad TPP-autentisering (Berlin Group NextGenPSD2-stil).
- Kundens samtycke bekräftas i produktion via **Mobilt BankID**.
- Förgenererade sandbox-tokens gör att man kan börja anropa API:erna direkt i portalmiljön.

### Väg till produktion
- PSD2-licens (AISP/PISP) från nationell behörig myndighet (FI i Sverige).
- Giltig **QWAC** (och QSEAL för signering) från QTSP.
- Kundsamtycke via BankID.

**Bedömning:** Högre tröskel än Nordea. Sandlådan är främst tänkt för redan licensierade TPP:er; oklart (kunde ej verifiera) om en ren privatperson kan slutföra registreringen.

---

## Swedbank (tillägg)

### Registreringskrav
- Portal: **openbanking.swedbank.no/developer** (delad Nordisk/Berlin Group-portal; sandbox-dokumentation på `.../portal-sandbox/documentation`). Produktion via psd2-hosten.
- **Ingen manuell registrering** krävs för sandlådan i sig — men: **du behöver ett QSealC-testcertifikat** från en QTSP redan för sandlådan. Vid första anropet validerar Swedbank certet och enrollar dig automatiskt som TPP i sandbox.
- Det finns alltså en **cert-tröskel även i sandbox** (test-cert, inte skarpt eIDAS, men ändå ett QTSP-utfärdat cert). Ingen ren "bara e-post"-väg.
- Mock-data kan skapas/populeras med Swedbanks exempel-scripts (PSD2 Developer Sample Code).

### Vad vi kunde testa härifrån
- Portalerna är SPA/enrollment-sidor utan oautentiserade data-endpoints. Inget riktigt API-fel-svar fångat (kräver mTLS med testcert).

### Auth-flöde
- Berlin Group NextGenPSD2, mTLS med QSealC/QWAC + OAuth-samtyckesflöde.

### Väg till produktion
- PSD2-godkänd TPP med minst en roll (AISP/PISP/CBPII) **och** PSD2-kompatibelt **QSealC-produktionscert** från QTSP.

**Bedömning:** Kräver testcert redan i sandbox → mer jobb än Nordea/Handelsbanken för en privatperson.

---

## Handelsbanken (tillägg)

### Registreringskrav
- Portal: **developer.handelsbanken.com** (Layer7).
- **Sandbox kräver varken PSD2-licens eller eIDAS-cert.** Ordagrant ur deras riktlinjer: *"This is as simple as signing up for a free user account with us, then register an app (or multiple apps), and then subscribe to our APIs."*
- Testdata dokumenterat ("Test Data documentation for our PSD2 APIs") för accounts, cards, payments, funds confirmation.

### Vad vi kunde testa härifrån
Sandbox-hosten svarar med riktigt 401 (endpointen finns, auth krävs):

```bash
$ curl -sS -o /dev/null -w "%{http_code}\n" https://sandbox.handelsbanken.com/openbanking/psd2/v2/accounts
401
```

**Kunde INTE verifiera utan konto:** 200-svar/testdata, app-nycklar, exakt subscription-flöde.

### Auth-flöde
- Berlin Group NextGenPSD2. Sandbox: registrera app → subscribe på API → app-nycklar. Produktion: OAuth-samtycke + QWAC.

### Väg till produktion
- Auktorisation som TPP från nationell behörig myndighet **och** PSD2 eIDAS **QWAC** (eller UK Open Banking-cert).

**Bedömning:** Tillsammans med Nordea den mest tillgängliga sandlådan för en privatperson (gratis konto, inget cert i sandbox).

---

## Aggregatorer — den realistiska genvägen (testat härifrån)

Istället för att själv skaffa AISP-licens kan Thesion konsumera bankdata via en aggregator som redan har licensen. Detta är den enda vägen som ger *riktig* multibankdata utan egen FI-licens.

### GoCardless Bank Account Data (f.d. Nordigen)
- **Ingen egen AISP/PISP-licens krävs** — Nordigen är AISP reglerad av Lettlands FCMC, passporterad i 31 länder; nu del av GoCardless (FCA FRN 597190). Gratis "live AIS"-nivå.
- Token-endpoint är publikt nåbar och svarar med riktigt fel (bekräftar att man bara behöver gratis `secret_id`/`secret_key` från deras dashboard):

```bash
$ curl -sS -i -X POST https://bankaccountdata.gocardless.com/api/v2/token/new/ \
    -H 'Content-Type: application/json' \
    -d '{"secret_id":"invalid","secret_key":"invalid"}'
HTTP/2 401
http_x_ratelimit_limit: 10
{"summary":"Authentication failed","detail":"No active account found with the given credentials","status_code":401}

$ curl -sS -i https://bankaccountdata.gocardless.com/api/v2/institutions/?country=se \
    -H 'Authorization: Bearer invalid'
HTTP/2 401
```

- Har en dedikerad **sandbox-institution** (`SANDBOXFINANCE_SFIN0000`) för end-to-end-test utan riktig bank. Kräver gratis konto (skapades ej här, per instruktion).
- **Osäkerhet om gratisnivån:** en tidigare kartläggning i projektet pekade på att GoCardless fasat ut den fria nivån för Bank Account Data. Dokumentationen ovan säger "free live AIS" men prissättningen måste verifieras i deras dashboard/villkor innan vi bygger mot den — annars är **enable:banking** närmaste alternativ.

### enable:banking
- Erbjuder gratis sandbox för utvecklare. API:et är publikt nåbart men kräver JWT från deras app-registrering:

```bash
$ curl -sS https://api.enablebanking.com/aspsps
{"code":401,"message":"Authorization header is not provided"}
```

### Tink (Visa)
- Stor Norden-täckning (inkl. Nordea, SEB, Swedbank, Handelsbanken). Kräver kommersiellt avtal; sandbox via deras Console. Mest "enterprise", dyrare än GoCardless för en liten app.

---

## Rekommendation för Thesion

| Väg | Insats för privatperson/liten app | Riktig bankdata? | Kommentar |
|-----|-----------------------------------|------------------|-----------|
| **Nordea sandbox** | Låg — e-postregistrering, app ger Client ID/Secret, självsignerat cert | Nej (mock) | Bäst för att lära sig PSD2-flödet direkt, verifierat callbart API. |
| **Handelsbanken sandbox** | Låg — gratis konto, ingen cert i sandbox | Nej (mock) | Lika lättillgänglig som Nordea. |
| **SEB sandbox** | Medel/hög — dokumentationen förutsätter licensierad TPP | Nej (mock) | Kunde ej bekräfta att ren privatperson släpps in. |
| **Swedbank sandbox** | Medel — kräver QSealC-**testcert** från QTSP redan i sandbox | Nej (mock) | Cert-tröskel även utan skarp licens. |
| **GoCardless Bank Account Data** | Låg — gratis konto, **ingen egen licens** | **Ja, skarp** | Realistiska vägen till multibank-produktion för en liten app. |
| **enable:banking / Tink** | Låg–medel | **Ja, skarp** | Alternativ aggregatorer; enable:banking billigt, Tink enterprise. |

**Konkret plan:**
1. **Lär dig flödet** i Nordeas (och ev. Handelsbankens) sandbox — enda som en privatperson kommer in i med bara e-post, och API:erna är bevisat callbara härifrån.
2. **För produktion utan egen FI-licens:** integrera mot **GoCardless Bank Account Data** (gratis live AIS, ingen egen AISP-licens, täcker svenska storbankerna). Verifierat att token-/institutions-endpointsen är publikt nåbara och bara kräver gratis nycklar.
3. **Egen AISP-licens** (via Finansinspektionen) + eIDAS **QWAC/QSEAL** från QTSP behövs bara om Thesion vill koppla direkt mot varje banks produktions-API utan mellanhand — betydligt större regulatorisk och teknisk insats; motiverat först vid skala.

### Vad som återstår att verifiera (kräver konto — ej gjort här)
- Att Nordea/Handelsbanken-signup faktiskt slutförs som privatperson och vilka test-SSN/testanvändare som ges.
- Om SEB Baltics-signup släpper in utan TPP-uppgifter.
- Faktiska 200-svar (konton/transaktioner) från respektive sandbox.
- GoCardless prissättning/limits på gratisnivån vid produktionsvolym.

### Källor (viktigaste)
- Nordea: developer.nordeaopenbanking.com, documentation.nordeaopenbanking.com, support.nordeaopenbanking.com (sandbox guide)
- SEB: developer.sebgroup.com, developer.baltics.sebgroup.com/ob/getting-started
- Swedbank: openbanking.swedbank.no/developer, swedbank.com/openbanking/faq.html
- Handelsbanken: developer.handelsbanken.com/api/psd2/guidelines
- Aggregatorer: bankaccountdata.gocardless.com (GoCardless/Nordigen), api.enablebanking.com, openbankingtracker.com
