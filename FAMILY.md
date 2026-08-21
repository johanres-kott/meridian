# FAMILY.md — Familjeläge (etapp 1)

## Modellöversikt: person som data, inte som login

Familjeläget bygger på **Finary-modellen**: familjemedlemmar är rader i
kontoägarens egen data, inte egna konton. Beviset från den inloggade appen
(PIVOT.md, "Observationer från inloggad app"): Finarys Add Asset-flöde
avslutas med ett Ownership-steg där ägaren är förifylld med 100 % och där
**fler medlemmar = familjeläge** — man lägger till en person med bara ett
namn ("Add a person") och fördelar sedan procent per tillgång. Ingen
inbjudan, ingen inloggning, ingen delning av data.

Varför den modellen först:

- **Noll friktion.** Sambon behöver inte skapa konto för att huset ska
  kunna ägas 50/50 i din vy. Ett namn räcker.
- **Ingen säkerhetsyta.** Allt ligger under användarens eget `user_id` —
  inga RLS-ändringar, ingen delningslogik, inget samtyckesflöde. Etapp 2
  (riktiga logins) är en separat, granskningskrävande sak — se roadmap.
- **Passar datan vi redan har.** `metadata.ownershipShare` (ägarandel i
  procent) finns sedan tidigare och räknas redan in i nettoförmögenhet,
  kassaflöde och cron-snapshot. Familjeläget generaliserar den, utan att
  röra något av det.

## Datamodell

### `preferences.household`

```json
{
  "members": [{ "id": "<uuid>", "name": "Lotten" }],
  "economyType": "gemensam" | "blandad" | "enskild"
}
```

- `members` **exkluderar kontoägaren** — "me" är implicit. Visningsnamnet
  för me är `preferences.display_name` eller "Du".
- `id` genereras med `crypto.randomUUID` (samma newId-mönster som
  GoalsTab). Namn saniteras med `sanitizeInput` som allt annat.
- Hanteras i Profil → Familj (lägga till, byta namn, ta bort, ekonomityp).
  Sparas via `updatePreferences({ household })` — vanliga preferences-vägen.

### `metadata.owners` + dual-write-principen

`metadata.owners` är den **rika sanningen** om ägande per rad i
`manual_assets`: en karta `{ "me": 50, "<personId>": 50 }` i procent,
summa ≤ 100. Vid **varje** spara speglas dessutom

```
metadata.ownershipShare = owners.me ?? 100
```

— det är dual-write-principen. Spegeln gör att allt befintligt fortsätter
fungera helt orört:

- `effectiveValueSek` (lib/manualAssets.js) — min andel i nettoförmögenheten
- `loanSharePct` (cashflowPeriods.js) — min andel av lånekopplade
  kassaflödesrader
- cron-snapshotens egen `effectiveValueSek`-spegel
  (api/cron/net-worth-snapshot.js)
- %-badgarna i NetWorthCard och "Din andel av eget kapital" i
  ManualAssetView

Enda skrivvägen är `withOwners(metadata, owners)` i `src/lib/household.js`
(normaliserar kartan och sätter spegeln i samma steg), så kartan och
spegeln kan aldrig glida isär. Rader **utan** owners-karta beter sig exakt
som idag: `ownershipShare` gäller, saknas den räknas 100 %.

## Ekonomityperna — defaults, inte lägen

`economyType` styr bara **förslaget** när Ägande-sektionen öppnas på en rad
som aldrig fått något ägande. Den tvingar ingenting och skriver aldrig om
befintliga rader.

| Typ | Förklaring | Default-ägande för ny rad |
|---|---|---|
| Gemensam | Allt nytt delas lika | Jämnt över me + alla medlemmar |
| Blandad | Delat väljs per tillgång | me: 100 (ändras per rad) |
| Enskild | Allt nytt är ditt | me: 100 |

Se `defaultOwnersFor` i `src/lib/household.js`.

## Vy-semantiken: Min del / Hushållet

- **Min del** (default) — exakt dagens beteende: varje rad räknas med min
  andel (`effectiveValueSek`), %-badges visas på delade rader.
- **Hushållet** — fulla `value_sek` på alla manuella rader, inga badges.
  `householdNetWorth` = portfölj + pension + fulla tillgångar − fulla
  skulder.
- **Portfölj och pension är personliga i etapp 1** och ingår med samma
  belopp i båda vyerna. (Partnerns depå/pension är etapp 1.5/2-frågor.)
- Växeln (pill-toggle i HomeHero och NetWorthCard) visas **endast** när det
  finns minst en medlem OCH minst en rad med andel < 100 % — annars är
  vyerna identiska och växeln vore brus. Valet sparas i
  `preferences.netWorthView` ("mine" | "household", default "mine").
- **Historiken är min del tills vidare:** PortfolioChart-offseten på Hem
  och cron-snapshoten räknar oförändrat min andel. Hushållsvyn påverkar
  alltså dagens siffra, inte grafen — medvetet, tills en hushållssnapshot
  finns.

## Migrering

Ingen datamigrering behövs.

- Befintliga rader med `ownershipShare` (t.ex. från BostadWizard) saknar
  owners-karta och tolkas precis som förut: `ownershipShare` = min andel,
  övriga medlemmars andel = 0.
- Att öppna Ägande-sektionen på tillgångssidan och spara **uppgraderar**
  raden: owners-kartan skrivs och spegeln sätts. Uppgraderingen är
  förlustfri — min andel behåller sitt värde.
- Tas en person bort ur hushållet lämnas ägandet på raderna orört;
  owners-nycklar utan medlem visas som "Okänd person" i Ägande-sektionen.
  Inget raderas i smyg.
- Gamla fältet "Ägarandel" (FIELDS_BY_KIND) finns kvar som bakåtkompat för
  rader utan owners och utan medlemmar; det döljs så fort Ägande-sektionen
  eller Ägande-raden tar över, så inget dubbleras.

## Roadmap

### Etapp 1.5 — Kassaflöde per person

- Inkomst per person: kassaflödesrader får en frivillig `memberId` så
  hushållets inkomster kan läggas in och summeras per person.
- Delade utgifter med fördelningsregel: 50/50 eller proportionellt mot
  inkomst (klassikern för samboekonomi). Regeln blir en household-default
  med per rad-override, samma mönster som economyType.
- Lånekopplade rader följer redan `loanSharePct` — de blir automatiskt
  rätt i både min del- och hushållsperspektivet.

### Etapp 2 — Claimbara logins (skiss, byggs inte nu)

Person-som-data kan senare "claimas" av en riktig användare:

- Inbjudan via mejl; personen skapar eget konto och länkas till member-id:t.
- RLS-design krävs: delade rader måste bli läsbara/skrivbara över två
  `user_id` — sannolikt en `households`-tabell + membership-tabell och
  policies per rad, i stället för dagens enkla "allt är mitt".
- Samtycke/GDPR: den inbjudna måste godkänna att befintlig data (namn,
  ägarandelar) kopplas till hens konto; rätt att bli borttagen utan att
  kontoägarens egen data försvinner.
- Säkerhetsgranskning innan bygge — delning är en helt annan riskklass än
  etapp 1, som medvetet inte rör någon säkerhetsyta.

### Etapp 3-idé — Juridisk vy

En pedagogisk vy över vad som händer vid separation/dödsfall: giftorätt
kontra enskild egendom, sambolagens bodelning (samboegendom = gemensam
bostad + bohag förvärvat för gemensamt bruk). Viktigt: ägarandelar i appen
är **inte** samma sak som det juridiska utfallet — den skillnaden är själva
pedagogiken. Byggs i så fall som generisk fakta med källor, aldrig
personlig rådgivning, enligt COMPLIANCE.md-principen; gränsdragningen
dokumenteras där innan något byggs.

## Filer (etapp 1)

- `src/lib/household.js` — getMembers, ownerShare, normalizeOwners,
  withOwners (dual-write), defaultOwnersFor, isSharedRow
- `src/hooks/useNetWorth.js` — householdAssetSum/householdDebtSum/
  householdNetWorth + hasHouseholdView
- `src/components/ProfilePage.jsx` — sektionen Familj
- `src/components/ManualAssetView.jsx` — Ägande-sektionen (redigering) och
  Ägande-raden (visning)
- `src/components/NetWorthViewToggle.jsx`, `HomeHero.jsx`,
  `NetWorthCard.jsx` — Min del/Hushållet-växeln
