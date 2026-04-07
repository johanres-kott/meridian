# Plan: AI-chatt med Claude i sidopanel

## Context
Användaren vill ha en inbyggd AI-chatt i Meridian-appen. Chatten ska vara en sidopanel till höger som kan togglas. Den ska använda Claude (Haiku för snabbhet/kostnad) via Anthropic API och ha tillgång till användarens portfölj och marknadsdata som kontext.

## Implementering

### 1. Installera Anthropic SDK
```bash
npm install @anthropic-ai/sdk
```

### 2. Skapa API-route: `api/chat.js`
- POST endpoint som tar emot `{ messages, context }`
- Använder `@anthropic-ai/sdk` med `process.env.ANTHROPIC_API_KEY`
- Modell: `claude-haiku-4-5-20251001` (snabb, billig)
- System prompt på svenska med kontext om att det är en finansapp
- **Streaming** via `res.write()` med SSE-format för responsivt UI
- Context-objektet innehåller portfölj, index, råvaror som skickas från frontend

### 3. Skapa komponent: `src/components/ChatPanel.jsx`
- Sidopanel till höger (~380px bred) med toggle-knapp
- Chatthistorik med meddelanden (användare + AI)
- Textfält + skicka-knapp
- Streaming: visar AI-svaret tecken för tecken
- Samlar automatiskt kontext från app-state (portfölj, marknadsdata)
- Skickar kontext med varje meddelande så Claude kan svara om "min portfölj", priser etc.

### 4. Integrera i `src/App.jsx`
- Importera ChatPanel
- Toggle-knapp i topbar (bredvid klockan)
- ChatPanel renderas bredvid content-arean
- Skickar med portfölj/preferences som props för kontext

## Filer att ändra/skapa
| Fil | Ändring |
|-----|---------|
| `package.json` | Lägg till `@anthropic-ai/sdk` |
| `api/chat.js` | **NY** - Serverless endpoint med streaming |
| `src/components/ChatPanel.jsx` | **NY** - Sidopanel-komponent |
| `src/App.jsx` | Toggle-knapp + rendera ChatPanel |

## Verifiering
1. Öppna appen, klicka på chat-knappen i topbar
2. Sidopanelen öppnas till höger
3. Skriv "Hur går min portfölj?" → Claude svarar med data från portföljen
4. Skriv "Vad kostar guld?" → Claude svarar med aktuellt pris
5. Svaret streamas in tecken för tecken
