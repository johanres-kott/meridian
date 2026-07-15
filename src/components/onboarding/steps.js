export const getSteps = (t) => [
  {
    id: "investorType",
    title: t("onboardingModal.steps.investorType.title"),
    subtitle: t("onboardingModal.steps.investorType.subtitle"),
    options: [
      { value: "value", label: t("onboardingModal.steps.investorType.options.value.label"), desc: t("onboardingModal.steps.investorType.options.value.desc") },
      { value: "growth", label: t("onboardingModal.steps.investorType.options.growth.label"), desc: t("onboardingModal.steps.investorType.options.growth.desc") },
      { value: "dividend", label: t("onboardingModal.steps.investorType.options.dividend.label"), desc: t("onboardingModal.steps.investorType.options.dividend.desc") },
      { value: "index", label: t("onboardingModal.steps.investorType.options.index.label"), desc: t("onboardingModal.steps.investorType.options.index.desc") },
      { value: "mixed", label: t("onboardingModal.steps.investorType.options.mixed.label"), desc: t("onboardingModal.steps.investorType.options.mixed.desc") },
    ],
  },
  {
    id: "experience",
    title: t("onboardingModal.steps.experience.title"),
    subtitle: t("onboardingModal.steps.experience.subtitle"),
    options: [
      { value: "beginner", label: t("onboardingModal.steps.experience.options.beginner.label"), desc: t("onboardingModal.steps.experience.options.beginner.desc") },
      { value: "intermediate", label: t("onboardingModal.steps.experience.options.intermediate.label"), desc: t("onboardingModal.steps.experience.options.intermediate.desc") },
      { value: "advanced", label: t("onboardingModal.steps.experience.options.advanced.label"), desc: t("onboardingModal.steps.experience.options.advanced.desc") },
    ],
  },
  {
    id: "riskProfile",
    title: t("onboardingModal.steps.riskProfile.title"),
    subtitle: t("onboardingModal.steps.riskProfile.subtitle"),
    options: [
      { value: "low", label: t("onboardingModal.steps.riskProfile.options.low.label"), desc: t("onboardingModal.steps.riskProfile.options.low.desc") },
      { value: "medium", label: t("onboardingModal.steps.riskProfile.options.medium.label"), desc: t("onboardingModal.steps.riskProfile.options.medium.desc") },
      { value: "high", label: t("onboardingModal.steps.riskProfile.options.high.label"), desc: t("onboardingModal.steps.riskProfile.options.high.desc") },
    ],
  },
  {
    id: "focus",
    title: t("onboardingModal.steps.focus.title"),
    subtitle: t("onboardingModal.steps.focus.subtitle"),
    options: [
      { value: "dividends", label: t("onboardingModal.steps.focus.options.dividends.label"), desc: t("onboardingModal.steps.focus.options.dividends.desc") },
      { value: "appreciation", label: t("onboardingModal.steps.focus.options.appreciation.label"), desc: t("onboardingModal.steps.focus.options.appreciation.desc") },
      { value: "both", label: t("onboardingModal.steps.focus.options.both.label"), desc: t("onboardingModal.steps.focus.options.both.desc") },
    ],
    extra: {
      id: "geography",
      title: t("onboardingModal.steps.focus.extra.title"),
      options: [
        { value: "nordic", label: t("onboardingModal.steps.focus.extra.options.nordic") },
        { value: "global", label: t("onboardingModal.steps.focus.extra.options.global") },
        { value: "both", label: t("onboardingModal.steps.focus.extra.options.both") },
      ],
    },
  },
  {
    id: "interests",
    title: t("onboardingModal.steps.interests.title"),
    subtitle: t("onboardingModal.steps.interests.subtitle"),
    multi: true,
    options: [
      { value: "tech", label: t("onboardingModal.steps.interests.options.tech") },
      { value: "finance", label: t("onboardingModal.steps.interests.options.finance") },
      { value: "industry", label: t("onboardingModal.steps.interests.options.industry") },
      { value: "healthcare", label: t("onboardingModal.steps.interests.options.healthcare") },
      { value: "realestate", label: t("onboardingModal.steps.interests.options.realestate") },
      { value: "food", label: t("onboardingModal.steps.interests.options.food") },
      { value: "energy", label: t("onboardingModal.steps.interests.options.energy") },
      { value: "gold", label: t("onboardingModal.steps.interests.options.gold") },
      { value: "sustainability", label: t("onboardingModal.steps.interests.options.sustainability") },
      { value: "gaming", label: t("onboardingModal.steps.interests.options.gaming") },
      { value: "fashion", label: t("onboardingModal.steps.interests.options.fashion") },
      { value: "defense", label: t("onboardingModal.steps.interests.options.defense") },
      { value: "ev", label: t("onboardingModal.steps.interests.options.ev") },
      { value: "crypto", label: t("onboardingModal.steps.interests.options.crypto") },
    ],
  },
];

export const getProfileExplanations = (t) => ({
  investorType: {
    value: { label: t("onboardingModal.profile.investorType.value.label"), explanation: t("onboardingModal.profile.investorType.value.explanation") },
    growth: { label: t("onboardingModal.profile.investorType.growth.label"), explanation: t("onboardingModal.profile.investorType.growth.explanation") },
    dividend: { label: t("onboardingModal.profile.investorType.dividend.label"), explanation: t("onboardingModal.profile.investorType.dividend.explanation") },
    index: { label: t("onboardingModal.profile.investorType.index.label"), explanation: t("onboardingModal.profile.investorType.index.explanation") },
    mixed: { label: t("onboardingModal.profile.investorType.mixed.label"), explanation: t("onboardingModal.profile.investorType.mixed.explanation") },
  },
  riskProfile: {
    low: { label: t("onboardingModal.profile.riskProfile.low.label"), explanation: t("onboardingModal.profile.riskProfile.low.explanation") },
    medium: { label: t("onboardingModal.profile.riskProfile.medium.label"), explanation: t("onboardingModal.profile.riskProfile.medium.explanation") },
    high: { label: t("onboardingModal.profile.riskProfile.high.label"), explanation: t("onboardingModal.profile.riskProfile.high.explanation") },
  },
  experience: {
    beginner: { label: t("onboardingModal.profile.experience.beginner.label"), explanation: t("onboardingModal.profile.experience.beginner.explanation") },
    intermediate: { label: t("onboardingModal.profile.experience.intermediate.label"), explanation: t("onboardingModal.profile.experience.intermediate.explanation") },
    advanced: { label: t("onboardingModal.profile.experience.advanced.label"), explanation: t("onboardingModal.profile.experience.advanced.explanation") },
  },
});
