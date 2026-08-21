// Kontoutdrag (CSV) från svenska banker → saldo + månadssammanställning.
// Allt sker lokalt i webbläsaren — filen laddas aldrig upp och transaktionerna
// sparas inte. Formaten är grundade i riktiga exporter:
//   Nordea:  Bokföringsdag;Belopp;Avsändare;Mottagare;Rubrik;Saldo;Valuta
//            (semikolon, svensk taltyp "1 234,56", "Reserverad" på ej bokförda)
//   SEB:     Bokföringsdatum;Valutadatum;Verifikationsnummer;Text/mottagare;Belopp;Saldo
// Okända banker faller tillbaka på generisk kolumnigenkänning (datum + belopp).

export const BANK_LABELS = { nordea: "Nordea", seb: "SEB", okand: "Okänd bank" };

// --- Talformat: "1 234,56" (mellanslag/NBSP som tusental, decimalkomma).
// Innehåller strängen komma tolkas punkt som tusentalsavgränsare.
export function parseSwedishNumber(value) {
  const s = String(value ?? "").replace(/[\s\u00a0\u202f]/g, "");
  if (!s) return null;
  const cleaned = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// --- Datum: YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, YYYYMMDD. Allt annat
// (t.ex. Nordeas "Reserverad" för ej bokförda köp) ger null → raden hoppas.
export function parseStatementDate(value) {
  const t = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(t)) return t.replace(/\//g, "-");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) { const [d, m, y] = t.split("/"); return `${y}-${m}-${d}`; }
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  return null;
}

// --- Minimal citat-medveten CSV-radläsare (inga beroenden).
function splitLine(line, delim) {
  const out = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function detectDelimiter(lines) {
  // Välj den avgränsare som ger flest kolumner konsekvent över raderna.
  const candidates = [";", "\t", ","];
  let best = ";", bestScore = 0;
  for (const d of candidates) {
    const counts = lines.slice(0, 10).map(l => splitLine(l, d).length).filter(c => c > 1);
    if (!counts.length) continue;
    const mode = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];
    const consistent = counts.filter(c => c === mode).length;
    const score = mode * consistent;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function findColumn(headers, candidates, { exact = false } = {}) {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const cand of candidates) {
    const i = lower.indexOf(cand.toLowerCase());
    if (i >= 0) return i;
  }
  if (exact) return -1;
  for (const cand of candidates) {
    const i = lower.findIndex(h => h.includes(cand.toLowerCase()));
    if (i >= 0) return i;
  }
  return -1;
}

const DATE_HEADERS = ["bokföringsdag", "bokfdag", "bokföringsdatum", "datum", "date", "transaktionsdatum"];
const AMOUNT_HEADERS = ["belopp", "amount", "summa"];
const DESC_HEADERS = ["rubrik", "text/mottagare", "transaktion", "text", "beskrivning", "meddelande", "mottagare", "namn", "avsändare", "description"];
const BALANCE_HEADERS = ["saldo", "balance", "bokfört saldo"];
const CURRENCY_HEADERS = ["valuta", "currency"];

export function detectBank(headers) {
  const h = headers.join(",").toLowerCase();
  if (h.includes("bokföringsdag") || h.includes("bokfdag") ||
      (h.includes("datum") && h.includes("transaktion") && h.includes("saldo"))) return "nordea";
  if (h.includes("verifikationsnummer") || h.includes("text/mottagare") ||
      (h.includes("bokföringsdatum") && h.includes("valutadatum"))) return "seb";
  return "okand";
}

// Månadssammanställning av bokförda SEK-rader, nyaste först.
// partial = exportens period täcker inte hela månaden (första/sista månaden).
function summarizeMonths(txs, period) {
  const byMonth = new Map();
  for (const t of txs) {
    const month = t.date.slice(0, 7);
    let m = byMonth.get(month);
    if (!m) { m = { month, inSek: 0, outSek: 0, count: 0 }; byMonth.set(month, m); }
    if (t.amount >= 0) m.inSek += t.amount; else m.outSek += -t.amount;
    m.count++;
  }
  const lastDayOf = (month) => {
    const [y, mo] = month.split("-").map(Number);
    return `${month}-${String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, "0")}`;
  };
  return [...byMonth.values()]
    .map(m => ({
      ...m,
      netSek: m.inSek - m.outSek,
      partial: (m.month === period.from.slice(0, 7) && period.from.slice(8) !== "01") ||
               (m.month === period.to.slice(0, 7) && period.to !== lastDayOf(m.month)),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

// Huvudingång: rå filtext → strukturerat resultat. Kastar aldrig — fel
// rapporteras i errors[] och transaktionslistan blir tom.
export function parseBankStatement(text) {
  const empty = { bank: "okand", transactions: [], latestBalance: null, period: null, monthly: [], skippedPending: 0, warnings: [], errors: [] };
  const lines = String(text ?? "").split(/\r\n|\n|\r/).filter(l => l.trim() !== "");
  if (lines.length < 2) return { ...empty, errors: ["Filen innehåller för få rader för att vara ett kontoutdrag."] };

  const delim = detectDelimiter(lines);
  const rows = lines.map(l => splitLine(l, delim).map(c => c.trim()));

  // Rubrikraden är inte alltid rad 1 — vissa exporter har kontouppgifter överst.
  let headerIdx = -1, cols = null;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const headers = rows[i];
    const dateCol = findColumn(headers, DATE_HEADERS);
    const amountCol = findColumn(headers, AMOUNT_HEADERS);
    if (dateCol >= 0 && amountCol >= 0) {
      headerIdx = i;
      cols = {
        date: dateCol,
        amount: amountCol,
        desc: findColumn(headers, DESC_HEADERS),
        balance: findColumn(headers, BALANCE_HEADERS),
        // Exakt matchning — annars träffar "Valuta" SEB:s "Valutadatum".
        currency: findColumn(headers, CURRENCY_HEADERS, { exact: true }),
      };
      break;
    }
  }
  if (headerIdx < 0) {
    return { ...empty, errors: ["Kunde inte hitta kolumnrubriker (t.ex. Bokföringsdag/Datum och Belopp). Exportera kontoutdraget som CSV från din internetbank och försök igen."] };
  }

  const bank = detectBank(rows[headerIdx]);
  const warnings = [];
  const transactions = [];
  let skippedPending = 0;
  let skippedCurrency = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= Math.max(cols.date, cols.amount)) continue;
    const rawDate = row[cols.date];
    if (!String(rawDate ?? "").trim()) continue;
    const date = parseStatementDate(rawDate);
    if (!date) { skippedPending++; continue; } // t.ex. "Reserverad"
    const amount = parseSwedishNumber(row[cols.amount]);
    if (amount == null || amount === 0) continue;
    const currency = cols.currency >= 0 ? String(row[cols.currency] || "").trim().toUpperCase() : "";
    if (currency && currency !== "SEK") { skippedCurrency++; continue; }
    transactions.push({
      date,
      amount,
      description: cols.desc >= 0 ? String(row[cols.desc] || "").trim() : "",
      balance: cols.balance >= 0 ? parseSwedishNumber(row[cols.balance]) : null,
      fileOrder: i,
    });
  }

  if (!transactions.length) {
    return { ...empty, bank, skippedPending, errors: ["Inga bokförda transaktioner kunde läsas ur filen."] };
  }

  if (skippedPending > 0) warnings.push(`${skippedPending} ej bokförd${skippedPending === 1 ? "" : "a"} rad${skippedPending === 1 ? "" : "er"} (t.ex. reserverade köp) hoppades över.`);
  if (skippedCurrency > 0) warnings.push(`${skippedCurrency} rad${skippedCurrency === 1 ? "" : "er"} i annan valuta än SEK hoppades över.`);

  const dates = transactions.map(t => t.date).sort();
  const period = { from: dates[0], to: dates[dates.length - 1] };

  // Senaste saldo = det löpande saldot på den nyaste bokförda raden. Filens
  // sorteringsordning avgör vilken ände som är nyast; bland raderna på det
  // nyaste datumet tas den som ligger närmast filens nyaste ände.
  let latestBalance = null;
  if (cols.balance >= 0) {
    const maxDate = period.to;
    const candidates = transactions.filter(t => t.date === maxDate && t.balance != null);
    if (candidates.length) {
      const firstDate = transactions[0].date;
      const lastDate = transactions[transactions.length - 1].date;
      const newestFirst = firstDate >= lastDate;
      const pick = newestFirst
        ? candidates.reduce((a, b) => (b.fileOrder < a.fileOrder ? b : a))
        : candidates.reduce((a, b) => (b.fileOrder > a.fileOrder ? b : a));
      latestBalance = { value: pick.balance, date: maxDate };
    }
  }
  if (cols.balance >= 0 && !latestBalance) warnings.push("Saldokolumnen fanns men gick inte att läsa.");

  const monthly = summarizeMonths(transactions, period);

  return {
    bank,
    transactions: transactions.map(t => ({ date: t.date, amount: t.amount, description: t.description, balance: t.balance })),
    latestBalance,
    period,
    monthly,
    skippedPending,
    warnings,
    errors: [],
  };
}

// Filer från internetbanker är ibland Latin-1 (å/ä/ö blir annars fel).
// Prova UTF-8 strikt först, fall tillbaka på ISO-8859-1.
export function decodeStatementBuffer(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
}
