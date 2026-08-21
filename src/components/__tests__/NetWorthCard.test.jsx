import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import NetWorthCard from "../NetWorthCard.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "sv" } }),
}));

let mockPrefs = {};
const mockUpdatePreferences = vi.fn();
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ preferences: mockPrefs, updatePreferences: mockUpdatePreferences }),
}));

// manualAssets.js drar in supabase-klienten — stubba den och behåll den
// riktiga effectiveValueSek (radbeloppen ska visa användarens ägarandel).
vi.mock("../../supabase.js", () => ({ supabase: {} }));
vi.mock("../../lib/manualAssets.js", async (importOriginal) => ({
  ...(await importOriginal()),
  deleteManualAsset: vi.fn(),
}));

function makeData(overrides = {}) {
  return {
    portfolioSek: null,
    portfolioLoaded: true,
    pensionValue: null,
    netWorth: 0,
    hasAnything: true,
    reloadManual: () => {},
    assets: [],
    debts: [],
    ...overrides,
  };
}

function rowTexts(container) {
  // en enda selektor — jsdom garanterar inte dokumentordning för selektorlistor
  return [...container.querySelectorAll("[title^='Öppna']")]
    .map(el => el.textContent.replace(/\u00a0/g, " "));
}

describe("NetWorthCard", () => {
  beforeEach(() => { mockPrefs = {}; mockUpdatePreferences.mockClear(); });

  it("groups a bolan with a dangling linkedAssetId under the only bostad", () => {
    const data = makeData({
      assets: [{ id: "h2", kind: "bostad", label: "huset", value_sek: 4618000, metadata: {} }],
      debts: [{ id: "l1", kind: "bolan", label: "Huset", value_sek: 3828724, metadata: { linkedAssetId: "raderad-rad" } }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("huset");
    expect(rows[1]).toContain("Huset");
  });

  it("labels the portfolio row by its contents", () => {
    const stocksOnly = makeData({ portfolioSek: 200000, stocksSek: 200000, fundsSek: 0 });
    const { container, unmount } = render(<NetWorthCard data={stocksOnly} />);
    expect([...container.querySelectorAll("span")].map(e => e.textContent)).toContain("myFinances.stocksOnly");
    unmount();
    const fundsOnly = makeData({ portfolioSek: 200000, stocksSek: 0, fundsSek: 200000 });
    const r2 = render(<NetWorthCard data={fundsOnly} />);
    expect([...r2.container.querySelectorAll("span")].map(e => e.textContent)).toContain("myFinances.fundsOnly");
  });

  it("shows the specific unpriced-holdings message when unpricedTickers exist", () => {
    const data = makeData({ portfolioSek: null, unpricedTickers: ["VOLV-B.ST", "ERIC-B.ST"] });
    const { container } = render(<NetWorthCard data={data} />);
    expect(container.textContent).toContain("myFinances.portfolioUnpriced");
    expect(container.textContent).not.toContain("myFinances.portfolioUnavailable");
  });

  it("falls back to the generic unavailable message when portfolioSek is null without unpriced holdings", () => {
    const data = makeData({ portfolioSek: null, unpricedTickers: [] });
    const { container } = render(<NetWorthCard data={data} />);
    expect(container.textContent).toContain("myFinances.portfolioUnavailable");
  });

  it("splits the portfolio row into stocks and funds when both exist", () => {
    const data = makeData({ portfolioSek: 300000, stocksSek: 200000, fundsSek: 100000 });
    const { container } = render(<NetWorthCard data={data} />);
    const texts = [...container.querySelectorAll("span")].map(e => e.textContent);
    expect(texts).toContain("myFinances.stocks");
    expect(texts).toContain("myFinances.funds");
  });

  it("shows no portfolio split when it is stocks only", () => {
    const data = makeData({ portfolioSek: 300000, stocksSek: 300000, fundsSek: 0 });
    const { container } = render(<NetWorthCard data={data} />);
    const texts = [...container.querySelectorAll("span")].map(e => e.textContent);
    expect(texts).not.toContain("myFinances.stocks");
  });


  it("renders a loan linked via metadata.linkedAssetId directly under its asset", () => {
    const data = makeData({
      assets: [
        { id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: {} },
        { id: "s1", kind: "sparkonto", label: "Sparkontot", value_sek: 50000, metadata: {} },
      ],
      debts: [{ id: "l1", kind: "bolan", label: "Bolån · Huset", value_sek: 2000000, metadata: { linkedAssetId: "h1" } }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("Huset");
    expect(rows[1]).toContain("Bolån · Huset");
    expect(rows[2]).toContain("Sparkontot");
  });

  it("groups an unlinked bolan under the only bostad asset", () => {
    const data = makeData({
      assets: [{ id: "h1", kind: "bostad", label: "huset", value_sek: 3000000, metadata: {} }],
      debts: [{ id: "l1", kind: "bolan", label: "Huset", value_sek: 7657448, metadata: {} }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("huset");
    expect(rows[1]).toContain("Huset");
    expect(rows[1]).toContain("−7 657 448 SEK");
  });

  it("leaves an unlinked bolan standalone when there are several bostad assets", () => {
    const data = makeData({
      assets: [
        { id: "h1", kind: "bostad", label: "Villan", value_sek: 3000000, metadata: {} },
        { id: "h2", kind: "bostad", label: "Stugan", value_sek: 1000000, metadata: {} },
      ],
      debts: [{ id: "l1", kind: "bolan", label: "Bolånet", value_sek: 2000000, metadata: {} }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    // fristående skulder listas sist, efter båda bostäderna
    expect(rows[2]).toContain("Bolånet");
  });

  it("shows the owner's share of value and a share badge when ownershipShare < 100", () => {
    const data = makeData({
      assets: [{ id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: { ownershipShare: 50 } }],
      debts: [{ id: "l1", kind: "bolan", label: "Bolån · Huset", value_sek: 2000000, metadata: { linkedAssetId: "h1", ownershipShare: 50 } }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("Huset");
    expect(rows[0]).toContain("50 %");
    expect(rows[0]).toContain("1 500 000 SEK"); // halva värdet
    expect(rows[1]).toContain("50 %");
    expect(rows[1]).toContain("−1 000 000 SEK"); // halva lånet
  });

  it("shows the share badge on standalone debts too", () => {
    const data = makeData({
      assets: [],
      debts: [{ id: "d1", kind: "skuld", label: "CSN", value_sek: 150000, metadata: { ownershipShare: 50 } }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("CSN");
    expect(rows[0]).toContain("50 %");
    expect(rows[0]).toContain("−75 000 SEK");
  });

  it("shows full value without badge at 100 % ownership", () => {
    const data = makeData({
      assets: [{ id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: { ownershipShare: 100 } }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[0]).toContain("3 000 000 SEK");
    expect(rows[0]).not.toContain("100 %");
  });

  describe("Min del / Hushållet", () => {
    const sharedData = () => makeData({
      netWorth: 500000,
      householdNetWorth: 1000000,
      hasHouseholdView: true,
      assets: [{ id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: { owners: { me: 50, p1: 50 }, ownershipShare: 50 } }],
    });

    it("hides the toggle when the household view would be identical", () => {
      const data = makeData({
        assets: [{ id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: { ownershipShare: 50 } }],
        hasHouseholdView: false,
      });
      const { container } = render(<NetWorthCard data={data} />);
      expect(container.textContent).not.toContain("myFinances.viewHousehold");
    });

    it("shows the toggle and my share by default when members and a shared row exist", () => {
      const { container } = render(<NetWorthCard data={sharedData()} showTotal />);
      expect(container.textContent).toContain("myFinances.viewMine");
      expect(container.textContent).toContain("myFinances.viewHousehold");
      const rows = rowTexts(container);
      expect(rows[0]).toContain("1 500 000 SEK"); // min del
      expect(rows[0]).toContain("50 %");
      expect(container.textContent.replace(/\u00a0/g, " ")).toContain("500 000 SEK"); // total = min del
    });

    it("shows full amounts without badges in the household view", () => {
      mockPrefs = { netWorthView: "household" };
      const { container } = render(<NetWorthCard data={sharedData()} showTotal />);
      const rows = rowTexts(container);
      expect(rows[0]).toContain("3 000 000 SEK"); // fulla värdet
      expect(rows[0]).not.toContain("50 %");      // ingen badge
      expect(container.textContent.replace(/\u00a0/g, " ")).toContain("1 000 000 SEK"); // householdNetWorth
    });

    it("saves the chosen view in preferences", () => {
      const { getByText } = render(<NetWorthCard data={sharedData()} />);
      fireEvent.click(getByText("myFinances.viewHousehold"));
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ netWorthView: "household" });
    });
  });

  it("keeps other debts standalone", () => {
    const data = makeData({
      assets: [{ id: "h1", kind: "bostad", label: "Huset", value_sek: 3000000, metadata: {} }],
      debts: [{ id: "d1", kind: "skuld", label: "CSN", value_sek: 150000, metadata: {} }],
    });
    const { container } = render(<NetWorthCard data={data} />);
    const rows = rowTexts(container);
    expect(rows[1]).toContain("CSN");
  });
});
