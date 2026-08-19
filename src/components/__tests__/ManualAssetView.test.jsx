import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const updateManualAsset = vi.fn(async () => ({}));
const deleteManualAsset = vi.fn(async () => ({}));
vi.mock("../../lib/manualAssets.js", () => ({
  updateManualAsset: (...a) => updateManualAsset(...a),
  deleteManualAsset: (...a) => deleteManualAsset(...a),
}));

import ManualAssetView from "../ManualAssetView.jsx";

const house = {
  id: "h1", kind: "bostad", label: "huset", value_sek: 3000000, is_debt: false, created_at: "2026-08-10T10:00:00Z",
  metadata: { propertyType: "villa", address: "Storgatan 1", livingArea: 140, purchasePrice: 2500000, pantbrev: 1800000 },
};
const loan = {
  id: "l1", kind: "bolan", label: "Bolån · huset", value_sek: 1500000, is_debt: true,
  metadata: { linkedAssetId: "h1", lender: "SBAB", interestRate: 3.5 },
};

describe("ManualAssetView", () => {
  beforeEach(() => { updateManualAsset.mockClear(); deleteManualAsset.mockClear(); });

  it("shows the asset's details, its linked loan, LTV and equity", () => {
    render(<ManualAssetView row={house} allRows={[house, loan]} onBack={() => {}} />);
    expect(screen.getByRole("heading", { name: "huset" })).toBeTruthy();
    expect(screen.getByText("Villa")).toBeTruthy();
    expect(screen.getByText("140 m²")).toBeTruthy();
    expect(screen.getByText("Bolån · huset")).toBeTruthy();
    expect(screen.getByText("SBAB")).toBeTruthy();
    expect(screen.getByText("50 %")).toBeTruthy();          // 1,5 / 3,0
    expect(screen.getAllByText(/1 500 000 kr/).length).toBeGreaterThan(0); // eget kapital
    expect(screen.getByText(/inget krav på grund av belåningsgraden/)).toBeTruthy();
  });

  it("lets the user edit value and metadata and saves through the proxy", async () => {
    render(<ManualAssetView row={house} allRows={[house, loan]} onBack={() => {}} onChanged={() => {}} />);
    fireEvent.click(screen.getByText("Redigera"));
    const valueInput = screen.getByDisplayValue("3000000");
    fireEvent.change(valueInput, { target: { value: "3 200 000" } });
    fireEvent.change(screen.getByLabelText("Boyta"), { target: { value: "145" } });
    fireEvent.click(screen.getByText("Spara ändringar"));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    const [id, patch] = updateManualAsset.mock.calls[0];
    expect(id).toBe("h1");
    expect(patch.value_sek).toBe(3200000);
    expect(patch.metadata.livingArea).toBe(145);
    expect(patch.metadata.address).toBe("Storgatan 1"); // orört fält behålls
  });

  it("recomputes a vinstandel's value from its tranches when saving", async () => {
    const v = { id: "v1", kind: "vinstandel", label: "Scania Fond", value_sek: 30000, is_debt: false,
      metadata: { provider: "PRI", lockYears: 5, tranches: [{ year: 2020, value: 10000 }, { year: 2023, value: 20000 }] } };
    render(<ManualAssetView row={v} allRows={[v]} onBack={() => {}} />);
    fireEvent.click(screen.getByText("Redigera"));
    fireEvent.change(screen.getByLabelText("Årgång 2 värde"), { target: { value: "25000" } });
    fireEvent.click(screen.getByText("Spara ändringar"));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    const [, patch] = updateManualAsset.mock.calls[0];
    expect(patch.value_sek).toBe(35000);
    expect(patch.metadata.tranches).toEqual([{ year: 2020, value: 10000 }, { year: 2023, value: 25000 }]);
  });

  it("asks before deleting and then calls the proxy", async () => {
    const onBack = vi.fn();
    render(<ManualAssetView row={house} allRows={[house]} onBack={onBack} onChanged={() => {}} />);
    fireEvent.click(screen.getByText("Ta bort"));
    expect(deleteManualAsset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Ja, ta bort"));
    await waitFor(() => expect(deleteManualAsset).toHaveBeenCalledWith("h1"));
    expect(onBack).toHaveBeenCalled();
  });
});
