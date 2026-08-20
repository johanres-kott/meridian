// Delad matematik för manuella tillgångar/skulder (manual_assets):
//  - ägarandel: value_sek är HELA tillgången/lånet, metadata.ownershipShare (%)
//    säger hur stor del som är användarens. Nettoförmögenhet, listor, donut,
//    cron och räntekoppling räknar alltid på andelen ("din andel").
//  - startdatum: när posten ska börja räknas i historiken — köpdatum för
//    bostad/fordon, lånets eget startdatum (annars den kopplade tillgångens),
//    vinstandel årgång för årgång (1 jan respektive år), annars när den lades in.
// Inget hittas på: värden hålls platta bakåt (nuvarande värde), märkt estimerat.

export function shareOf(row) {
  const s = Number(row?.metadata?.ownershipShare);
  if (!Number.isFinite(s) || s <= 0 || s > 100) return 1;
  return s / 100;
}

export function ownedValue(row) {
  return Number(row?.value_sek || 0) * shareOf(row);
}

function isoDate(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

// Startdatum (YYYY-MM-DD) för en post. Lån ärver kopplad tillgångs startdatum.
export function startDateOf(row, allRows = []) {
  const m = row?.metadata || {};
  if (m.startDate) return isoDate(m.startDate);
  if (m.purchaseDate) return isoDate(m.purchaseDate);
  if (row?.is_debt && m.linkedAssetId) {
    const asset = allRows.find(r => r.id === m.linkedAssetId);
    if (asset) {
      const am = asset.metadata || {};
      if (am.purchaseDate) return isoDate(am.purchaseDate);
      if (am.startDate) return isoDate(am.startDate);
    }
  }
  return row?.created_at ? isoDate(row.created_at) : null;
}

// Värde (din andel) av en post på ett givet datum. Vinstandel byggs upp
// årgång för årgång; övrigt är 0 före startdatum och nuvarande värde därefter.
export function ownedValueAt(row, dateStr, allRows = []) {
  const m = row?.metadata || {};
  if (row?.kind === "vinstandel" && Array.isArray(m.tranches) && m.tranches.length) {
    const year = Number(String(dateStr).slice(0, 4));
    const sum = m.tranches.reduce((s, t) => (Number(t.year) <= year && Number(t.value) > 0 ? s + Number(t.value) : s), 0);
    return sum * shareOf(row);
  }
  const start = startDateOf(row, allRows);
  if (start && dateStr < start) return 0;
  return ownedValue(row);
}

// Summa tillgångar − skulder (din andel) på ett datum
export function manualNetAt(rows, dateStr) {
  let net = 0;
  for (const r of rows || []) {
    const v = ownedValueAt(r, dateStr, rows);
    net += r.is_debt ? -v : v;
  }
  return net;
}

// Tidigaste startdatum bland posterna (för att veta hur långt bak historiken ska ritas)
export function earliestStart(rows) {
  let min = null;
  for (const r of rows || []) {
    let d = startDateOf(r, rows);
    if (r.kind === "vinstandel" && Array.isArray(r.metadata?.tranches)) {
      const ys = r.metadata.tranches.map(t => Number(t.year)).filter(Number.isFinite);
      if (ys.length) d = `${Math.min(...ys)}-01-01`;
    }
    if (d && (!min || d < min)) min = d;
  }
  return min;
}

// Bygger nettoförmögenhetsserie: portföljens historik (punkter {date, value})
// + pension (platt) + manuella poster efter startdatum. Före första
// portföljpunkten hålls portföljen platt på första kända värdet (estimerat).
// Returnerar [{ date, value, estimated }], ett steg per `stepDays`.
export function reconstructNetWorthSeries({ portfolioPoints = [], pensionValue = 0, manualRows = [], fromDate, toDate, stepDays = 1 }) {
  const pts = [...portfolioPoints].filter(p => p?.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  const firstPortfolio = pts[0]?.date || null;
  const start = fromDate || earliestStart(manualRows) || firstPortfolio;
  if (!start) return [];
  const end = toDate || pts[pts.length - 1]?.date || start;

  const out = [];
  let i = 0;
  let lastPortfolio = pts[0]?.value ?? 0;
  const cur = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");
  while (cur <= endD) {
    const d = cur.toISOString().slice(0, 10);
    while (i < pts.length && pts[i].date <= d) { lastPortfolio = pts[i].value; i++; }
    const estimated = !firstPortfolio || d < firstPortfolio;
    out.push({ date: d, value: lastPortfolio + (pensionValue || 0) + manualNetAt(manualRows, d), estimated });
    cur.setUTCDate(cur.getUTCDate() + stepDays);
  }
  // Se till att sista datumet alltid finns med
  if (out.length && out[out.length - 1].date !== end) {
    out.push({ date: end, value: lastPortfolio + (pensionValue || 0) + manualNetAt(manualRows, end), estimated: false });
  }
  return out;
}
