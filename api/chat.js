import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages required" });
  }

  let systemPrompt = `Du är en finansassistent i appen Thesian. Svara på svenska, kort och koncist. Du har tillgång till användarens portfölj och marknadsdata.`;

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
