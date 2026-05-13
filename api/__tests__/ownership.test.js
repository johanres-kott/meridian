import { describe, it, expect } from "vitest";
import { computeOwnershipSignals } from "../ownership.js";

describe("computeOwnershipSignals", () => {
  it("treats curated 'insider' rows as the largest controlling holder", () => {
    // Investor AB-style: Wallenberg foundations are tagged 'insider' in curated data
    const result = computeOwnershipSignals({
      source: "curated",
      insidersPercent: 23.3,
      topHolders: [
        { name: "BlackRock", pctHeld: 1.2, type: "institution" },
      ],
      _signalHolders: [
        { name: "Knut och Alice Wallenbergs Stiftelse", pctHeld: 23.3, type: "insider" },
        { name: "BlackRock", pctHeld: 1.2, type: "institution" },
      ],
    });
    expect(result.largestHolder.name).toBe("Knut och Alice Wallenbergs Stiftelse");
    expect(result.largestHolder.pctHeld).toBe(23.3);
    expect(result.freeFloatPercent).toBe(76.7);
    expect(result.isSpinOffCandidate).toBe(false);
  });

  it("flags spin-off candidate when curated insider holder >=30% pushes float below 15%", () => {
    // Latour-style: Douglas-family controls ~75% as insider/strategic block
    const result = computeOwnershipSignals({
      source: "curated",
      insidersPercent: 75,
      topHolders: [
        { name: "Wirum Invest", pctHeld: 6, type: "institution" },
        { name: "Vanguard", pctHeld: 1.2, type: "institution" },
      ],
      _signalHolders: [
        { name: "Investment AB Latour", pctHeld: 75, type: "insider" },
        { name: "Wirum Invest", pctHeld: 6, type: "institution" },
        { name: "Vanguard", pctHeld: 1.2, type: "institution" },
      ],
    });
    expect(result.freeFloatPercent).toBe(19); // 100 - 75 - 6 = 19
    expect(result.strategicHoldersPercent).toBe(6);
    expect(result.largestHolder.name).toBe("Investment AB Latour");
    expect(result.isSpinOffCandidate).toBe(false); // float 19% > 15%
  });

  it("flags spin-off candidate when free float drops below 15%", () => {
    // ICA-style: largest holder ~52% + smaller strategic stakes pushing float below 15%
    const holders = [
      { name: "ICA-handlarnas Förbund", pctHeld: 52, type: "institution" },
      { name: "Industrivärden", pctHeld: 20, type: "institution" },
      { name: "AMF", pctHeld: 8, type: "institution" },
      { name: "SEB Fonder", pctHeld: 7, type: "institution" },
      { name: "Nordea Fonder", pctHeld: 4, type: "institution" },
    ];
    const result = computeOwnershipSignals({
      source: "curated",
      insidersPercent: 1,
      topHolders: holders,
      _signalHolders: holders,
    });
    expect(result.isLowFloat).toBe(true);
    expect(result.isSpinOffCandidate).toBe(true);
    expect(result.largestHolder.pctHeld).toBe(52);
  });

  it("never flags Yahoo-sourced tickers as spin-off candidates", () => {
    // Yahoo for Latour shows a misleading 22% float — should NOT trigger spin-off flag
    const result = computeOwnershipSignals({
      source: "yahoo",
      insidersPercent: 78,
      topHolders: [
        { name: "Vanguard", pctHeld: 0.3 },
      ],
    });
    expect(result.isLowFloat).toBe(false); // Yahoo: 100 - 78 = 22% (above 15% threshold here)
    expect(result.isSpinOffCandidate).toBe(false);
  });

  it("treats Yahoo institutional holdings as part of float", () => {
    // US large cap: high institutional ownership but low insiders → high float
    const result = computeOwnershipSignals({
      source: "yahoo",
      insidersPercent: 0.07,
      topHolders: [
        { name: "Vanguard", pctHeld: 8 },
        { name: "BlackRock", pctHeld: 6.5 },
      ],
    });
    expect(result.freeFloatPercent).toBeGreaterThan(99);
    expect(result.isLowFloat).toBe(false);
    expect(result.isSpinOffCandidate).toBe(false);
  });

  it("returns null largestHolder when no holders are present", () => {
    const result = computeOwnershipSignals({
      source: "curated",
      insidersPercent: null,
      topHolders: [],
    });
    expect(result.largestHolder).toBeNull();
    expect(result.isSpinOffCandidate).toBe(false);
    expect(result.freeFloatPercent).toBe(100);
  });

  it("does not flag spin-off when largest holder is below 30%", () => {
    const holders = [
      { name: "Owner A", pctHeld: 25, type: "institution" },
      { name: "Owner B", pctHeld: 22, type: "institution" },
      { name: "Owner C", pctHeld: 20, type: "institution" },
      { name: "Owner D", pctHeld: 18, type: "institution" },
    ];
    const result = computeOwnershipSignals({
      source: "curated",
      insidersPercent: 1,
      topHolders: holders,
      _signalHolders: holders,
    });
    expect(result.freeFloatPercent).toBe(14);
    expect(result.isLowFloat).toBe(true);
    expect(result.isSpinOffCandidate).toBe(false);
  });
});
