import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GoalsTab from "../GoalsTab.jsx";

let prefs = {};
let debts = [];
const updatePreferences = vi.fn();
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ userId: "test-user", preferences: prefs, updatePreferences }),
}));
vi.mock("../../hooks/useNetWorth.js", () => ({
  default: () => ({ debts }),
}));

describe("GoalsTab", () => {
  beforeEach(() => {
    prefs = {};
    debts = [];
    updatePreferences.mockClear();
  });

  it("computes a loan-linked interest expense from the loan's current balance × rate", () => {
    debts = [{ id: "loan-1", kind: "bolan", label: "Bolån · Villan", value_sek: 1500000, metadata: { interestRate: 3.5 } }];
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön", amount: 50000 }],
        // amount är ett gammalt snapshot — lånets aktuella skuld ska vinna
        expenses: [{ id: "2", label: "Ränta · Villan", category: "lan", loanId: "loan-1", rate: 3.5, amount: 9999 }],
      },
    };
    render(<GoalsTab />);
    // 1 500 000 × 3,5 % / 12 = 4 375 kr/mån
    expect(screen.getAllByText(/4 375 kr/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/9 999 kr/)).toBeNull();
    expect(screen.getByText("3,5 %")).toBeTruthy();
  });

  it("links the 'Bolåneränta' preset to an entered mortgage and prefills the rate from the wizard", () => {
    debts = [{ id: "loan-1", kind: "bolan", label: "Bolån · Villan", value_sek: 1500000, metadata: { interestRate: 3.5 } }];
    prefs = { cashflow: { incomes: [], expenses: [] } };
    render(<GoalsTab />);
    fireEvent.click(screen.getByText("+ Bolåneränta"));
    expect(screen.getByPlaceholderText("ränta %").value).toBe("3,5");
    expect(screen.getByText("= 4 375 kr/mån")).toBeTruthy();
    fireEvent.click(screen.getByText("Spara"));
    const row = updatePreferences.mock.calls[0][0].cashflow.expenses[0];
    expect(row.loanId).toBe("loan-1");
    expect(row.rate).toBe(3.5);
    expect(row.category).toBe("lan");
    expect(row.label).toBe("Ränta · Villan");
  });

  it("treats amortering as saving: excluded from 'Pengar ut', included in sparkvot, own stat card", () => {
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön", amount: 50000 }],
        expenses: [
          { id: "2", label: "Hyra", amount: 20000, category: "boende" },
          { id: "3", label: "Amortering", amount: 5000, category: "amortering" },
        ],
      },
    };
    render(<GoalsTab />);
    // Pengar ut = 20 000 (konsumtion), amortering eget kort, fritt sparutrymme 25 000
    expect(screen.getAllByText(/20 000 kr/).length).toBeGreaterThan(0);
    expect(screen.getByText("Amortering", { selector: "div" })).toBeTruthy();
    expect(screen.getByText(/minskar lånet — räknas som sparande/)).toBeTruthy();
    expect(screen.getAllByText(/25 000 kr\/mån/).length).toBeGreaterThan(0);
    // sparkvot inkl. amortering = (25 000 + 5 000) / 50 000 = 60 %
    expect(screen.getByText(/60 % sparkvot inkl\. amortering/)).toBeTruthy();
    // stapeln: amortering som eget segment, inte som utgiftskategori
    expect(screen.getByTitle(/Amortering: 5 000 kr/)).toBeTruthy();
  });

  it("falls back to the saved amount when the linked loan has been deleted", () => {
    debts = [];
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön", amount: 50000 }],
        expenses: [{ id: "2", label: "Ränta · Villan", category: "lan", loanId: "gone", rate: 3.5, amount: 4375 }],
      },
    };
    render(<GoalsTab />);
    expect(screen.getAllByText(/4 375 kr/).length).toBeGreaterThan(0);
    expect(screen.getByText("lån saknas")).toBeTruthy();
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

  it("adds an income row via updatePreferences (custom name via 'Övrig inkomst')", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    fireEvent.change(screen.getByDisplayValue("Lön efter skatt"), { target: { value: "ovrigt" } });
    fireEvent.change(screen.getByPlaceholderText("Vad för inkomst?"), { target: { value: "Lön" } });
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
    expect(screen.getByText("+ El & elnät")).toBeTruthy();
    expect(screen.getByText("+ Hemförsäkring")).toBeTruthy();
    fireEvent.click(screen.getByText("+ El & elnät"));
    // formuläret öppnas med namnet förifyllt; fyll i belopp och spara
    expect(screen.getByDisplayValue("El & elnät")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "900" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.expenses[0]).toMatchObject({ label: "El & elnät", amount: 900, category: "boende" });
  });

  it("saves an income when only the amount is filled (type label becomes the name)", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    // typen ÄR namnet — inget separat namnfält, bara typ + belopp
    expect(screen.queryByPlaceholderText("Vad för inkomst?")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "42000" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.incomes[0]).toMatchObject({ label: "Lön efter skatt", amount: 42000, incomeType: "lon" });
  });

  it("explains why when the amount is missing instead of silently doing nothing", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    fireEvent.click(screen.getByText("Spara"));
    expect(screen.getByText("Fyll i ett belopp i kr per mån.")).toBeTruthy();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it("supports several incomes with a type", () => {
    prefs = { cashflow: { incomes: [{ id: "1", label: "Lön efter skatt", amount: 35000, incomeType: "lon" }], expenses: [] } };
    render(<GoalsTab />);
    fireEvent.click(screen.getAllByText("+ Lägg till")[0]);
    fireEvent.change(screen.getByDisplayValue("Lön efter skatt"), { target: { value: "partner" } });
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "28000" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.incomes).toHaveLength(2);
    expect(call.cashflow.incomes[1]).toMatchObject({ label: "Partners lön", amount: 28000, incomeType: "partner" });
  });

  it("converts yearly and quarterly posts to kr/month everywhere", () => {
    prefs = {
      cashflow: {
        incomes: [{ id: "1", label: "Lön", amount: 30000, period: "month" }],
        expenses: [
          { id: "2", label: "Hemförsäkring", amount: 5400, period: "year", category: "forsakring" },   // 450/mån
          { id: "3", label: "Fordonsskatt", amount: 900, period: "quarter", category: "transport" },   // 300/mån
          { id: "4", label: "Hyra", amount: 9000, category: "boende" },                                // ingen period = månad
        ],
      },
    };
    render(<GoalsTab />);
    // raden visar månadsvärde + originalet
    expect(screen.getByText("450 kr/mån (5 400 kr/år)")).toBeTruthy();
    expect(screen.getByText("300 kr/mån (900 kr/kvartal)")).toBeTruthy();
    // ut = 450 + 300 + 9000 = 9 750; sparutrymme = 20 250
    expect(screen.getAllByText(/9 750 kr/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/20 250 kr\/mån/).length).toBeGreaterThan(0);
  });

  it("saves the chosen period with the row and defaults to month", () => {
    render(<GoalsTab />);
    fireEvent.click(screen.getByText("+ Hemförsäkring")); // preset med period=år
    expect(screen.getByPlaceholderText("kr/år")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("kr/år"), { target: { value: "5400" } });
    fireEvent.click(screen.getByText("Spara"));
    const call = updatePreferences.mock.calls.at(-1)[0];
    expect(call.cashflow.expenses[0]).toMatchObject({ label: "Hemförsäkring", amount: 5400, period: "year" });
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
