// Onboarding = ekonomiprofil (inte investerarprofil). Appen handlar om att få
// koll på sin ekonomi långsiktigt, planera framåt och förstå — frågorna
// speglar det. Svaren härleds bakåtkompatibelt till investorType/riskProfile/
// experience (deriveLegacyProfile) eftersom score-systemet, bolagssidan och
// förslagen läser dem. Ingen fråga får bli personlig rådgivning.

export const STEPS = [
  {
    id: "lifeStage",
    title: "Var i livet är du?",
    subtitle: "Hjälper oss prioritera rätt — buffert och bostad betyder olika saker i olika skeden.",
    options: [
      { value: "starting", label: "I början", desc: "Första jobbet, första sparandet. Vill bygga grunden rätt." },
      { value: "building", label: "Bygger upp", desc: "Bostad, kanske familj — mycket händer och mycket kostar." },
      { value: "established", label: "Etablerad", desc: "Ekonomin rullar. Vill optimera och tänka längre fram." },
      { value: "preRetire", label: "Närmar mig pension", desc: "Vill se att det räcker och planera uttag." },
    ],
  },
  {
    id: "situation",
    title: "Hur ser din ekonomi ut idag?",
    subtitle: "Kryssa i det som stämmer — vi visar bara det som är relevant för dig.",
    multi: true,
    options: [
      { value: "ownsHome", label: "Äger bostad" },
      { value: "hasMortgage", label: "Har bolån" },
      { value: "hasPension", label: "Har tjänstepension (ITP)" },
      { value: "hasSavings", label: "Har sparkonto eller buffert" },
      { value: "hasFunds", label: "Sparar i fonder" },
      { value: "hasStocks", label: "Äger aktier" },
      { value: "hasOtherLoans", label: "Har andra lån (bil, CSN, kredit)" },
    ],
  },
  {
    id: "goals",
    title: "Vad vill du med dina pengar?",
    subtitle: "Välj allt som stämmer — det blir dina första mål.",
    multi: true,
    options: [
      { value: "buffer", label: "Bygga en buffert" },
      { value: "overview", label: "Få koll på helheten" },
      { value: "payDown", label: "Betala av lån snabbare" },
      { value: "home", label: "Spara till bostad eller renovering" },
      { value: "longTerm", label: "Spara långsiktigt / till pension" },
      { value: "kids", label: "Spara till barnen" },
      { value: "dream", label: "Spara till något roligt (resa, bil, båt)" },
      { value: "invest", label: "Komma igång med fonder och aktier" },
    ],
  },
  {
    id: "style",
    title: "Hur vill du att sparandet ska kännas?",
    subtitle: "Det styr hur vi pratar om risk och vad vi lyfter fram.",
    options: [
      { value: "safe", label: "Tryggt och enkelt", desc: "Jag vill inte behöva tänka så mycket. Bred indexfond, buffert, inga överraskningar." },
      { value: "balanced", label: "Balanserat", desc: "Stabil bas, men jag vill gärna lära mig och lägga till lite själv." },
      { value: "active", label: "Engagerat", desc: "Jag tycker det är roligt att följa bolag och ta egna beslut ovanpå basen." },
    ],
    extra: {
      id: "experience",
      title: "Hur van är du vid sparande och investeringar?",
      options: [
        { value: "beginner", label: "Nybörjare" },
        { value: "intermediate", label: "Lite van" },
        { value: "advanced", label: "Van" },
      ],
    },
  },
];

// Härled de gamla fälten (investorType, riskProfile, experience, focus,
// geography, interests) ur nya svaren — befintlig kod fortsätter fungera.
export function deriveLegacyProfile(answers) {
  const style = answers.style || "balanced";
  const goals = answers.goals || [];
  const investorType = style === "safe" ? "index" : style === "active" ? "mixed" : "index";
  const riskProfile = style === "safe" ? "low" : style === "active" ? "high" : "medium";
  const focus = goals.includes("longTerm") || goals.includes("invest") ? "both" : "both";
  return {
    investorType,
    riskProfile,
    experience: answers.experience || "beginner",
    focus,
    geography: "both",
    interests: [],
  };
}

// Förklaringar i summeringen — pedagogiska, inte rådgivande.
export const PROFILE_EXPLANATIONS = {
  lifeStage: {
    starting: { label: "I början", explanation: "Vi lyfter fram buffert och en enkel bas i indexfonder — grunden som allt annat vilar på." },
    building: { label: "Bygger upp", explanation: "Bostad, bolån och belåningsgrad får plats i helheten, så du ser hela bilden — inte bara sparandet." },
    established: { label: "Etablerad", explanation: "Fokus på att optimera: avgifter, fördelning mellan tillgångsslag och hur nettoförmögenheten utvecklas." },
    preRetire: { label: "Närmar mig pension", explanation: "Pensionen blir en central del av helheten, tillsammans med vad bostaden och sparandet är värt." },
  },
  style: {
    safe: { label: "Tryggt och enkelt", explanation: "Vi håller det enkelt: bas i billig global indexfond, tydlig buffert, lugnt språk kring risk." },
    balanced: { label: "Balanserat", explanation: "Stabil bas i indexfonder, plus pedagogiska verktyg när du vill lägga till egna bolag ovanpå." },
    active: { label: "Engagerat", explanation: "Basen finns kvar — men du får bolagssidor, hälsosignaler och analys när du vill gräva." },
  },
  experience: {
    beginner: { label: "Nybörjare", explanation: "Vi förklarar begrepp i vardagsspråk och håller nyckeltalen få och tydliga." },
    intermediate: { label: "Lite van", explanation: "Vanliga termer används, mer avancerade begrepp förklaras." },
    advanced: { label: "Van", explanation: "Fler nyckeltal och djupare analys tillgängligt direkt." },
  },
};

export const GOAL_LABELS = {
  buffer: "Bygga en buffert", overview: "Få koll på helheten", payDown: "Betala av lån snabbare",
  home: "Spara till bostad eller renovering", longTerm: "Spara långsiktigt / till pension",
  kids: "Spara till barnen", dream: "Spara till något roligt", invest: "Komma igång med fonder och aktier",
};

export const SITUATION_LABELS = {
  ownsHome: "Äger bostad", hasMortgage: "Har bolån", hasPension: "Har tjänstepension",
  hasSavings: "Har sparkonto/buffert", hasFunds: "Sparar i fonder", hasStocks: "Äger aktier", hasOtherLoans: "Har andra lån",
};
