import Anthropic from "@anthropic-ai/sdk";
import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res, 10)) return; // Stricter: 10 req/min for AI chat
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages required" });
  }

  let systemPrompt = `Du är en finansassistent i appen Thesion. Svara på svenska, kort och koncist. Du har tillgång till användarens portfölj och marknadsdata.`;

  // Add profile-specific AI instructions
  if (context?.investorProfile) {
    const p = context.investorProfile;
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
    systemPrompt += "\n\n" + (profileInstructions[p.investorType] || "");
    systemPrompt += " " + (riskInstructions[p.riskProfile] || "");
    if (p.interests?.length > 0) {
      const interestLabels = { tech: "Tech & AI", finance: "Finans", industry: "Industri", healthcare: "Hälsovård", realestate: "Fastigheter", food: "Mat & Livsmedel", energy: "Energi", gold: "Guld", sustainability: "Hållbarhet", gaming: "Gaming", fashion: "Mode", defense: "Försvar", ev: "Elbilar", crypto: "Krypto" };
      systemPrompt += ` Användaren är intresserad av: ${p.interests.map(i => interestLabels[i] || i).join(", ")}.`;
    }
  }

  if (context) {
    const parts = [];
    if (context.portfolio?.length > 0) {
      parts.push("PORTFÖLJ:\n" + context.portfolio.map(c =>
        `${c.name} (${c.ticker}): ${c.price} ${c.currency}, idag ${c.changePercent > 0 ? "+" : ""}${c.changePercent}%`
      ).join("\n"));
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
