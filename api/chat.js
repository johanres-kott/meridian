import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SUPABASE_URL = "https://acostgikldxkdmcoavkf.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb3N0Z2lrbGR4a2RtY29hdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDUzMTgsImV4cCI6MjA4ODcyMTMxOH0.lgIR-b3FpyTaO5Aa9SPnUHl-gyy5hloBvMTmnOfSLpw";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 10)) return; // Stricter: 10 req/min for AI chat
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Verify user is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
  } catch {
    return res.status(401).json({ error: "Authentication failed" });
  }

  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages required" });
  }

  let systemPrompt = `Du heter Mats och är en AI-driven finansassistent i appen Thesion. Du är inte en människa — var tydlig med att du är en AI om någon frågar.

Du har tillgång till användarens portfölj med nyckeltal, scoring och sektörfördelning.

REGLER:
- Svara alltid på svenska, kort och konkret.
- Avsluta ALDRIG med "detta är inte finansiell rådgivning" om användaren inte frågar.
- Ge ALLTID konkreta förslag med specifika bolag, belopp och tidsplan.
- Använd användarens investerarprofil för att anpassa råd.

NÄR ANVÄNDAREN BER OM INVESTERINGSPLAN:
Strukturera alltid svaret så här:
1. **Sammanfattning** — 1-2 meningar om nuläget
2. **Rekommendation** — specifika bolag med ticker, belopp och motivering
3. **Tidsplan** — "Investera X kr/mån under Y månader" eller liknande
4. **Varför?** — kort motivering kopplad till deras profil

NÄR ANVÄNDAREN FRÅGAR OM PORTFÖLJEN:
- Analysera vilka aktier som dragit ner/upp mest (P&L)
- Kommentera sektörfördelning och risk
- Ge 1-2 konkreta åtgärdsförslag

EXEMPEL PÅ BRA SVAR:
"Din portfölj är tungt viktad mot tech (73%). Jag rekommenderar:
1. AstraZeneca (AZN.ST) — 20 000 kr. Stabilt läkemedel, beta 0.29.
2. Atlas Copco (ATCO-A.ST) — 20 000 kr. Industriell kvalitet, bra utdelning.
Investera 10 000 kr/mån under 4 månader. Det ger sektördiversifiering och lägre risk."

Håll svaren under 200 ord. Var direkt och handlingsorienterad.`;

  // Add profile-specific AI instructions
  if (context?.investorProfile) {
    const p = context.investorProfile;
    const typeLabels = { value: "värdeinvesterare", growth: "tillväxtinvesterare", dividend: "utdelningsinvesterare", index: "indexinvesterare", mixed: "blandar strategier" };
    const riskLabels = { low: "låg", medium: "medel", high: "hög" };
    const focusLabels = { dividends: "utdelning", appreciation: "kursökning", both: "totalavkastning" };
    systemPrompt += `\n\nKRITISKT — ANVÄNDARENS PROFIL ÄR REDAN KÄND:
- Investerartyp: ${typeLabels[p.investorType] || p.investorType}
- Risktolerans: ${riskLabels[p.riskProfile] || p.riskProfile}
- Fokus: ${focusLabels[p.focus] || p.focus}
- Erfarenhet: ${p.experience || "ej angett"}
- Intressen: ${p.interests?.join(", ") || "ej angett"}
- Geografi: ${p.geography || "ej angett"}

DU FÅR ABSOLUT INTE fråga om risktolerans, investeringsstil, mål, tidshorisont eller budget. Du har redan all info du behöver. Ge DIREKT ett konkret förslag med specifika bolag och belopp. Om du behöver ett totalbelopp, anta 50 000 SEK om användaren inte angett annat.`;

    const profileInstructions = {
      value: "Användaren är värdeinvesterare. Fokusera på P/E-tal, substansvärde, skuldsättning och säkerhetsmarginal. Ge konservativa förslag med fokus på fundamenta.",
      growth: "Användaren är tillväxtinvesterare. Fokusera på omsättningstillväxt, ROIC, skalbarhet och marknadspotential. Var positiv till bolag med stark tillväxt även om P/E är högt.",
      dividend: "Användaren är utdelningsinvesterare. Fokusera på direktavkastning, utdelningshistorik, utdelningsandel och stabila kassaflöden. Prioritera bolag med lång utdelningshistorik.",
      index: "Användaren är indexinvesterare. Fokusera på bred marknadsexponering, avgifter och diversifiering. Ge råd om allokering snarare än enskilda aktier.",
      mixed: "Användaren blandar strategier. Ge balanserade förslag som kombinerar värde, tillväxt och utdelning.",
    };
    const riskInstructions = {
      low: "Användaren har låg risktolerans — undvik spekulativa bolag, small caps och högt belånade bolag.",
      medium: "Användaren har medel risktolerans — balansera stabila och mer riskfyllda förslag.",
      high: "Användaren har hög risktolerans — kan inkludera small caps, tillväxtbolag och mer spekulativa idéer.",
    };
    const experienceInstructions = {
      beginner: "VIKTIGT: Användaren är nybörjare. Förklara allt med enkla ord. Undvik facktermer eller förklara dem direkt. Använd vardagliga liknelser. Ge korta, tydliga svar. Säg 'aktiekursen' istället för 'kursen', 'företagets vinst' istället för 'nettoresultat'.",
      intermediate: "Användaren har grundläggande kunskap. Du kan använda vanliga finanstermer (P/E, utdelning, marginal) men förklara mer avancerade begrepp kortfattat.",
      advanced: "Användaren är erfaren. Använd facktermer fritt. Ge djupgående analys med nyckeltal, trender och jämförelser.",
    };
    systemPrompt += "\n\n" + (experienceInstructions[p.experience] || "");
    systemPrompt += "\n" + (profileInstructions[p.investorType] || "");
    systemPrompt += " " + (riskInstructions[p.riskProfile] || "");
    if (p.interests?.length > 0) {
      const interestLabels = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };
      systemPrompt += ` Användaren är intresserad av: ${p.interests.map(i => interestLabels[i] || i).join(", ")}.`;
    }
  }

  if (context) {
    const parts = [];
    if (context.portfolioSummary) {
      const s = context.portfolioSummary;
      let summaryText = `PORTFÖLJÖVERSIKT:\nTotalt värde: ${s.totalValue?.toLocaleString("sv-SE")} SEK\nTotal kostnad: ${s.totalCost?.toLocaleString("sv-SE")} SEK\nP&L: ${s.totalPl != null ? (s.totalPl >= 0 ? "+" : "") + s.totalPl.toLocaleString("sv-SE") + " SEK (" + (s.totalPlPct >= 0 ? "+" : "") + s.totalPlPct + "%)" : "Ej beräknat"}\nAntal innehav: ${s.totalHoldings} (${s.holdingsWithShares} med aktier)`;
      if (s.sectorBreakdown?.length > 0) {
        summaryText += "\n\nSEKTÖRFÖRDELNING:\n" + s.sectorBreakdown.map(sec =>
          `${sec.sector}: ${sec.value?.toLocaleString("sv-SE")} SEK (${sec.pct}%)`
        ).join("\n");
      }
      parts.push(summaryText);
    }
    if (context.portfolio?.length > 0) {
      const owned = context.portfolio.filter(c => c.shares > 0);
      const watched = context.portfolio.filter(c => !c.shares);
      if (owned.length > 0) {
        parts.push("ÄGDA AKTIER:\n" + owned.map(c => {
          let line = `${c.name} (${c.ticker}): ${c.shares} st à ${c.price} ${c.currency}, värde ${c.valueSek?.toLocaleString("sv-SE")} SEK, P&L ${c.plSek != null ? (c.plSek >= 0 ? "+" : "") + c.plSek.toLocaleString("sv-SE") + " SEK (" + (c.plPct >= 0 ? "+" : "") + c.plPct + "%)" : "—"}, idag ${c.changePercent > 0 ? "+" : ""}${c.changePercent}%, sektor: ${c.sector || "—"}`;
          if (c.score) {
            const sc = c.score;
            const scoreParts = [];
            if (sc.composite) {
              const compKeys = { value: "värde", growth: "tillväxt", dividend: "utdelning", mixed: "blandat" };
              Object.entries(sc.composite).filter(([, v]) => v != null).forEach(([k, v]) => {
                scoreParts.push(`${compKeys[k] || k}: ${v}/100`);
              });
            }
            if (sc.risk) scoreParts.push(`risk: ${sc.risk}`);
            if (sc.data?.peForward) scoreParts.push(`P/E(fwd): ${sc.data.peForward}`);
            if (sc.data?.dividendYield) scoreParts.push(`utd.avk: ${(sc.data.dividendYield * 100).toFixed(1)}%`);
            if (sc.data?.revenueGrowth) scoreParts.push(`oms.tillväxt: ${(sc.data.revenueGrowth * 100).toFixed(1)}%`);
            if (scoreParts.length > 0) line += ` | Scoring: ${scoreParts.join(", ")}`;
          }
          return line;
        }).join("\n"));
      }
      if (watched.length > 0) {
        parts.push("BEVAKADE (ej ägda):\n" + watched.slice(0, 10).map(c =>
          `${c.name} (${c.ticker}): ${c.price} ${c.currency}, idag ${c.changePercent > 0 ? "+" : ""}${c.changePercent}%`
        ).join("\n"));
      }
    }
    if (context.indices?.length > 0) {
      parts.push("INDEX:\n" + context.indices.map(i =>
        `${i.name} (${i.symbol}): ${i.price}, ${i.change > 0 ? "+" : ""}${i.change}%`
      ).join("\n"));
    }
    if (context.commodities?.length > 0) {
      parts.push("RÅVAROR & FX:\n" + context.commodities.map(c =>
        `${c.name} (${c.display}): ${c.price} ${c.unit}, ${c.change > 0 ? "+" : ""}${c.change}%`
      ).join("\n"));
    }
    if (context.investorProfile) {
      const p = context.investorProfile;
      const typeMap = { value: "Värdeinvesterare", growth: "Tillväxtinvesterare", dividend: "Utdelningsinvesterare", index: "Indexinvesterare", mixed: "Blandat" };
      const riskMap = { low: "Låg risk", medium: "Medel risk", high: "Hög risk" };
      const focusMap = { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" };
      const geoMap = { nordic: "Norden", global: "Globalt", both: "Blandat" };
      const interestLabels = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };
      const profileParts = [
        typeMap[p.investorType],
        riskMap[p.riskProfile],
        focusMap[p.focus],
        geoMap[p.geography] ? `Fokus: ${geoMap[p.geography]}` : null,
        p.interests?.length > 0 ? `Intressen: ${p.interests.map(i => interestLabels[i] || i).join(", ")}` : null,
      ].filter(Boolean);
      parts.push("INVESTERARPROFIL:\n" + profileParts.join(", "));
    }

    if (parts.length > 0) {
      systemPrompt += "\n\nAktuell marknadsdata:\n" + parts.join("\n\n");
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
