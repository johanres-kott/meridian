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
