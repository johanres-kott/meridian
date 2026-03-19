import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env var before importing
process.env.FINNHUB_KEY = "test-key";

// Dynamic import to pick up env var
const { default: handler } = await import("../search.js");

function createReq(query = {}) {
  return { method: "GET", query };
}

function createRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    _data: null,
    setHeader(k, v) { this._headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this._data = data; },
    end() {},
  };
  return res;
}

describe("GET /api/search", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns 400 without q parameter", async () => {
    const res = createRes();
    await handler(createReq({}), res);
    expect(res.statusCode).toBe(400);
    expect(res._data.error).toBeTruthy();
  });

  it("returns 400 with too short q parameter", async () => {
    const res = createRes();
    await handler(createReq({ q: "a" }), res);
    expect(res.statusCode).toBe(400);
  });

  it("proxies to Finnhub and returns results", async () => {
    const finnhubResponse = {
      count: 2,
      result: [
        { description: "Ericsson B", symbol: "ERIC-B.ST", type: "Common Stock" },
        { description: "Ericsson A", symbol: "ERIC-A.ST", type: "Common Stock" },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(finnhubResponse),
    });

    const res = createRes();
    await handler(createReq({ q: "ericsson" }), res);

    expect(res.statusCode).toBe(200);
    expect(res._data.result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("finnhub.io/api/v1/search?q=ericsson")
    );
  });

  it("handles Finnhub errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = createRes();
    await handler(createReq({ q: "test" }), res);

    expect(res.statusCode).toBe(500);
    expect(res._data.error).toBeTruthy();
  });
});
