import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally (samma mönster som search.test.js, men via stubGlobal
// så filen även klarar eslint utan node-globals)
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { default: handler } = await import("../property-index.js");

function createReq(query = {}) {
  // setCors läser req.headers.origin — ge en tom headers-påse
  return { method: "GET", query, headers: {} };
}

function createRes() {
  return {
    statusCode: 200,
    _headers: {},
    _data: null,
    setHeader(k, v) { this._headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this._data = data; },
    end() {},
  };
}

function mockScb({ latest = "2026K1", values = {} } = {}) {
  // 1:a anropet: metadata (GET), 2:a: data (POST)
  mockFetch.mockImplementation(async (url, opts) => {
    if (!opts || !opts.method || opts.method === "GET") {
      return {
        ok: true,
        json: async () => ({
          variables: [
            { code: "Region", values: ["00", "0010"], valueTexts: ["Riket", "Stor-Stockholm"] },
            { code: "Tid", values: ["1986K1", "2024K3", latest] },
          ],
        }),
      };
    }
    const body = JSON.parse(opts.body);
    const quarters = body.query.find(q => q.code === "Tid").selection.values;
    const region = body.query.find(q => q.code === "Region").selection.values[0];
    return {
      ok: true,
      json: async () => ({
        data: quarters.map(q => ({ key: [region, q], values: [String(values[q] ?? "100")] })),
      }),
    };
  });
}

describe("GET /api/property-index", () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it("konverterar köpdatum till kvartal och räknar factor och estimate", async () => {
    mockScb({ latest: "2026K1", values: { "2024K3": 942, "2026K1": 951 } });
    const res = createRes();
    await handler(createReq({ price: "8600000", date: "2024-09-03" }), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.purchaseQuarter).toBe("2024K3"); // september = K3
    expect(res._data.latestQuarter).toBe("2026K1");
    expect(res._data.indexThen).toBe(942);
    expect(res._data.indexNow).toBe(951);
    expect(res._data.factor).toBeCloseTo(951 / 942, 10);
    // 8 600 000 × 951/942 = 8 682 165,6 → närmaste tusenlapp
    expect(res._data.estimate).toBe(8682000);
    expect(res._data.region).toBe("00");
    expect(res._data.regionText).toBe("Riket");
    expect(res._headers["Cache-Control"]).toBe("s-maxage=86400, stale-while-revalidate=3600");
  });

  it.each([
    ["2024-01-15", "2024K1"],
    ["2024-03", "2024K1"],
    ["2024-04-01", "2024K2"],
    ["2024-06", "2024K2"],
    ["2024-07-31", "2024K3"],
    ["2024-10", "2024K4"],
    ["2024-12-24", "2024K4"],
  ])("kvartalskonvertering: %s → %s", async (date, quarter) => {
    mockScb({ latest: "2026K1", values: { [quarter]: 100, "2026K1": 110 } });
    const res = createRes();
    await handler(createReq({ price: "1000000", date }), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.purchaseQuarter).toBe(quarter);
  });

  it("klampar framtida köpdatum till senaste kvartal med factor 1 och estimate = price", async () => {
    mockScb({ latest: "2026K1", values: { "2026K1": 951 } });
    const res = createRes();
    await handler(createReq({ price: "8600500", date: "2027-05-01" }), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.factor).toBe(1);
    expect(res._data.estimate).toBe(8600500); // exakt priset, ingen tusenlappsavrundning
    expect(res._data.purchaseQuarter).toBe("2026K1");
    expect(res._data.latestQuarter).toBe("2026K1");
    // bara ett kvartal i POST:en när de sammanfaller
    const postCall = mockFetch.mock.calls.find(([, opts]) => opts?.method === "POST");
    expect(JSON.parse(postCall[1].body).query.find(q => q.code === "Tid").selection.values).toEqual(["2026K1"]);
  });

  it("ger 400 för köpdatum före 1986K1", async () => {
    mockScb();
    const res = createRes();
    await handler(createReq({ price: "1000000", date: "1979-06-01" }), res);
    expect(res.statusCode).toBe(400);
    expect(res._data.error).toContain("1986K1");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ date: "2024-09-03" }],                              // price saknas
    [{ price: "0", date: "2024-09-03" }],                  // price = 0
    [{ price: "-5", date: "2024-09-03" }],                 // negativt
    [{ price: "1000000.5", date: "2024-09-03" }],          // ej heltal
    [{ price: "abc", date: "2024-09-03" }],                // ej tal
    [{ price: "1000000" }],                                // date saknas
    [{ price: "1000000", date: "2024" }],                  // fel format
    [{ price: "1000000", date: "2024-13-01" }],            // ogiltig månad
    [{ price: "1000000", date: "2024-09-03", region: "XX" }], // ogiltig region
  ])("ger 400 för ogiltig input %j", async (query) => {
    mockScb();
    const res = createRes();
    await handler(createReq(query), res);
    expect(res.statusCode).toBe(400);
    expect(res._data.error).toBeTruthy();
  });

  it("skickar vald region till SCB och returnerar dess text", async () => {
    mockScb({ latest: "2026K1", values: { "2020K2": 500, "2026K1": 600 } });
    const res = createRes();
    await handler(createReq({ price: "2000000", date: "2020-05", region: "0010" }), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.region).toBe("0010");
    expect(res._data.regionText).toBe("Stor-Stockholm");
    const postCall = mockFetch.mock.calls.find(([, opts]) => opts?.method === "POST");
    expect(JSON.parse(postCall[1].body).query.find(q => q.code === "Region").selection.values).toEqual(["0010"]);
  });

  it("ger 502 när SCB fallerar", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const res = createRes();
    await handler(createReq({ price: "1000000", date: "2024-09-03" }), res);
    expect(res.statusCode).toBe(502);
    expect(res._data.error).toBe("scb_error");
  });

  it("ger 502 när indexvärde saknas (t.ex. '..')", async () => {
    mockScb({ latest: "2026K1", values: { "2024K3": "..", "2026K1": 951 } });
    const res = createRes();
    await handler(createReq({ price: "1000000", date: "2024-09-03" }), res);
    expect(res.statusCode).toBe(502);
  });
});
