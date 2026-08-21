import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KontoutdragImport from "../addassets/KontoutdragImport.jsx";

const created = [];
const updated = [];
vi.mock("../../lib/manualAssets.js", () => ({
  createManualAsset: async (payload) => { created.push(payload); return { ...payload, id: "new-1" }; },
  updateManualAsset: async (id, patch) => { updated.push({ id, ...patch }); return { id, ...patch }; },
}));
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ userId: "u1" }),
}));
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => Promise.resolve({
              data: [{ id: "acc-1", kind: "sparkonto", label: "Sparkonto SBAB", value_sek: 10000, metadata: { bank: "SBAB" } }],
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

const NORDEA_CSV = `Bokföringsdag;Belopp;Avsändare;Mottagare;Rubrik;Saldo;Valuta
2025-03-25;52 000,00;;;LÖN;80 395,00;SEK
2025-03-03;-1 847,00;;;ICA MAXI;38 883,00;SEK
2025-02-25;51 000,00;;;LÖN;53 730,00;SEK`;

const nbsp = (s) => s.replace(/\u00a0/g, " ");

function makeFile(text, name = "kontoutdrag.csv") {
  return {
    name,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

async function loadFile(container, text) {
  const input = container.querySelector("input[type='file']");
  const file = makeFile(text);
  Object.defineProperty(input, "files", { value: [file] });
  fireEvent.change(input);
  await waitFor(() => expect(screen.getByText(/Vald fil/)).toBeTruthy());
}

describe("KontoutdragImport", () => {
  beforeEach(() => { created.length = 0; updated.length = 0; });

  it("visar saldo, period och månadssammanställning efter inläsning", async () => {
    const { container } = render(<KontoutdragImport onSaved={vi.fn()} onBack={vi.fn()} />);
    await loadFile(container, NORDEA_CSV);
    expect(nbsp(container.textContent)).toContain("Saldo 80 395 kr");
    expect(screen.getByText(/Nordea · 3 bokförda transaktioner/)).toBeTruthy();
    expect(screen.getByText("In och ut per månad")).toBeTruthy();
    expect(screen.getByText(/mar 2025/)).toBeTruthy();
    expect(screen.getByText(/feb 2025/)).toBeTruthy();
  });

  it("skapar nytt sparkonto med saldot från filen", async () => {
    const onSaved = vi.fn();
    const { container } = render(<KontoutdragImport onSaved={onSaved} onBack={vi.fn()} />);
    await loadFile(container, NORDEA_CSV);
    // förifyllt namn från banken
    const nameInput = screen.getByPlaceholderText(/Namn/);
    expect(nameInput.value).toBe("Nordea konto");
    fireEvent.change(nameInput, { target: { value: "Lönekonto Nordea" } });
    fireEvent.click(screen.getByRole("button", { name: /Spara saldo/ }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(created).toHaveLength(1);
    expect(created[0].kind).toBe("sparkonto");
    expect(created[0].label).toBe("Lönekonto Nordea");
    expect(created[0].value_sek).toBe(80395);
    expect(created[0].metadata.lastStatementDate).toBe("2025-03-25");
  });

  it("uppdaterar befintligt konto och behåller dess metadata", async () => {
    const onSaved = vi.fn();
    const { container } = render(<KontoutdragImport onSaved={onSaved} onBack={vi.fn()} />);
    await loadFile(container, NORDEA_CSV);
    fireEvent.click(screen.getByText("Uppdatera befintligt"));
    fireEvent.click(screen.getByText("Sparkonto SBAB"));
    fireEvent.click(screen.getByRole("button", { name: /Spara saldo/ }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("acc-1");
    expect(updated[0].value_sek).toBe(80395);
    // metadata ersätts i sin helhet i PATCH — banken från raden ska överleva
    expect(updated[0].metadata.bank).toBe("SBAB");
    expect(updated[0].metadata.lastStatementDate).toBe("2025-03-25");
  });

  it("visar ärligt fel för oigenkännlig fil och sparar inget", async () => {
    const { container } = render(<KontoutdragImport onSaved={vi.fn()} onBack={vi.fn()} />);
    await loadFile(container, "detta\när\ninte ett kontoutdrag");
    expect(screen.getByText(/Kunde inte hitta kolumnrubriker/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Spara saldo/ })).toBeNull();
  });
});
