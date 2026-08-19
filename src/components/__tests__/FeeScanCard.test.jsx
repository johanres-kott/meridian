import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FeeScanCard from "../FeeScanCard.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k, opts) => (opts ? `${k}:${JSON.stringify(opts)}` : k) }),
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

const ACTIVE_FUND = {
  secId: "F0AKTIV", name: "Aktiv Sverigefond", legalName: "Aktiv Sverigefond A",
  nav: 100, currency: "SEK", ongoingCharge: 1.42, indexFund: false,
};
const TOP_GLOBAL = {
  results: [
    { secId: "F0INDEX", name: "Global Index", legalName: "Billig Global Index", indexFund: true, ongoingCharge: 0.12 },
    { secId: "F0DYR", name: "Dyr Global", legalName: "Dyr Global Aktiv", indexFund: false, ongoingCharge: 1.8 },
  ],
};

function mockFetch() {
  globalThis.fetch = vi.fn((url) => {
    const body = String(url).startsWith("/api/fund-top") ? TOP_GLOBAL : ACTIVE_FUND;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
}

afterEach(() => vi.restoreAllMocks());

describe("FeeScanCard", () => {
  it("renders nothing when the user owns no funds", async () => {
    watchlistRows = [];
    mockFetch();
    const { container } = render(<FeeScanCard onNavigate={vi.fn()} />);
    await new Promise(r => setTimeout(r, 0));
    expect(container.innerHTML).toBe("");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows the yearly fee difference for an owned active fund", async () => {
    watchlistRows = [{ ticker: "F0AKTIV", name: "Aktiv Sverigefond", shares: 100, type: "fund" }];
    mockFetch();
    render(<FeeScanCard onNavigate={vi.fn()} />);
    expect(await screen.findByText("feeScan.title")).toBeTruthy();
    expect(screen.getByText("Aktiv Sverigefond A")).toBeTruthy();
    // value 100 shares × 100 SEK = 10 000 kr; diff (1.42−0.12)% = 130 kr/år
    expect(screen.getByText(/130/)).toBeTruthy();
  });

  it("renders nothing when the user only owns index funds", async () => {
    watchlistRows = [{ ticker: "F0INDEX", name: "Global Index", shares: 50, type: "fund" }];
    globalThis.fetch = vi.fn((url) => {
      const body = String(url).startsWith("/api/fund-top")
        ? TOP_GLOBAL
        : { secId: "F0INDEX", nav: 200, currency: "SEK", ongoingCharge: 0.12, indexFund: true };
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    });
    const { container } = render(<FeeScanCard onNavigate={vi.fn()} />);
    await new Promise(r => setTimeout(r, 20));
    expect(container.innerHTML).toBe("");
  });
});
