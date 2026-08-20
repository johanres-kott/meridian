import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AssetBreakdown from "../AssetBreakdown.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "sv" } }),
}));

// AssetBreakdown använder effectiveValueSek ur manualAssets.js, som drar in
// supabase-klienten — stubba klienten så testet slipper miljövariabler.
vi.mock("../../supabase.js", () => ({ supabase: {} }));

// recharts ResponsiveContainer behöver layout — stubba till enkel wrapper i jsdom
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return { ...actual, ResponsiveContainer: ({ children }) => <div style={{ width: 200, height: 200 }}>{children}</div> };
});

const base = {
  portfolioLoaded: true,
  portfolioSek: 300000,
  stocksSek: 200000,
  fundsSek: 100000,
  pensionValue: 250000,
  assets: [
    { id: "a1", kind: "bostad", value_sek: 4000000 },
    { id: "a2", kind: "sparkonto", value_sek: 50000 },
  ],
  debts: [{ id: "d1", kind: "bolan", value_sek: 3000000 }],
};

describe("AssetBreakdown", () => {
  it("lists asset categories with share of total, largest first", () => {
    render(<AssetBreakdown data={base} />);
    expect(screen.getByText("assetBreakdown.cats.bostad")).toBeTruthy();
    expect(screen.getByText("assetBreakdown.cats.stocks")).toBeTruthy();
    expect(screen.getByText("assetBreakdown.cats.funds")).toBeTruthy();
    expect(screen.getByText("assetBreakdown.cats.pension")).toBeTruthy();
    expect(screen.getByText("assetBreakdown.cats.cash")).toBeTruthy();
    // total 4 600 000; bostad 4 000 000 = 87 %
    expect(screen.getByText("87%")).toBeTruthy();
    expect(screen.getByText("4 600 000 SEK")).toBeTruthy();
  });

  it("switches to debts", () => {
    render(<AssetBreakdown data={base} />);
    fireEvent.click(screen.getByText("assetBreakdown.debts"));
    expect(screen.getByText("assetBreakdown.cats.bolan")).toBeTruthy();
    // totalen i donutmitten + radbeloppet är samma summa när det bara finns en skuld
    expect(screen.getAllByText("3 000 000 SEK")).toHaveLength(2);
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.queryByText("assetBreakdown.cats.bostad")).toBeNull();
  });

  it("navigates when a portfolio category is clicked", () => {
    const onNavigate = vi.fn();
    render(<AssetBreakdown data={base} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("assetBreakdown.cats.pension"));
    expect(onNavigate).toHaveBeenCalledWith("investment", { subTab: "pension" });
  });

  it("renders nothing until the portfolio is loaded", () => {
    const { container } = render(<AssetBreakdown data={{ ...base, portfolioLoaded: false }} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows empty state without any assets", () => {
    render(<AssetBreakdown data={{ portfolioLoaded: true, portfolioSek: 0, stocksSek: 0, fundsSek: 0, pensionValue: null, assets: [], debts: [] }} />);
    expect(screen.getByText("assetBreakdown.empty")).toBeTruthy();
  });
});
