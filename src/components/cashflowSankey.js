import { monthlyAmount } from "./cashflowPeriods.js";
import { EXPENSE_CATEGORIES, CAT_BY_ID, isSaving } from "./cashflowCategories.js";

// Bygger noder + länkar till flödesgrafen "Vart tar lönen vägen?" (Finarys
// budget-Sankey): inkomster → Budget → kategorier (+ Amortering, Sparutrymme)
// → enskilda poster. Ren funktion så den kan testas utan recharts.
//
// Kolumner (col): 0 inkomster, 1 budget, 2 kategorier/sparande, 3 poster.
// Underskott ritas som en egen "inkomst" (randig röd) så att budgeten går ihop.

export const COLORS = {
  income: "var(--brand)",
  budget: "var(--gold-500)",
  saving: "var(--pos)",
  deficit: "var(--neg)",
};

export function buildSankeyData({ incomes = [], expenses = [], loans = {} }) {
  const nodes = [];
  const links = [];
  const add = (node) => { nodes.push(node); return nodes.length - 1; };
  const link = (source, target, value) => { if (value > 0) links.push({ source, target, value }); };

  const totalIn = incomes.reduce((s, r) => s + monthlyAmount(r, loans), 0);
  const consumption = expenses.filter(r => !isSaving(r)).reduce((s, r) => s + monthlyAmount(r, loans), 0);
  const amortization = expenses.filter(isSaving).reduce((s, r) => s + monthlyAmount(r, loans), 0);
  const available = totalIn - consumption - amortization;
  if (totalIn <= 0 && consumption + amortization <= 0) return { nodes: [], links: [], empty: true };

  // Kolumn 1: budget — måste finnas innan inkomsterna kan länkas dit
  const budgetTotal = Math.max(totalIn, consumption + amortization);
  const budget = add({ name: "Budget", value: budgetTotal, color: COLORS.budget, col: 1, kind: "budget" });

  // Kolumn 0: inkomster (+ ev. underskott)
  for (const r of incomes) {
    const v = monthlyAmount(r, loans);
    if (v <= 0) continue;
    const i = add({ name: r.label, value: v, color: COLORS.income, col: 0, kind: "income" });
    link(i, budget, v);
  }
  if (available < 0) {
    const i = add({ name: "Underskott", value: -available, color: COLORS.deficit, col: 0, kind: "deficit" });
    link(i, budget, -available);
  }

  // Kolumn 2: kategorier (konsumtion), därefter amortering och sparutrymme
  const byCat = new Map();
  for (const e of expenses) {
    const v = monthlyAmount(e, loans);
    if (v <= 0) continue;
    const id = isSaving(e) ? "amortering" : (CAT_BY_ID[e.category] ? e.category : "ovrigt");
    if (!byCat.has(id)) byCat.set(id, { rows: [], total: 0 });
    const b = byCat.get(id);
    b.rows.push({ row: e, value: v });
    b.total += v;
  }
  const ordered = EXPENSE_CATEGORIES.filter(c => byCat.has(c.id) && !c.saving)
    .sort((a, b) => byCat.get(b.id).total - byCat.get(a.id).total);
  const savingCats = EXPENSE_CATEGORIES.filter(c => byCat.has(c.id) && c.saving);

  for (const c of [...ordered, ...savingCats]) {
    const b = byCat.get(c.id);
    const ci = add({ name: c.label, value: b.total, color: c.color, col: 2, kind: c.saving ? "saving" : "category", striped: !!c.saving });
    link(budget, ci, b.total);
    // Kolumn 3: enskilda poster — bara när kategorin har fler än en rad
    // (en rad = samma siffra två gånger, det tillför inget)
    if (b.rows.length > 1) {
      for (const { row, value } of b.rows.sort((x, y) => y.value - x.value)) {
        const li = add({ name: row.label, value, color: c.color, col: 3, kind: "item" });
        link(ci, li, value);
      }
    }
  }
  if (available > 0) {
    const si = add({ name: "Sparutrymme", value: available, color: COLORS.saving, col: 2, kind: "saving" });
    link(budget, si, available);
  }

  return { nodes, links, empty: false, totalIn, consumption, amortization, available };
}
