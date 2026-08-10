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
    expect(screen.getByText("35 000 kr")).toBeTruthy();
    expect(screen.getByText("17 000 kr")).toBeTruthy();
    expect(screen.getByText("18 000 kr/mån")).toBeTruthy();
    // sparkvot 18000/35000 ≈ 51%
    expect(screen.getByText("51%")).toBeTruthy();
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
