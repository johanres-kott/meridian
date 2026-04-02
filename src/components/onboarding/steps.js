export const STEPS = [
  {
    id: "investorType",
    title: "Vilken typ av investerare är du?",
    subtitle: "Välj den stil som bäst beskriver dig.",
    options: [
      { value: "value", label: "Värdeinvesterare", desc: "Köper undervärderade bolag med stark fundamental" },
      { value: "growth", label: "Tillväxtinvesterare", desc: "Fokus på snabbväxande bolag och framtida potential" },
      { value: "dividend", label: "Utdelningsinvesterare", desc: "Stabil avkastning genom utdelningar" },
      { value: "index", label: "Indexinvesterare", desc: "Bred marknadsexponering, låga avgifter" },
      { value: "mixed", label: "Blandat", desc: "Kombinerar flera strategier" },
    ],
  },
  {
    id: "experience",
    title: "Hur erfaren är du som investerare?",
    subtitle: "Detta hjälper oss anpassa språk och förklaringar.",
    options: [
      { value: "beginner", label: "Nybörjare", desc: "Ny till aktier och investeringar. Vill ha enkla förklaringar" },
      { value: "intermediate", label: "Har lite erfarenhet", desc: "Förstår grunderna men vill lära mig mer" },
      { value: "advanced", label: "Erfaren", desc: "God kunskap om marknaden. Vill ha djupgående analys" },
    ],
  },
  {
    id: "riskProfile",
    title: "Hur ser din riskprofil ut?",
    subtitle: "Hur mycket svängningar klarar du av?",
    options: [
      { value: "low", label: "Låg risk", desc: "Stabilitet och kapitalbevarande. Föredrar stora, etablerade bolag" },
      { value: "medium", label: "Medel", desc: "Balanserad portfölj med mix av stabilt och tillväxt" },
      { value: "high", label: "Hög risk", desc: "Okej med stora svängningar för högre potential. Small caps, tillväxtbolag" },
    ],
  },
  {
    id: "focus",
    title: "Vad fokuserar du på?",
    subtitle: "Välj det som passar dig bäst.",
    options: [
      { value: "dividends", label: "Utdelning", desc: "Kassaflöde och passiv inkomst" },
      { value: "appreciation", label: "Kursökning", desc: "Kapitalvinst och tillväxt" },
      { value: "both", label: "Båda", desc: "Totalavkastning — utdelning + kursökning" },
    ],
    extra: {
      id: "geography",
      title: "Geografiskt fokus?",
      options: [
        { value: "nordic", label: "Sverige/Norden" },
        { value: "global", label: "Globalt" },
        { value: "both", label: "Blandat" },
      ],
    },
  },
  {
    id: "interests",
    title: "Vad intresserar dig?",
    subtitle: "Välj allt som stämmer — vi hittar bolag som matchar.",
    multi: true,
    options: [
      { value: "tech", label: "Tech & AI" },
      { value: "finance", label: "Bank & Finans" },
      { value: "industry", label: "Industri & Tillverkning" },
      { value: "healthcare", label: "Hälsovård & Läkemedel" },
      { value: "realestate", label: "Fastigheter" },
      { value: "food", label: "Mat & Livsmedel" },
      { value: "energy", label: "Energi & Olja" },
      { value: "gold", label: "Guld & Ädelmetaller" },
      { value: "sustainability", label: "Hållbarhet & Klimat" },
      { value: "gaming", label: "Gaming & Underhållning" },
      { value: "fashion", label: "Mode & Retail" },
      { value: "defense", label: "Försvar & Säkerhet" },
      { value: "ev", label: "Elbilar & Mobilitet" },
      { value: "crypto", label: "Krypto & Blockchain" },
    ],
  },
];

export const PROFILE_EXPLANATIONS = {
  investorType: {
    value: { label: "Värdeinvesterare", explanation: "Du letar efter bolag som handlas under sitt verkliga värde. Thesion prioriterar bolag med stark fundamental — lågt P/E, hög avkastning på kapital och bra kassaflöden." },
    growth: { label: "Tillväxtinvesterare", explanation: "Du satsar på bolag med stark tillväxt. Thesion prioriterar snabbväxande bolag med hög omsättningstillväxt och skalbar affärsmodell — även om de har högt P/E." },
    dividend: { label: "Utdelningsinvesterare", explanation: "Du vill ha löpande utdelningar. Thesion prioriterar bolag med hög och stabil direktavkastning, lång utdelningshistorik och hållbar utdelningsandel." },
    index: { label: "Indexinvesterare", explanation: "Du föredrar bred exponering. Thesion visar hur din portfölj presterar mot index och hjälper dig hitta kompletterande fonder med låga avgifter." },
    mixed: { label: "Blandat", explanation: "Du kombinerar flera strategier. Thesion ger en balanserad mix av värde, tillväxt och utdelning i sina förslag." },
  },
  riskProfile: {
    low: { label: "Låg risk", explanation: "Vi filtrerar bort spekulativa bolag och small caps. Fokus på stora, etablerade bolag med låg volatilitet. Investeringsplaner sprids över tid (DCA) för att minska timingrisken." },
    medium: { label: "Medel risk", explanation: "En balans mellan stabila storbolag och mer spännande tillväxtcase. Investeringsplaner sprids över 2-3 månader." },
    high: { label: "Hög risk", explanation: "Du kan tåla stora kurssvängningar. Vi inkluderar small caps och tillväxtbolag med högre potential. Investeringar görs gärna direkt (lump sum) för bäst historisk avkastning." },
  },
  experience: {
    beginner: { label: "Nybörjare", explanation: "Mats (AI-assistenten) förklarar allt med enkla ord och undviker facktermer. Tooltips och förklaringar visas extra tydligt." },
    intermediate: { label: "Lite erfarenhet", explanation: "Mats använder vanliga finanstermer men förklarar mer avancerade begrepp. Du får en bra mix av pedagogik och djup." },
    advanced: { label: "Erfaren", explanation: "Mats ger djupgående analys med nyckeltal, trender och jämförelser utan att hålla tillbaka." },
  },
};
