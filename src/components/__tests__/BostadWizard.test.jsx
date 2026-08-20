import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BostadWizard from "../addassets/BostadWizard.jsx";

const inserted = [];
vi.mock("../../lib/manualAssets.js", () => ({
  createManualAsset: async (payload) => {
    inserted.push(payload);
    return { ...payload, id: inserted.length === 1 ? "home-1" : `row-${inserted.length}` };
  },
}));

function fillAndAdvance() {
  fireEvent.change(screen.getByPlaceholderText("T.ex. Lägenheten på Storgatan"), { target: { value: "Radhuset" } });
  fireEvent.click(screen.getByText("Nästa"));
  fireEvent.change(screen.getByPlaceholderText("Värde i kr"), { target: { value: "4000000" } });
  fireEvent.click(screen.getByText("Nästa"));
}

describe("BostadWizard", () => {
  beforeEach(() => { inserted.length = 0; });

  it("computes belåningsgrad and eget kapital from loan vs value", () => {
    render(<BostadWizard onSaved={vi.fn()} onBack={vi.fn()} />);
    fillAndAdvance();
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    // 3 000 000 / 4 000 000 = 75 %
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("1 000 000 kr")).toBeTruthy();
    expect(screen.getByText(/amorteringskrav/)).toBeTruthy();
  });

  it("warns when the loan exceeds uttagna pantbrev", () => {
    render(<BostadWizard onSaved={vi.fn()} onBack={vi.fn()} />);
    fillAndAdvance();
    const krInputs = screen.getAllByPlaceholderText("kr");
    fireEvent.change(krInputs[0], { target: { value: "3000000" } });
    fireEvent.change(krInputs[2], { target: { value: "2000000" } });
    expect(screen.getByText(/Nya pantbrev kostar 2 %/)).toBeTruthy();
  });

  it("saves ownership shares on both the home and the mortgage row", async () => {
    const onSaved = vi.fn();
    render(<BostadWizard onSaved={onSaved} onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("T.ex. Lägenheten på Storgatan"), { target: { value: "Radhuset" } });
    fireEvent.change(screen.getByLabelText("Din ägarandel"), { target: { value: "50" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.change(screen.getByPlaceholderText("Värde i kr"), { target: { value: "4000000" } });
    fireEvent.click(screen.getByText("Nästa"));
    // låneandelen förifylls med ägarandelen när man går vidare…
    expect(screen.getByLabelText("Din andel av lånet").value).toBe("50");
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    // …men kan ändras
    fireEvent.change(screen.getByLabelText("Din andel av lånet"), { target: { value: "40" } });
    fireEvent.click(screen.getByText("Nästa"));
    // andelar under 100 % syns i summeringen
    expect(screen.getByText("Din ägarandel")).toBeTruthy();
    expect(screen.getByText("50 %")).toBeTruthy();
    expect(screen.getByText("Din andel av lånet")).toBeTruthy();
    expect(screen.getByText("40 %")).toBeTruthy();
    fireEvent.click(screen.getByText("Spara bostaden"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    expect(inserted[0].metadata.ownershipShare).toBe(50);
    expect(inserted[1].metadata.ownershipShare).toBe(40);
  });

  it("defaults ownership shares to 100 and hides them from the summary", async () => {
    const onSaved = vi.fn();
    render(<BostadWizard onSaved={onSaved} onBack={vi.fn()} />);
    fillAndAdvance();
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    fireEvent.click(screen.getByText("Nästa"));
    expect(screen.queryByText("Din ägarandel")).toBeNull();
    fireEvent.click(screen.getByText("Spara bostaden"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(inserted[0].metadata.ownershipShare).toBe(100);
    expect(inserted[1].metadata.ownershipShare).toBe(100);
  });

  it("saves the auto-amortization opt-in as metadata.autoAmortize on the loan row", async () => {
    const onSaved = vi.fn();
    render(<BostadWizard onSaved={onSaved} onBack={vi.fn()} />);
    fillAndAdvance();
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    const checkbox = screen.getByRole("checkbox", { name: /Räkna ner lånet med amorteringen/ });
    // Utan amorteringstakt är valet avstängt
    expect(checkbox.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("% per år"), { target: { value: "2" } });
    expect(checkbox.disabled).toBe(false);
    fireEvent.click(checkbox);
    expect(screen.getByText(/stäm av mot banken/)).toBeTruthy();
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Spara bostaden"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(inserted[1].metadata.amortizationRate).toBe(2);
    expect(inserted[1].metadata.autoAmortize).toBe(true);
  });

  it("defaults autoAmortize to false on the loan row", async () => {
    const onSaved = vi.fn();
    render(<BostadWizard onSaved={onSaved} onBack={vi.fn()} />);
    fillAndAdvance();
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Spara bostaden"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(inserted[1].metadata.autoAmortize).toBe(false);
  });

  it("saves the home as asset and the mortgage as linked debt", async () => {
    const onSaved = vi.fn();
    render(<BostadWizard onSaved={onSaved} onBack={vi.fn()} />);
    fillAndAdvance();
    fireEvent.change(screen.getAllByPlaceholderText("kr")[0], { target: { value: "3000000" } });
    fireEvent.click(screen.getByText("Nästa"));
    fireEvent.click(screen.getByText("Spara bostaden"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({ kind: "bostad", label: "Radhuset", value_sek: 4000000, is_debt: false });
    expect(inserted[1]).toMatchObject({ kind: "bolan", label: "Bolån · Radhuset", value_sek: 3000000, is_debt: true });
    expect(inserted[1].metadata.linkedAssetId).toBe("home-1");
  });
});
