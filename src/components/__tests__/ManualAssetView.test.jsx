import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const updateManualAsset = vi.fn(async () => ({}));
const deleteManualAsset = vi.fn(async () => ({}));
// Hushållet (familjeläge) läses ur preferences — muterbar per test.
let mockPrefs = {};
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ preferences: mockPrefs }),
}));
// manualAssets.js drar in supabase-klienten — stubba den och behåll den
// riktiga effectiveValueSek (används för "Din andel av eget kapital").
vi.mock("../../supabase.js", () => ({ supabase: {} }));
vi.mock("../../lib/manualAssets.js", async (importOriginal) => ({
  ...(await importOriginal()),
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
  beforeEach(() => { updateManualAsset.mockClear(); deleteManualAsset.mockClear(); mockPrefs = {}; });

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

  it("shows the owner's share of equity only when a share is below 100 %", () => {
    const sharedHouse = { ...house, metadata: { ...house.metadata, ownershipShare: 50 } };
    const sharedLoan = { ...loan, metadata: { ...loan.metadata, ownershipShare: 50 } };
    render(<ManualAssetView row={sharedHouse} allRows={[sharedHouse, sharedLoan]} onBack={() => {}} />);
    // Belåningsgrad och eget kapital gäller hela bostaden som förut
    expect(screen.getByText("Belåningsgrad")).toBeTruthy();
    // Din andel: 3 000 000 × 50 % − 1 500 000 × 50 % = 750 000 kr
    expect(screen.getByText("Din andel av eget kapital")).toBeTruthy();
    expect(screen.getByText((c) => c.replace(/\u00a0/g, " ") === "750 000 kr")).toBeTruthy();
  });

  it("hides the owner's equity share at full ownership", () => {
    render(<ManualAssetView row={house} allRows={[house, loan]} onBack={() => {}} />);
    expect(screen.queryByText("Din andel av eget kapital")).toBeNull();
  });

  it("prompts for purchase data when the index basis is missing", () => {
    render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
    // house saknar purchaseDate → dämpad uppmaning i Värdeindikation-sektionen
    expect(screen.getByText(/Lägg till köpeskilling och köpdatum/)).toBeTruthy();
    expect(screen.queryByText("Räkna upp med prisindex")).toBeNull();
    expect(screen.getByText(/Utgör inte finansiell rådgivning/)).toBeTruthy();
  });

  it("fetches the SCB index estimate and applies it only on explicit click", async () => {
    const indexed = { ...house, metadata: { ...house.metadata, purchaseDate: "2024-09-03", purchasePrice: 8600000 } };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        estimate: 8682000, factor: 951 / 942, purchaseQuarter: "2024K3", latestQuarter: "2026K1",
        indexThen: 942, indexNow: 951, region: "00", regionText: "Riket",
        source: "SCB fastighetsprisindex, permanenta småhus",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const onChanged = vi.fn();
    render(<ManualAssetView row={indexed} allRows={[indexed]} onBack={() => {}} onChanged={onChanged} />);
    fireEvent.click(screen.getByText("Räkna upp med prisindex"));
    await waitFor(() => expect(screen.getByText(/2024K3 → 2026K1/)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/property-index?price=8600000&date=2024-09-03&region=00"));
    // uppskattningen skrivs inte förrän användaren klickar
    expect(updateManualAsset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Använd som värde"));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    const [id, patch] = updateManualAsset.mock.calls[0];
    expect(id).toBe("h1");
    expect(patch.value_sek).toBe(8682000);
    expect(patch.metadata.indexRegion).toBe("00");
    expect(patch.metadata.purchasePrice).toBe(8600000); // övrig metadata behålls
    expect(onChanged).toHaveBeenCalled();
  });

  it("computes a manual percentage estimate and applies it only on explicit click", async () => {
    render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} onChanged={() => {}} />);
    fireEvent.change(screen.getByLabelText("Prisutveckling i procent"), { target: { value: "15" } });
    // köpeskilling 2 500 000 × 1,15 = 2 875 000
    expect(screen.getByText(/2 875 000 kr/)).toBeTruthy();
    expect(updateManualAsset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Använd som värde" }));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    expect(updateManualAsset.mock.calls[0][1].value_sek).toBe(2875000);
  });

  it("applies the manual percentage to the current value when chosen as base", () => {
    render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText("Uppräkningsbas"), { target: { value: "current" } });
    fireEvent.change(screen.getByLabelText("Prisutveckling i procent"), { target: { value: "-10" } });
    // nuvarande värde 3 000 000 × 0,90 = 2 700 000
    expect(screen.getByText(/2 700 000 kr/)).toBeTruthy();
  });

  it("shows no manual estimate for gibberish percentages", () => {
    render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText("Prisutveckling i procent"), { target: { value: "abc" } });
    expect(screen.queryByText(/din egen siffra/)).toBeNull();
  });

  it("toggles automatisk amortering in edit mode and saves it in metadata", async () => {
    const amortLoan = { ...loan, metadata: { ...loan.metadata, amortizationRate: 2 } };
    render(<ManualAssetView row={amortLoan} allRows={[amortLoan]} onBack={() => {}} onChanged={() => {}} />);
    // Av/osatt boolean döljs i visningsläget
    expect(screen.queryByText("Automatisk amortering")).toBeNull();
    fireEvent.click(screen.getByText("Redigera"));
    const checkbox = screen.getByLabelText("Automatisk amortering");
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    fireEvent.click(screen.getByText("Spara ändringar"));
    await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
    const [id, patch] = updateManualAsset.mock.calls[0];
    expect(id).toBe("l1");
    expect(patch.metadata.autoAmortize).toBe(true);
    expect(patch.metadata.amortizationRate).toBe(2); // övriga fält orörda
    expect(patch.metadata.lender).toBe("SBAB");
  });

  it("shows autoAmortize as 'Ja' and the lastAmortizedAt stamp in view mode", () => {
    const amortLoan = { ...loan, metadata: { ...loan.metadata, amortizationRate: 2, autoAmortize: true, lastAmortizedAt: "2026-08-01" } };
    render(<ManualAssetView row={amortLoan} allRows={[amortLoan]} onBack={() => {}} />);
    expect(screen.getByText("Automatisk amortering")).toBeTruthy();
    expect(screen.getByText("Ja")).toBeTruthy();
    expect(screen.getByText("Senast nedräknad: 2026-08-01")).toBeTruthy();
  });

  it("hides the lastAmortizedAt stamp when it is missing", () => {
    render(<ManualAssetView row={loan} allRows={[loan]} onBack={() => {}} />);
    expect(screen.queryByText(/Senast nedräknad/)).toBeNull();
  });

  describe("Ägande-sektionen (familjeläge)", () => {
    const familyPrefs = {
      household: { members: [{ id: "p1", name: "Lotten" }], economyType: "gemensam" },
    };

    it("shows no ownership section without household members", () => {
      render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
      fireEvent.click(screen.getByText("Redigera"));
      expect(screen.queryByText("Ägande")).toBeNull();
      // gamla Ägarandel-fältet finns kvar (bakåtkompat)
      expect(screen.getByLabelText("Ägarandel")).toBeTruthy();
    });

    it("shows one row per member in edit mode, prefilled from the economy type default", () => {
      mockPrefs = familyPrefs;
      render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
      fireEvent.click(screen.getByText("Redigera"));
      expect(screen.getByText("Ägande")).toBeTruthy();
      // gemensam ekonomi → 50/50 som default för en rad utan tidigare ägande
      expect(screen.getByLabelText("Ägarandel Du").value).toBe("50");
      expect(screen.getByLabelText("Ägarandel Lotten").value).toBe("50");
      // gamla Ägarandel-fältet döljs när sektionen tar över
      expect(screen.queryByLabelText("Ägarandel")).toBeNull();
    });

    it("prefills me from a legacy ownershipShare and others with 0", () => {
      mockPrefs = familyPrefs;
      const legacy = { ...house, metadata: { ...house.metadata, ownershipShare: 50 } };
      render(<ManualAssetView row={legacy} allRows={[legacy]} onBack={() => {}} />);
      fireEvent.click(screen.getByText("Redigera"));
      expect(screen.getByLabelText("Ägarandel Du").value).toBe("50");
      expect(screen.getByLabelText("Ägarandel Lotten").value).toBe("0");
    });

    it("saves owners AND the mirrored ownershipShare (dual-write)", async () => {
      mockPrefs = familyPrefs;
      render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} onChanged={() => {}} />);
      fireEvent.click(screen.getByText("Redigera"));
      fireEvent.change(screen.getByLabelText("Ägarandel Du"), { target: { value: "60" } });
      fireEvent.change(screen.getByLabelText("Ägarandel Lotten"), { target: { value: "40" } });
      fireEvent.click(screen.getByText("Spara ändringar"));
      await waitFor(() => expect(updateManualAsset).toHaveBeenCalledTimes(1));
      const [, patch] = updateManualAsset.mock.calls[0];
      expect(patch.metadata.owners).toEqual({ me: 60, p1: 40 });
      expect(patch.metadata.ownershipShare).toBe(60); // spegeln!
      expect(patch.metadata.address).toBe("Storgatan 1"); // övrig metadata orörd
    });

    it("refuses to save when the shares sum to more than 100 %", async () => {
      mockPrefs = familyPrefs;
      render(<ManualAssetView row={house} allRows={[house]} onBack={() => {}} />);
      fireEvent.click(screen.getByText("Redigera"));
      fireEvent.change(screen.getByLabelText("Ägarandel Du"), { target: { value: "80" } });
      fireEvent.change(screen.getByLabelText("Ägarandel Lotten"), { target: { value: "80" } });
      fireEvent.click(screen.getByText("Spara ändringar"));
      expect(await screen.findByText(/summerar till 160 % — högst 100 %/)).toBeTruthy();
      expect(updateManualAsset).not.toHaveBeenCalled();
    });

    it("shows the Ägande row instead of the legacy field when owners exist, with unknown ids labeled", () => {
      mockPrefs = { display_name: "Johan", ...familyPrefs };
      const owned = { ...house, metadata: { ...house.metadata, owners: { me: 50, p1: 30, borta: 20 }, ownershipShare: 50 } };
      render(<ManualAssetView row={owned} allRows={[owned]} onBack={() => {}} />);
      expect(screen.getByText("Ägande")).toBeTruthy();
      expect(screen.getByText("Johan 50 % · Lotten 30 % · Okänd person 20 %")).toBeTruthy();
      // gamla fältraden "Ägarandel" dubblas inte
      expect(screen.queryByText("Ägarandel")).toBeNull();
    });

    it("keeps the legacy Ägarandel field row in view mode for rows without owners", () => {
      const legacy = { ...house, metadata: { ...house.metadata, ownershipShare: 50 } };
      render(<ManualAssetView row={legacy} allRows={[legacy]} onBack={() => {}} />);
      expect(screen.getByText("Ägarandel")).toBeTruthy();
      expect(screen.queryByText("Ägande")).toBeNull();
    });
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
