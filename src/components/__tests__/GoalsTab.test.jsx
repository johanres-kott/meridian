import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GoalsTab from "../GoalsTab.jsx";

let prefs = {};
const updatePreferences = vi.fn();
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ userId: "test-user", preferences: prefs, updatePreferences }),
}));

describe("GoalsTab", () => {
  beforeEach(() => {
    prefs = {};
    updatePreferences.mockClear();
  });

  it("computes savings capacity from manually entered income and expenses", () => {
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön efter skatt", amount: 35000 }],
        expenses: [{ id: "2", label: "Hyra", amount: 12000 }, { id: "3", label: "Mat", amount: 5000 }],
      },
    };
    render(<GoalsTab />);
    // statkorten (Pengar in/ut) + kolumnhuvudena visar samma summor
    expect(screen.getAllByText(/35 000 kr/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/17 000 kr/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/18 000 kr\/mån/).length).toBeGreaterThan(0);
    // sparkvot 18000/35000 ≈ 51 % (inbakad i Sparutrymme-kortet)
    expect(screen.getByText(/51 % sparkvot/)).toBeTruthy();
    // fördelningsstapeln visar sparutrymmet som andel av lönen
    expect(screen.getByText("Vart tar lönen vägen?")).toBeTruthy();
    expect(screen.getByText("Sparutrymme", { selector: "span" })).toBeTruthy();
  });

  it("shows expense categories in the distribution", () => {
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön", amount: 40000 }],
        expenses: [
          { id: "2", label: "Hyra", amount: 12000, category: "boende" },
          { id: "3", label: "ICA", amount: 6000, category: "mat" },
          { id: "4", label: "Gammal post utan kategori", amount: 2000 },
        ],
      },
    };
    render(<GoalsTab />);
    // 12000/40000 = 30 %, 6000/40000 = 15 %, okategoriserad → Övrigt 5 %
    expect(screen.getAllByText("Boende").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Övrigt").length).toBeGreaterThan(0);
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("15%")).toBeTruthy();
  });

  it("adds an income row via updatePreferences", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    fireEvent.change(screen.getByPlaceholderText("T.ex. Lön efter skatt"), { target: { value: "Lön" } });
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "30000" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.incomes).toHaveLength(1);
    expect(call.cashflow.incomes[0]).toMatchObject({ label: "Lön", amount: 30000 });
  });

  it("shows goal progress and months-left arithmetic from user's own numbers", () => {
    prefs = {
      cashflow: { incomes: [{ id: "1", label: "Lön", amount: 30000 }], expenses: [{ id: "2", label: "Allt", amount: 20000 }] },
      savingsGoals: [{ id: "g1", name: "Kontantinsats", icon: "🏠", target: 100000, saved: 40000 }],
    };
    render(<GoalsTab />);
    expect(screen.getByText("Kontantinsats")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    // 60 000 kvar / 10 000 per mån = 6 månader
    expect(screen.getByText(/6 månader kvar/)).toBeTruthy();
    expect(screen.getByText(/räkneexempel/)).toBeTruthy();
  });

  it("offers must-have expense presets that prefill name + category", () => {
    render(<GoalsTab />);
    expect(screen.getByText("+ El")).toBeTruthy();
    expect(screen.getByText("+ Hemförsäkring")).toBeTruthy();
    fireEvent.click(screen.getByText("+ El"));
    // formuläret öppnas med namnet förifyllt; fyll i belopp och spara
    expect(screen.getByDisplayValue("El")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "900" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.expenses[0]).toMatchObject({ label: "El", amount: 900, category: "boende" });
  });

  it("supports several incomes with a type", () => {
    prefs = { cashflow: { incomes: [{ id: "1", label: "Lön efter skatt", amount: 35000, incomeType: "lon" }], expenses: [] } };
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    fireEvent.change(screen.getByDisplayValue("Lön efter skatt", { selector: "select" }), { target: { value: "partner" } });
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "28000" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.incomes).toHaveLength(2);
    expect(call.cashflow.incomes[1]).toMatchObject({ label: "Partners lön", amount: 28000, incomeType: "partner" });
  });

  it("creates a new goal", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getByText("+ Nytt sparmål"));
    fireEvent.change(screen.getByPlaceholderText("Vad sparar du till? (t.ex. Kontantinsats)"), { target: { value: "Resa" } });
    fireEvent.change(screen.getByPlaceholderText("Målbelopp, kr"), { target: { value: "25000" } });
    fireEvent.click(screen.getByText("Skapa mål"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.savingsGoals).toHaveLength(1);
    expect(call.savingsGoals[0]).toMatchObject({ name: "Resa", target: 25000, saved: 0 });
  });
});
