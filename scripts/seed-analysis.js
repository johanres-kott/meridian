/**
 * Seed script — inserts the ag equipment analysis into Supabase.
 * Run once: node scripts/seed-analysis.js
 *
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY in .env or .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env vars manually (no dotenv dependency)
for (const envFile of [".env", ".env.local"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {}
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

const analysis = {
  slug: "ag-equipment",
  title: "Jordbruksmaskiner: Deere vs CNH vs AGCO",
  subtitle: "Sektoranalys — Premium",
  date: "2026-04",
  sector: "Industrials",
  tags: ["Sektoranalys", "Jordbruk", "USA"],
  summary: "En djupanalys av de tre största tillverkarna av jordbruksmaskiner — Deere & Company, CNH Industrial och AGCO Corporation. Marknaden är i en utdragen cyklisk nedgång: kombinerade intäkter föll ~26% från 2023-toppen ($100B till $74B). Analysen jämför finansiella nyckeltal, marknadsposition, teknologisk moat och värdering baserat på FY2025-data.",
  companies: [
    {
      name: "Deere & Company",
      ticker: "DE",
      verdict: "Marknadsledare — teknikmoat värderad till $68B av marknaden",
      color: "#367c2b",
      metrics: {
        marketCap: "~$164B",
        revenue: "$45.7B",
        netIncome: "$5.03B",
        rnd: "~5.0% av omsättning",
        moat: "Bred — See & Spray AI på 5M acres",
      },
      strengths: [
        "Världens största — 2.5x CNH, 4.5x AGCO i omsättning",
        "See & Spray AI på 5M acres + autonoma traktorer (CES 2025)",
        "~60% marknadsandel i nordamerikanska stortraktor/tröskor",
        "5 000+ återförsäljare globalt med exklusivitetsavtal",
        "SOTP visar $68B teknikvärde — 41% av börsvärdet",
      ],
      risks: [
        "Teknikpremien redan inprisad — kräver >10% av intäkterna från precision ag",
        "Intäkterna -25% från FY2023-toppen, cyklisk nedgång pågår",
        "Tariffer beräknas kosta $600M 2025, $1.2B projicerat 2026",
        "Rätt-att-reparera-debatt hotar serviceintäkter",
      ],
    },
    {
      name: "CNH Industrial",
      ticker: "CNHI",
      verdict: "Billig på mid-cycle, mindre så på trough — Exor-kontrollerad",
      color: "#cc0000",
      metrics: {
        marketCap: "~$15B",
        revenue: "$18.1B",
        netIncome: "$0.51B",
        agMargin: "10.5% Ag adj. EBIT",
        moat: "Smal — dubbla varumärken kannibaliserar",
      },
      strengths: [
        "Lägst värderad — mid-cycle DCF visar +21% uppsida ($11.53)",
        "Exor/Agnelli (26.9% equity, 45.3% röster) ger långsiktig ägare",
        "Post-Iveco renodling — ren jordbruk/bygg-spel",
        "Stark position i Europa och Latinamerika via New Holland",
      ],
      risks: [
        "Explicit 10-årsmodell visar -13% nedsida genom troughåren",
        "Ag adj. EBIT-marginal 10.5% — brantare vinstfall än Deere",
        "Case IH + New Holland skapar intern konkurrens",
        "Svagare tech-plattform — halkar efter Deere i precision ag",
      ],
    },
    {
      name: "AGCO Corporation",
      ticker: "AGCO",
      verdict: "Stark recovery med asterisker — Fendt är kronjuvelen",
      color: "#e31937",
      metrics: {
        marketCap: "~$9B",
        revenue: "$10.1B",
        netIncome: "$0.73B",
        fcf: "$740M rekord-FCF (188% konvertering)",
        moat: "Smal — Fendt-premium + EM-volym",
      },
      strengths: [
        "Fendt — ledande premiumtraktor i Europa (flest registreringar i Tyskland)",
        "Rekord-FCF $740M i FY2025, 188% konvertering",
        "Högst aktieägaravkastning: ~3.8% via $250M ASR + 13 års utdelningssvit",
        "TAFE (16.8%) ger tillgång till Indiens traktormarknad — världens största",
      ],
      risks: [
        "Justerad EPS $5.28 vs rapporterad $9.84 — engångseffekter flattar bilden",
        "~50% Europa/ME-exponering — känslig för EU:s jordbrukspolitik (CAP)",
        "Brantast omsättningstapp: -30% från FY2023-toppen",
        "Svagast position i Nordamerika — saknar konkurrenskraftigt stortraktor-erbjudande",
      ],
    },
  ],
  conclusion: "Marknaden är i en cyklisk nedgång (~26% från toppen) med osäker tidslinje för recovery. Deere är marknadsledaren med bredast moat och teknikförsprång, men marknaden prisar redan in $68B teknikvärde — uppsidan kräver att precision ag skalas över 10% av intäkterna. CNH erbjuder mest värde på mid-cycle-basis (+21% DCF-uppsida) men har nedsida genom trough-åren. AGCO visar stark recovery med rekord-FCF, men justerade siffror avslöjar engångseffekter. För långsiktiga investerare: Deere för kvalitet, CNH för värde, AGCO för Fendt-premium och EM-exponering.",
  pdf_url: "/analyses/ag-equipment-deep-dive.pdf",
  published: true,
};

async function seed() {
  const { data, error } = await supabase
    .from("analyses")
    .upsert(analysis, { onConflict: "slug" })
    .select()
    .single();

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Analysis seeded:", data.slug, data.id);
}

seed();
