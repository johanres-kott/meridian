// Vinstandelsstiftelse (t.ex. Scania via PRI Stiftelsetjänst): arbetsgivaren
// avsätter en andel per år, varje årgång är låst ett antal år (oftast 5) och
// kan sedan tas ut — utbetalning sker en gång om året. Värdet = summan av
// årgångarna; det intressanta är NÄR pengarna blir tillgängliga.
// metadata: { provider, lockYears, tranches: [{ year, value }] }

export const DEFAULT_LOCK_YEARS = 5;

export function trancheUnlockYear(tranche, lockYears = DEFAULT_LOCK_YEARS) {
  return Number(tranche.year) + Number(lockYears);
}

// Sammanfattning för en stiftelse: totalt, tillgängligt nu, nästa frisläpp.
export function summarizeTranches(tranches = [], lockYears = DEFAULT_LOCK_YEARS, nowYear = new Date().getFullYear()) {
  const rows = tranches
    .map(t => ({ year: Number(t.year), value: Number(t.value) }))
    .filter(t => Number.isFinite(t.year) && Number.isFinite(t.value) && t.value > 0)
    .sort((a, b) => a.year - b.year);
  const total = rows.reduce((s, t) => s + t.value, 0);
  const available = rows.filter(t => trancheUnlockYear(t, lockYears) <= nowYear).reduce((s, t) => s + t.value, 0);
  const locked = total - available;
  const upcoming = rows.filter(t => trancheUnlockYear(t, lockYears) > nowYear);
  const next = upcoming.length ? { year: trancheUnlockYear(upcoming[0], lockYears), value: upcoming[0].value } : null;
  // Frisläpp per år framåt (flera årgångar kan ha samma frisläppsår om låstiden ändrats)
  const schedule = [];
  for (const t of upcoming) {
    const y = trancheUnlockYear(t, lockYears);
    const e = schedule.find(s => s.year === y);
    if (e) e.value += t.value; else schedule.push({ year: y, value: t.value });
  }
  return { rows, total, available, locked, next, schedule };
}

// Kort beskrivning för listor ("Min ekonomi"): "låst · nästa 12 000 kr 2027" osv.
export function vinstandelHint(metadata, nowYear = new Date().getFullYear()) {
  if (!metadata?.tranches?.length) return null;
  const s = summarizeTranches(metadata.tranches, metadata.lockYears ?? DEFAULT_LOCK_YEARS, nowYear);
  const fmt = v => `${Math.round(v).toLocaleString("sv-SE")} kr`;
  const parts = [];
  if (s.available > 0) parts.push(`${fmt(s.available)} tillgängligt`);
  if (s.next) parts.push(`nästa ${fmt(s.next.value)} ${s.next.year}`);
  if (!parts.length && s.locked > 0) parts.push("låst");
  return parts.join(" · ") || null;
}
