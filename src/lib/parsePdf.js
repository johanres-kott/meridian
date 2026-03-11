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

// Find which pages contain "Depåinnehav" holdings data.
// The holdings table can span multiple pages, so we find the first page
// with the header and continue through subsequent pages until we hit a
// different section or run out of pages.
async function findHoldingsPages(pdf) {
  const pages = [];
  let foundStart = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ").toLowerCase();

    if (!foundStart) {
      if (text.includes("depåinnehav") || text.includes("depainnehav")) {
        foundStart = true;
        pages.push(i);
      }
    } else {
      // Continue adding pages until we hit a clearly different section
      // (e.g., "Transaktioner", "Insättningar", "Uttag") or end of document.
      // If the page still has stock-like data (numbers, "st |"), include it.
      const isSectionBreak =
        (text.includes("transaktioner") || text.includes("insättningar") || text.includes("uttag")) &&
        !text.includes("innehav");
      if (isSectionBreak) break;
      pages.push(i);
    }
  }

  return pages;
}

// Avanza "Kontobesked" PDF — each holding is three rows on the Depåinnehav page:
//   Row 1 (name):    "AURORA INNOVATION"
//   Row 2 (values):  "30 057,96"   "20 774,62"
//   Row 3 (detail):  "492 st | Kurs 4,68 USD"

export async function parseAvanzaPdf(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const holdingsPageNums = await findHoldingsPages(pdf);
  if (holdingsPageNums.length === 0) {
    throw new Error("Kunde inte hitta 'Depåinnehav'-sidan i PDF:en.");
  }

  // Collect text items from all holdings pages.
  // For multi-page tables, we offset Y coordinates so that rows from
  // later pages sort after rows from earlier pages.
  const allItems = [];
  const PAGE_HEIGHT_OFFSET = 2000; // large enough to separate pages

  for (let pageIdx = 0; pageIdx < holdingsPageNums.length; pageIdx++) {
    const page = await pdf.getPage(holdingsPageNums[pageIdx]);
    const content = await page.getTextContent();
    const items = content.items
      .map((item) => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        // Offset Y so later pages come after earlier pages in sorted order.
        // PDF Y is bottom-up, so we subtract the offset to push later pages lower.
        y: Math.round(item.transform[5]) - pageIdx * PAGE_HEIGHT_OFFSET,
      }))
      .filter((i) => i.text);
    allItems.push(...items);
  }

  const rows = groupByY(allItems);

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

    // Skip repeated header rows on subsequent pages
    const rowTextLower = rowText.toLowerCase();
    if (rowTextLower.includes("innehav") && rowTextLower.includes("anskaffning")) {
      i++;
      continue;
    }

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
      const detailMatch = detailText.match(/(\d[\d\s]*)\s*st\s*\|/i);
      const antal = detailMatch ? parseInt(detailMatch[1].replace(/\s/g, ""), 10) : null;

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
