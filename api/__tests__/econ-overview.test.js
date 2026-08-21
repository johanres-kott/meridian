import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally (samma mönster som property-index.test.js)
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { default: handler } = await import("../econ-overview.js");

function createReq() {
  return { method: "GET", query: {}, headers: {} };
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

// Standarddata som varje test kan skriva över. Riksbanksserien: höjd t.o.m.
// 2025-06-16 (2.00), sänkt till 1.75 fr.o.m. 2025-06-17.
const defaults = () => ({
  rbLatest: { date: "2026-08-21", value: 1.75 },
  rbSeries: [
    { date: "2025-06-13", value: 2.0 },
    { date: "2025-06-16", value: 2.0 },
    { date: "2025-06-17", value: 1.75 },
    { date: "2025-06-18", value: 1.75 },
    { date: "2026-08-21", value: 1.75 },
  ],
  // Som riktiga KPIF2020: tre innehåll — indexserien ska väljas via valueText
  // (här medvetet inte först, för att testa valet)
  kpifMeta: {
    variables: [
      {
        code: "ContentsCode",
        values: ["000007ZO", "000007ZN", "000007ZM"],
        valueTexts: ["KPIF, månadsförändring, 2020=100", "KPIF, index, 2020=100", "KPIF, 12-månadsförändring, 2020=100"],
      },
      { code: "Tid", values: ["1987M01", "2025M07", "2026M06", "2026M07"] },
    ],
  },
  // KPIF-index: 2026M07 mot 2025M07 → (130.16/126.51 − 1)·100 = 2.885… → 2.9
  kpifValues: { "2025M07": "126.51", "2026M07": "130.16" },
  housingMeta: {
    variables: [
      { code: "Region", values: ["00", "0010"], valueTexts: ["Riket", "Stor-Stockholm"] },
      { code: "Tid", values: ["1986K1", "2026K1", "2026K2"] },
    ],
  },
  // Småhus: 2026K2 mot 2026K1 → (951/942 − 1)·100 = 0.955… → 1.0
  housingValues: { "2026K1": "942", "2026K2": "951" },
});

// Router: svarar per URL så att alla tre källor kan mockas samtidigt.
function mockSources(overrides = {}) {
  const d = { ...defaults(), ...overrides };
  mockFetch.mockImplementation(async (url, opts) => {
    const u = String(url);
    const post = opts?.method === "POST";
    const ok = (json) => ({ ok: true, json: async () => json });

    if (u.includes("/Observations/Latest/SECBREPOEFF")) {
      if (d.rbLatest === "fail") return { ok: false, status: 503 };
      return ok(d.rbLatest);
    }
    if (u.includes("/Observations/SECBREPOEFF/")) {
      if (d.rbSeries === "fail") return { ok: false, status: 503 };
      return ok(d.rbSeries);
    }
    if (u.includes("KPIF2020")) {
      if (d.kpifMeta === "fail") return { ok: false, status: 503 };
      if (!post) return ok(d.kpifMeta);
      const body = JSON.parse(opts.body);
      const months = body.query.find(q => q.code === "Tid").selection.values;
      return ok({ data: months.map(m => ({ key: [m], values: [String(d.kpifValues[m] ?? "..")] })) });
    }
    if (u.includes("FastpiPSRegKv")) {
      if (d.housingMeta === "fail") return { ok: false, status: 503 };
      if (!post) return ok(d.housingMeta);
      const body = JSON.parse(opts.body);
      const quarters = body.query.find(q => q.code === "Tid").selection.values;
      const region = body.query.find(q => q.code === "Region").selection.values[0];
      return ok({ data: quarters.map(q => ({ key: [region, q], values: [String(d.housingValues[q] ?? "..")] })) });
    }
    throw new Error(`oväntad url i test: ${u}`);
  });
}

describe("GET /api/econ-overview", () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it("ger full respons när alla källor svarar", async () => {
    mockSources();
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.policyRate).toEqual({ value: 1.75, date: "2026-08-21", since: "2025-06-17" });
    expect(res._data.kpif).toEqual({ month: "2026M07", yoyPct: 2.9 });
    expect(res._data.housing).toEqual({ quarter: "2026K2", qoqPct: 1.0, region: "Riket" });
    expect(res._headers["Cache-Control"]).toBe("s-maxage=21600, stale-while-revalidate=3600");
  });

  it("KPIF-matten: årstakt ur index, avrundad till 1 decimal, negativ när index fallit", async () => {
    // (118.8/120.0 − 1)·100 = −1.0
    mockSources({ kpifValues: { "2025M07": "120.0", "2026M07": "118.8" } });
    const res = createRes();
    await handler(createReq(), res);
    expect(res._data.kpif).toEqual({ month: "2026M07", yoyPct: -1.0 });
    // ContentsCode från metadatat ska ingå i POST-queryn (tabellen kräver den)
    // och indexserien väljas via valueText, inte bara första värdet
    const kpifPost = mockFetch.mock.calls.find(([u, o]) => String(u).includes("KPIF2020") && o?.method === "POST");
    const contents = JSON.parse(kpifPost[1].body).query.find(q => q.code === "ContentsCode");
    expect(contents.selection.values).toEqual(["000007ZN"]);
  });

  it("'sedan'-logiken: ändring mitt i serien ger dagen efter sista avvikande värdet", async () => {
    mockSources({
      rbLatest: { date: "2026-08-21", value: 2.25 },
      rbSeries: [
        { date: "2025-01-10", value: 2.5 },
        { date: "2025-03-20", value: 2.25 },
        { date: "2025-03-21", value: 2.25 },
        // ojämn ordning från API:t ska inte spela roll — handlern sorterar
        { date: "2025-03-19", value: 2.5 },
        { date: "2026-08-21", value: 2.25 },
      ],
    });
    const res = createRes();
    await handler(createReq(), res);
    expect(res._data.policyRate).toEqual({ value: 2.25, date: "2026-08-21", since: "2025-03-20" });
  });

  it("'sedan' blir null när ingen ändring finns i fönstret", async () => {
    mockSources({
      rbSeries: [
        { date: "2024-09-02", value: 1.75 },
        { date: "2026-08-21", value: 1.75 },
      ],
    });
    const res = createRes();
    await handler(createReq(), res);
    expect(res._data.policyRate).toEqual({ value: 1.75, date: "2026-08-21", since: null });
  });

  it("fallerad källa ger null-block utan 500 — övriga block levereras", async () => {
    mockSources({ kpifMeta: "fail" });
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.kpif).toBeNull();
    expect(res._data.policyRate).not.toBeNull();
    expect(res._data.housing).not.toBeNull();
  });

  it("fallerad Riksbanksserie ger ändå styrräntan, med since = null", async () => {
    mockSources({ rbSeries: "fail" });
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res._data.policyRate).toEqual({ value: 1.75, date: "2026-08-21", since: null });
  });

  it("alla källor fallerade → tre null-block, fortfarande 200", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res._data).toEqual({ policyRate: null, kpif: null, housing: null });
  });

  it("småhus frågar Region 00 och räknar QoQ mot närmast föregående kvartal", async () => {
    mockSources({ housingValues: { "2026K1": "1000", "2026K2": "985" } });
    const res = createRes();
    await handler(createReq(), res);
    expect(res._data.housing).toEqual({ quarter: "2026K2", qoqPct: -1.5, region: "Riket" });
    const post = mockFetch.mock.calls.find(([u, o]) => String(u).includes("FastpiPSRegKv") && o?.method === "POST");
    const body = JSON.parse(post[1].body);
    expect(body.query.find(q => q.code === "Region").selection.values).toEqual(["00"]);
    expect(body.query.find(q => q.code === "Tid").selection.values).toEqual(["2026K1", "2026K2"]);
  });
});
