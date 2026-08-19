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

  it("shows 'din andel' of equity when house and loan are co-owned", () => {
    const h = { ...house, value_sek: 8600000, metadata: { ...house.metadata, ownershipShare: 50 } };
    const l = { ...loan, value_sek: 7657448, metadata: { ...loan.metadata, ownershipShare: 50 } };
    render(<ManualAssetView row={h} allRows={[h, l]} onBack={() => {}} />);
    // hela: 8 600 000 − 7 657 448 = 942 552; din andel: 4 300 000 − 3 828 724 = 471 276
    expect(screen.getByText("Eget kapital, hela")).toBeTruthy();
    expect(screen.getAllByText(/942 552 kr/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Din andel \(50 % av bostaden, 50 % av lånet\)/)).toBeTruthy();
    expect(screen.getAllByText(/471 276 kr/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Din andel 50 %:/)).toBeTruthy();
  });

  it("records renovations with financing and sums total invested", async () => {
    render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} onChanged={() => {}} />);
    fireEvent.click(screen.getByText("Redigera"));
    fireEvent.click(screen.getByText("+ Lägg till renovering"));
    fireEvent.change(screen.getByLabelText("Renovering 1 namn"), { target: { value: "Nytt kök" } });
    fireEvent.change(screen.getByLabelText("Renovering 1 belopp"), { target: { value: "350000" } });
    fireEvent.change(screen.getByLabelText("Renovering 1 finansiering"), { target: { value: "lan" } });
    // total investerat = köpeskilling 2 500 000 + 350 000
    expect(screen.getAllByText(/2 850 000 kr/).length).toBeGreaterThan(0);
    expect(screen.getByText(/varav 350 000 kr lånefinansierat/)).toBeTruthy();
    fireEvent.click(screen.getByText("Spara ändringar"));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    const [, patch] = updateManualAsset.mock.calls[0];
    expect(patch.metadata.renovations).toEqual([{ date: null, label: "Nytt kök", amount: 350000, financing: "lan" }]);
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
