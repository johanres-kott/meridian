# Treemap-visualisering av portföljen

## Context
Användaren vill ha en "Billion Dollar Gram"-liknande treemap på portföljsidan som visar varje akties proportionella värde. Placeras ovanför tabellen, visar bara aktier med `shares` (ägda), storlek baserad på marknadsvärde i SEK.

## Approach
Använd Recharts `Treemap`-komponent (redan installerat, v3.8.0) — inget nytt beroende.

### Modifiera: `src/components/Portfolio.jsx`

1. **Samla treemap-data från CompanyRow-prisinformation**
   - Problemet: priser hämtas per rad i `CompanyRow` med individuella `fetchPrice()`-anrop, men treemapen behöver alla priser centralt
   - Lösning: Lyft prisdata — hämta priser för alla `filteredItems` i `Portfolio`-komponenten (liknande `PortfolioSummary.jsx` rad 35-48), spara i en `prices`-state-map
   - Beräkna varje akties värde: `shares * price * fxRate` (konverterat till SEK)
   - Filtrera till bara items med `shares > 0` och där pris finns

2. **Treemap-komponent** (inline i Portfolio.jsx eller liten separat komponent)
   - Data: `[{ name, ticker, value (SEK), changePercent }]`
   - Varje ruta visar: **namn**, **värde formaterat** (t.ex. "234 000 kr")
   - Färg: grön/röd baserat på dagens kursförändring (samma `#089981`/`#f23645` som redan används)
   - Custom content-renderer för att visa text i rutorna (Recharts Treemap stödjer `content`-prop)
   - Klickbar — `onClick` navigerar till CompanyView (samma som tabellraderna)
   - Höjd: ~300px desktop, ~200px mobil
   - Visa bara om det finns minst 2 aktier med värde

3. **Placering i JSX**
   - Direkt efter `<AddCompanyBar>` och före tabellen
   - Respekterar `activeGroup`-filtret (visar bara aktier i vald grupp)

4. **Stil**
   - Rutor med avrundade hörn, vit text för namn, svart text för värde
   - Bakgrundsfärg: gradient från neutral till grön/röd beroende på dagsförändring
   - Om `changePercent` saknas: neutral blå (`#42a5f5`)
   - Responsiv med `ResponsiveContainer` från Recharts

### Prisdata-lyftning
Skicka `prices`-mapen vidare som prop till `CompanyRow` så att dubbelanrop undviks. `CompanyRow` använder prop-priset om det finns, annars fallback till egen fetch.

## Verifiering
1. Starta dev-server med `preview_start`
2. Logga in, gå till Portfölj
3. Verifiera att treemapen renderas med korrekta proportioner
4. Klicka på en ruta — bör öppna CompanyView
5. Testa med gruppfilter aktivt
6. Testa mobilvy
