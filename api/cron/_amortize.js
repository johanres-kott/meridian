// Ren beräkning för automatisk månadsvis nedräkning av lån (opt-in per lån).
// Delas av api/cron/amortize-loans.js och enhetstesterna — ingen klientkod
// importeras (samma spegel-princip som net-worth-snapshot.js).

// "YYYY-MM-DD" ur ett Date eller en redan formaterad sträng
function toDateString(today) {
  if (typeof today === "string") return today.slice(0, 10);
  return today.toISOString().slice(0, 10);
}

// applyMonthlyAmortization(row, today) → { value_sek, metadata }-patch, eller
// null när inget ska göras. Körs bara för skulder där användaren uttryckligen
// slagit på autoAmortize och angett en amorteringstakt (% per år). Idempotent
// per kalendermånad via metadata.lastAmortizedAt — ett omkörningspass samma
// månad är ofarligt.
export function applyMonthlyAmortization(row, today) {
  if (!row || !row.is_debt) return null;
  const meta = row.metadata || {};
  if (meta.autoAmortize !== true) return null;

  const rate = Number(meta.amortizationRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;

  const value = Number(row.value_sek);
  if (!Number.isFinite(value) || value <= 0) return null;

  const todayStr = toDateString(today);
  const last = typeof meta.lastAmortizedAt === "string" ? meta.lastAmortizedAt : "";
  // Samma kalendermånad ("YYYY-MM") → redan nedräknad denna månad
  if (last.slice(0, 7) === todayStr.slice(0, 7)) return null;

  const deduction = value * rate / 100 / 12;
  const newValue = Math.max(0, Math.round(value - deduction));
  return {
    value_sek: newValue,
    metadata: { ...meta, lastAmortizedAt: todayStr },
  };
}
