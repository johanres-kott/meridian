# Thesion — rådgivningsgränsen (aug 2026)

Internt arbetsdokument om var gränsen mot investeringsrådgivning går i produkten.
Detta är inte juridisk rådgivning.

## Principen

Generisk information och utbildning ("globala indexfonder har låga avgifter") är OK.
En personlig rekommendation — något som framställs som lämpligt för *dig*, baserat på
din situation eller dina innehav — är investeringsrådgivning enligt lagen (2007:528)
om värdepappersmarknaden, tillståndspliktig hos Finansinspektionen, och undviks helt.

Tumregel för varje ny yta: **skulle två användare med olika profil/innehav se samma
slutsats?** Om nej — motivera varför det ändå inte är en rekommendation.

## Genomgång per yta

| Yta | Status |
|---|---|
| **HealthSignal** (`src/components/company/HealthSignal.jsx`) | Generisk — visar alltid mixed-poängen, samma för alla användare oavsett profil (beslut aug 2026). En profilviktad poäng vore ett steg mot personlig rekommendation. |
| **FeeScanCard** | Aritmetik på användarens egna siffror. Framställs som räkneexempel, utan byt-uppmaning. |
| **BaseFundCard** | Generisk nudge — pekar på kategorin (billig global indexfond), inte på en specifik fond som lämplig för användaren. |
| **ProfileInsight / matchStock** (`src/components/company/ProfileInsight.jsx`, `src/lib/profileMatcher.js`) | "Stark matchning" mot användarens profil — närmast gränsen av det som är kvar. Att se över: formulera om till beskrivning ("bolaget har hög utdelning") istället för matchnings-omdöme. |
| **Toppförslag / suggestions** | Generiska topplistor — samma för alla användare med samma filterval. |
| **AI-chatten** | Avmonterad. Systemprompten i `api/chat.js` ger idag portföljspecifika uppmaningar och måste skrivas om innan chatten återmonteras. |
| **PremiumAnalyses** | Dold i UI (aug 2026). |

## Disclaimer-praxis

Varje yta som visar omdömen eller poäng bär "Utgör inte finansiell rådgivning" eller
motsvarande. En disclaimer ändrar dock inte klassificeringen — det är formuleringen
av själva innehållet som avgör om något är en personlig rekommendation.

## Öppna punkter

- Stäm av med FI:s vägledning innan premiumanalyserna återaktiveras.
- Se över ProfileInsight-matchningen (omformulering till beskrivning).
- Användarvillkor tillkom aug 2026 (`src/components/Terms.jsx`).
