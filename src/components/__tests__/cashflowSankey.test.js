import { describe, it, expect } from "vitest";
import { buildSankeyData } from "../cashflowSankey.js";

describe("buildSankeyData", () => {
  it("flows incomes → Budget → categories → items, with amortering and sparutrymme as savings outlets", () => {
    const d = buildSankeyData({
      incomes: [{ id: "a", label: "Lön", amount: 40000 }, { id: "b", label: "Partners lön", amount: 20000 }],
      expenses: [
        { id: "1", label: "Hyra", amount: 10000, category: "boende" },
        { id: "2", label: "El & elnät", amount: 1000, category: "boende" },
        { id: "3", label: "Mat", amount: 6000, category: "mat" },
        { id: "4", label: "Amortering", amount: 3000, category: "amortering" },
      ],
    });
    const names = d.nodes.map(n => n.name);
    expect(names).toContain("Budget");
    expect(names).toContain("Lön");
    expect(names).toContain("Partners lön");
    expect(names).toContain("Boende");
    expect(names).toContain("Amortering");
    expect(names).toContain("Sparutrymme");
    // Boende har två poster → egna noder; Mat har en → ingen duplicerad löv-nod
    expect(names).toContain("Hyra");
    expect(names).toContain("El & elnät");
    expect(names.filter(n => n === "Mat")).toHaveLength(1);
    const budget = d.nodes.find(n => n.name === "Budget");
    expect(budget.value).toBe(60000);
    const spar = d.nodes.find(n => n.name === "Sparutrymme");
    expect(spar.value).toBe(60000 - 17000 - 3000);
    expect(d.nodes.find(n => n.name === "Amortering").kind).toBe("saving");
    // Alla länkar refererar giltiga index och flödet in i Budget = lönerna
    const bi = d.nodes.indexOf(budget);
    const inflow = d.links.filter(l => l.target === bi).reduce((s, l) => s + l.value, 0);
    expect(inflow).toBe(60000);
    for (const l of d.links) { expect(d.nodes[l.source]).toBeTruthy(); expect(d.nodes[l.target]).toBeTruthy(); }
  });

  it("adds an 'Underskott' inflow when expenses exceed income and never emits Sparutrymme", () => {
    const d = buildSankeyData({
      incomes: [{ id: "a", label: "Lön", amount: 20000 }],
      expenses: [{ id: "1", label: "Hyra", amount: 25000, category: "boende" }],
    });
    const names = d.nodes.map(n => n.name);
    expect(names).toContain("Underskott");
    expect(names).not.toContain("Sparutrymme");
    expect(d.nodes.find(n => n.name === "Underskott").value).toBe(5000);
  });

  it("uses the loan balance × rate for loan-linked rows", () => {
    const loans = { L: { id: "L", value_sek: 1200000 } };
    const d = buildSankeyData({
      incomes: [{ id: "a", label: "Lön", amount: 30000 }],
      expenses: [{ id: "1", label: "Ränta · Villan", category: "lan", loanId: "L", rate: 4, amount: 1 }],
      loans,
    });
    expect(d.nodes.find(n => n.name === "Lån & räntor").value).toBe(4000);
  });

  it("is empty without any numbers", () => {
    expect(buildSankeyData({ incomes: [], expenses: [] }).empty).toBe(true);
  });
});
