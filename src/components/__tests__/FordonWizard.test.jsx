import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FordonWizard from "../addassets/FordonWizard.jsx";

const inserted = [];
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({
      insert: (row) => {
        inserted.push(row);
        return {
          select: () => ({ single: () => Promise.resolve({ data: { ...row, id: "vehicle-1" }, error: null }) }),
          then: (resolve) => resolve({ error: null }),
        };
      },
    }),
  },
}));
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ userId: "test-user" }),
}));

describe("FordonWizard", () => {
  beforeEach(() => { inserted.length = 0; });

  it("saves the vehicle as asset and the car loan as linked debt", async () => {
    const onSaved = vi.fn();
    render(<FordonWizard onSaved={onSaved} onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("T.ex. Volvo V60"), { target: { value: "Volvo V60" } });
    fireEvent.click(screen.getByText("Lån"));
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.change(screen.getByPlaceholderText("Uppskattat andrahandsvärde, kr"), { target: { value: "250000" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.change(screen.getByPlaceholderText("kr"), { target: { value: "150000" } });
    // 150 000 / 250 000 = 60 %, eget kapital 100 000
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("100 000 kr")).toBeTruthy();
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Spara fordonet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({ kind: "fordon", label: "Volvo V60", value_sek: 250000, is_debt: false });
    expect(inserted[1]).toMatchObject({ kind: "skuld", label: "Billån · Volvo V60", value_sek: 150000, is_debt: true });
    expect(inserted[1].metadata).toMatchObject({ loanType: "billan", linkedAssetId: "vehicle-1" });
  });

  it("saves only the vehicle when there is no loan", async () => {
    const onSaved = vi.fn();
    render(<FordonWizard onSaved={onSaved} onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("T.ex. Volvo V60"), { target: { value: "Vespan" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.change(screen.getByPlaceholderText("Uppskattat andrahandsvärde, kr"), { target: { value: "30000" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Spara fordonet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ kind: "fordon", label: "Vespan", value_sek: 30000 });
    expect(inserted[0].metadata.financing).toBe("kontant");
  });

  it("saves a leased vehicle with zero value and monthly cost, no debt", async () => {
    const onSaved = vi.fn();
    render(<FordonWizard onSaved={onSaved} onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("T.ex. Volvo V60"), { target: { value: "Leasingbilen" } });
    fireEvent.click(screen.getByText("Leasing"));
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.change(screen.getByPlaceholderText("kr/mån"), { target: { value: "4500" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Nästa"));
    expect(screen.getByText("Nej — leasat")).toBeTruthy();
    fireEvent.click(screen.getByText("Spara fordonet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ kind: "fordon", label: "Leasingbilen", value_sek: 0, is_debt: false });
    expect(inserted[0].metadata).toMatchObject({ financing: "leasing", monthlyCost: 4500 });
  });
});
