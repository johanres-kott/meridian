import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import HomeHero from "../HomeHero.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "sv" } }),
}));

let mockPrefs = {};
const mockUpdatePreferences = vi.fn();
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({ preferences: mockPrefs, updatePreferences: mockUpdatePreferences }),
}));

function makeData(overrides = {}) {
  return {
    portfolioLoaded: true,
    hasAnything: true,
    netWorth: 500000,
    householdNetWorth: 1000000,
    hasHouseholdView: false,
    dailyChangeSek: null,
    portfolioSek: null,
    pensionValue: null,
    assetSum: 1400000,
    debtSum: 900000,
    householdAssetSum: 3000000,
    householdDebtSum: 2000000,
    ...overrides,
  };
}

const text = (container) => container.textContent.replace(/\u00a0/g, " ");

describe("HomeHero", () => {
  beforeEach(() => { mockPrefs = {}; mockUpdatePreferences.mockClear(); });

  it("hides the view toggle when there is no household view to show", () => {
    const { container } = render(<HomeHero data={makeData()} />);
    expect(text(container)).toContain("500 000 SEK");
    expect(text(container)).not.toContain("myFinances.viewHousehold");
  });

  it("shows the toggle and my share by default when the household view differs", () => {
    const { container } = render(<HomeHero data={makeData({ hasHouseholdView: true })} />);
    expect(text(container)).toContain("myFinances.viewMine");
    expect(text(container)).toContain("myFinances.viewHousehold");
    expect(text(container)).toContain("500 000 SEK"); // min del
    expect(text(container)).not.toContain("1 000 000 SEK");
  });

  it("shows the full household net worth and sums when the household view is chosen", () => {
    mockPrefs = { netWorthView: "household" };
    const { container } = render(<HomeHero data={makeData({ hasHouseholdView: true })} />);
    expect(text(container)).toContain("1 000 000 SEK"); // householdNetWorth
    expect(text(container)).toContain("3 000 000 SEK"); // fulla tillgångar i chip
    expect(text(container)).toContain("2 000 000 SEK"); // fulla skulder i chip
  });

  it("ignores a saved household choice when the toggle is hidden", () => {
    mockPrefs = { netWorthView: "household" };
    const { container } = render(<HomeHero data={makeData({ hasHouseholdView: false })} />);
    expect(text(container)).toContain("500 000 SEK");
  });

  it("saves the chosen view in preferences", () => {
    const { getByText } = render(<HomeHero data={makeData({ hasHouseholdView: true })} />);
    fireEvent.click(getByText("myFinances.viewHousehold"));
    expect(mockUpdatePreferences).toHaveBeenCalledWith({ netWorthView: "household" });
  });
});
