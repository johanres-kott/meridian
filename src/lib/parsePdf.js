import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

function parseSwedishNumber(str) {
  if (!str || typeof str !== "string") return null;
  const cleaned = str.replace(/\u00a0/g, "").replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function groupByY(items, tolerance = 3) {
  const rows = [];
  const sorted = [...items].sort((a, b) => b.y - a.y);

  for (const item of sorted) {
    if (!item.text) continue;
    const existing = rows.find((r) => Math.abs(r.y - item.y) <= tolerance);
    if (existing) {
      existing.items.push(item);
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }

  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  return rows;
}

// Find which page contains "Depåinnehav" and only parse that page
async function findHoldingsPage(pdf) {
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ").toLowerCase();
    if (text.includes("depåinnehav") || text.includes("depainnehav")) {
      return i;
    }
  }
  return -1;
}

// Avanza "Kontobesked" PDF — each holding is three rows on the Depåinnehav page:
//   Row 1 (name):    "AURORA INNOVATION"
//   Row 2 (values):  "30 057,96"   "20 774,62"
//   Row 3 (detail):  "492 st | Kurs 4,68 USD"

export async function parseAvanzaPdf(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const holdingsPageNum = await findHoldingsPage(pdf);
  if (holdingsPageNum === -1) {
    throw new Error("Kunde inte hitta 'Depåinnehav'-sidan i PDF:en.");
  }

  const page = await pdf.getPage(holdingsPageNum);
  const content = await page.getTextContent();
  const items = content.items
    .map((item) => ({
      text: item.str.trim(),
      x: Math.round(item.transform[4]),
      y: Math.round(item.transform[5]),
    }))
    .filter((i) => i.text);

  const rows = groupByY(items);

  // Find header row: "Innehav" + "Anskaffningsvärde"
  const headerIdx = rows.findIndex((row) => {
    const text = row.items.map((i) => i.text.toLowerCase()).join(" ");
    return text.includes("innehav") && text.includes("anskaffning");
  });

  if (headerIdx === -1) {
    throw new Error("Kunde inte hitta tabellhuvudet i PDF:en.");
  }

  const holdings = [];
  const dataRows = rows.slice(headerIdx + 1);

  let i = 0;
  while (i < dataRows.length) {
    const row = dataRows[i];
    const rowText = row.items.map((it) => it.text).join(" ");

    // Stop at "Totalt värde"
    if (rowText.toLowerCase().includes("totalt v")) break;

    // Name row: left-aligned text, not a number, not a "st |" detail row
    const firstItem = row.items[0];
    const isNameRow =
      firstItem &&
      firstItem.x < 100 &&
      parseSwedishNumber(firstItem.text) === null &&
      !rowText.match(/^\d+\s*st\s*\|/i);

    if (isNameRow && i + 2 < dataRows.length) {
      const name = row.items.map((it) => it.text).join(" ").trim();

      // Values row: contains the anskaffningsvärde number(s)
      const valuesRow = dataRows[i + 1];

      // Detail row: "492 st | Kurs 4,68 USD"
      const detailRow = dataRows[i + 2];
      const detailText = detailRow.items.map((it) => it.text).join(" ");
      const detailMatch = detailText.match(/(\d+)\s*st\s*\|/i);
      const antal = detailMatch ? parseInt(detailMatch[1], 10) : null;

      // First number in values row = anskaffningsvärde (total cost)
      let anskaffningsVarde = null;
      for (const item of valuesRow.items) {
        const num = parseSwedishNumber(item.text);
        if (num !== null) {
          anskaffningsVarde = num;
          break;
        }
      }

      // GAV = total cost / shares
      const gav =
        anskaffningsVarde && antal
          ? Math.round((anskaffningsVarde / antal) * 100) / 100
          : null;

      holdings.push({ name, shares: antal, gav });
      i += 3;
    } else {
      i++;
    }
  }

  return holdings;
}
