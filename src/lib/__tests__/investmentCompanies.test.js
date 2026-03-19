import { describe, it, expect } from "vitest";
import { INVESTMENT_COMPANIES } from "../investmentCompanies.js";

describe("INVESTMENT_COMPANIES", () => {
  it("contains at least 3 companies", () => {
    expect(INVESTMENT_COMPANIES.length).toBeGreaterThanOrEqual(3);
  });

  INVESTMENT_COMPANIES.forEach((company) => {
    describe(company.name, () => {
      it("has required fields", () => {
        expect(company.id).toBeTruthy();
        expect(company.name).toBeTruthy();
        expect(company.url).toMatch(/^https?:\/\//);
        expect(company.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(company.holdings.length).toBeGreaterThan(0);
      });

      it("all holdings have valid tickers", () => {
        company.holdings.forEach((h) => {
          expect(h.name).toBeTruthy();
          expect(h.ticker).toBeTruthy();
          // Ticker should contain a dot (e.g., .ST, .HE) or be a US ticker
          expect(h.ticker).toMatch(/\.|^[A-Z]+$/);
        });
      });

      it("all weights are between 0 and 100", () => {
        company.holdings.forEach((h) => {
          if (h.weight != null) {
            expect(h.weight).toBeGreaterThanOrEqual(0);
            expect(h.weight).toBeLessThanOrEqual(100);
          }
        });
      });

      it("all valueMSEK are positive or null", () => {
        company.holdings.forEach((h) => {
          if (h.valueMSEK != null) {
            expect(h.valueMSEK).toBeGreaterThan(0);
          }
        });
      });

      it("has no duplicate tickers", () => {
        const tickers = company.holdings.map((h) => h.ticker.toUpperCase());
        expect(new Set(tickers).size).toBe(tickers.length);
      });
    });
  });
});
