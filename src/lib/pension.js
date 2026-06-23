// Helpers for preferences.pension data shape.
//
// New shape (entries-based):
//   {
//     itpType: "ITP1" | "ITP2" | null,
//     monthlyContribution: number | null,
//     entries: [
//       { id, provider, insuranceType: "fond" | "trad", currentValue, funds: [...] },
//       ...
//     ],
//   }
//
// Legacy shape (single-holding, flat):
//   { itpType, provider, insuranceType, funds, monthlyContribution, currentValue }
//
// getPensionEntries() returns entries[] regardless of shape — wraps legacy
// data into a single synthetic entry on read.

export function getPensionEntries(pension) {
  if (!pension) return [];
  if (Array.isArray(pension.entries)) return pension.entries;
  // Legacy: synthesize one entry if any legacy field is set.
  if (pension.provider || pension.insuranceType || pension.currentValue != null || (pension.funds && pension.funds.length)) {
    return [{
      id: "legacy",
      provider: pension.provider || null,
      insuranceType: pension.insuranceType || null,
      currentValue: pension.currentValue ?? null,
      funds: pension.funds || [],
    }];
  }
  return [];
}

export function getPensionTotalValue(pension) {
  const entries = getPensionEntries(pension);
  let total = 0;
  let any = false;
  for (const e of entries) {
    if (e.currentValue != null && Number.isFinite(Number(e.currentValue))) {
      total += Number(e.currentValue);
      any = true;
    }
  }
  return any ? total : null;
}

export function newPensionEntry() {
  return {
    id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    provider: "",
    insuranceType: "",
    currentValue: "",
    funds: [],
  };
}
