import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BaseFundCard from "../BaseFundCard.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

let watchlistRows = [];
vi.mock("../../supabase.js", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "test-user" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: watchlistRows }),
        }),
      }),
    }),
  },
}));

const GLOBAL_INDEX_FUND = {
  secId: "F00000ABCD",
  name: "Global Indexfond",
  legalName: "Testfond Global Index",
  category: "Global, Mix Bolag, SEK",
  indexFund: true,
  ongoingCharge: 0.2,
};

describe("BaseFundCard", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(GLOBAL_INDEX_FUND) })
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the nudge when the user owns no funds", async () => {
    watchlistRows = [];
    render(<BaseFundCard onNavigate={vi.fn()} />);
    expect(await screen.findByText("baseFund.title")).toBeTruthy();
    expect(screen.getByText("baseFund.nudgeText")).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("deep links to global index funds from the nudge CTA", async () => {
    watchlistRows = [];
    const onNavigate = vi.fn();
    render(<BaseFundCard onNavigate={onNavigate} />);
    fireEvent.click(await screen.findByText("baseFund.cta"));
    expect(onNavigate).toHaveBeenCalledWith("investment", {
      subTab: "toppforslag", suggestMode: "fund", fundCategory: "aktie_global", fundType: "index",
    });
  });

  it("shows the owned global index fund when the base is in place", async () => {
    watchlistRows = [{ ticker: "F00000ABCD", name: "Global Indexfond", shares: 10, type: "fund" }];
    render(<BaseFundCard onNavigate={vi.fn()} />);
    expect(await screen.findByText("baseFund.inPlaceTitle")).toBeTruthy();
    expect(screen.getByText("Testfond Global Index")).toBeTruthy();
  });

  it("nudges when owned funds are active or non-global", async () => {
    watchlistRows = [{ ticker: "F00000XYZ1", name: "Sverigefond", shares: 5, type: "fund" }];
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ secId: "F00000XYZ1", category: "Sverige, Mix Bolag", indexFund: false }) })
    );
    render(<BaseFundCard onNavigate={vi.fn()} />);
    expect(await screen.findByText("baseFund.title")).toBeTruthy();
    expect(screen.getByText("baseFund.nudgeText")).toBeTruthy();
  });
});
