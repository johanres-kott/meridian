import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HealthSignal from "../company/HealthSignal.jsx";
import AboutCompany from "../company/AboutCompany.jsx";

const SCORE_RESPONSE = {
  ticker: "AAPL",
  scores: {
    piotroski: { raw: 8, normalized: 88.9 },
    magicFormula: 50,
    growth: 58.2,
    dividend: 43.4,
    quality: 91.2,
  },
  composite: { value: 74.1, growth: 71.3, dividend: 65.7, mixed: 66.3 },
};

describe("HealthSignal", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(SCORE_RESPONSE) })
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("answers 'Går bolaget bra?' from the composite score", async () => {
    render(<HealthSignal ticker="AAPL" />);
    expect(await screen.findByText("Går bolaget bra?")).toBeTruthy();
    // mixed composite 66.3 → "Sådär"
    expect(screen.getByText("Sådär")).toBeTruthy();
    expect(screen.getByText("66")).toBeTruthy();
  });

  it("always uses the mixed composite (66.3 → Sådär, not value 74.1 → Ja)", async () => {
    render(<HealthSignal ticker="AAPL" />);
    expect(await screen.findByText("Sådär")).toBeTruthy();
    expect(screen.queryByText("Ja")).toBeNull();
  });

  it("shows plain-language drivers", async () => {
    render(<HealthSignal ticker="AAPL" />);
    await screen.findByText("Går bolaget bra?");
    expect(screen.getByText("Lönsamhet:")).toBeTruthy();
    expect(screen.getByText("Tillväxt:")).toBeTruthy();
    expect(screen.getByText("Finansiell hälsa:")).toBeTruthy();
  });

  it("renders nothing when no score exists", async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(null) }));
    const { container } = render(<HealthSignal ticker="UNKNOWN" />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
  });
});

describe("AboutCompany", () => {
  const company = {
    description: "Apple Inc. designs, manufactures, and markets smartphones worldwide.",
    website: "https://www.apple.com",
    sector: "Technology",
    industry: "Consumer Electronics",
    employees: 150000,
    headquarters: "Cupertino, United States",
  };

  it("shows description, facts and website", () => {
    render(<AboutCompany company={company} />);
    expect(screen.getByText("Om bolaget")).toBeTruthy();
    expect(screen.getByText(/designs, manufactures/)).toBeTruthy();
    expect(screen.getByText("Technology · Consumer Electronics")).toBeTruthy();
    expect(screen.getByText("Cupertino, United States")).toBeTruthy();
    expect(screen.getByText("apple.com ↗").closest("a").href).toBe("https://www.apple.com/");
  });

  it("truncates long descriptions with 'Läs mer'", () => {
    const long = { ...company, description: "x".repeat(600) };
    render(<AboutCompany company={long} />);
    const toggle = screen.getByText("Läs mer");
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.getByText("Visa mindre")).toBeTruthy();
  });

  it("renders nothing without description and website", () => {
    const { container } = render(<AboutCompany company={{ sector: "Technology" }} />);
    expect(container.innerHTML).toBe("");
  });
});
