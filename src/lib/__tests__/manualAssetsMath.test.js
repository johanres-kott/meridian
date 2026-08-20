import { describe, it, expect } from "vitest";
import { shareOf, ownedValue, startDateOf, ownedValueAt, manualNetAt, reconstructNetWorthSeries, earliestStart } from "../manualAssetsMath.js";

const house = { id: "h", kind: "bostad", value_sek: 8600000, is_debt: false, created_at: "2026-08-19T10:00:00Z", metadata: { purchaseDate: "2024-09-03", ownershipShare: 50 } };
const loan = { id: "l", kind: "bolan", value_sek: 7657448, is_debt: true, created_at: "2026-08-19T10:00:00Z", metadata: { linkedAssetId: "h", ownershipShare: 50 } };
const vinst = { id: "v", kind: "vinstandel", value_sek: 30000, is_debt: false, created_at: "2026-08-19T10:00:00Z", metadata: { tranches: [{ year: 2022, value: 10000 }, { year: 2024, value: 20000 }] } };
const rows = [house, loan, vinst];

describe("manualAssetsMath", () => {
  it("applies ownership share (default 100 %)", () => {
    expect(shareOf(house)).toBe(0.5);
    expect(shareOf({ metadata: {} })).toBe(1);
    expect(shareOf({ metadata: { ownershipShare: 0 } })).toBe(1);
    expect(ownedValue(house)).toBe(4300000);
    expect(ownedValue(loan)).toBe(3828724);
  });

  it("derives start date: purchase date for the house, inherited by the linked loan, created_at otherwise", () => {
    expect(startDateOf(house, rows)).toBe("2024-09-03");
    expect(startDateOf(loan, rows)).toBe("2024-09-03");
    expect(startDateOf(vinst, rows)).toBe("2026-08-19");
  });

  it("values a post as 0 before its start date and builds vinstandel tranche by tranche", () => {
    expect(ownedValueAt(house, "2024-01-01", rows)).toBe(0);
    expect(ownedValueAt(house, "2024-09-03", rows)).toBe(4300000);
    expect(ownedValueAt(vinst, "2023-06-01", rows)).toBe(10000);
    expect(ownedValueAt(vinst, "2024-06-01", rows)).toBe(30000);
    // din andel av huset − din andel av lånet = eget kapital, inte hela huset − hela lånet
    expect(manualNetAt([house, loan], "2025-01-01")).toBe(4300000 - 3828724);
    expect(earliestStart(rows)).toBe("2022-01-01");
  });

  it("reconstructs a net-worth series from portfolio history + flat pension + dated posts", () => {
    const portfolio = [{ date: "2025-01-01", value: 100000 }, { date: "2025-01-03", value: 120000 }];
    const series = reconstructNetWorthSeries({ portfolioPoints: portfolio, pensionValue: 50000, manualRows: [house, loan], fromDate: "2024-12-31", toDate: "2025-01-03" });
    expect(series.map(p => p.date)).toEqual(["2024-12-31", "2025-01-01", "2025-01-02", "2025-01-03"]);
    // före första portföljpunkten: första kända portföljvärdet, märkt estimerat
    expect(series[0]).toMatchObject({ value: 100000 + 50000 + (4300000 - 3828724), estimated: true });
    expect(series[1]).toMatchObject({ value: 100000 + 50000 + 471276, estimated: false });
    expect(series[2].value).toBe(100000 + 50000 + 471276); // 2/1 saknar punkt → håller kvar 1/1
    expect(series[3].value).toBe(120000 + 50000 + 471276);
  });
});
