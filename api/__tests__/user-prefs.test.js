import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocka Supabase-fabriken så vi kan styra både RPC:n och fallback-vägen
const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }));
vi.mock("../_supabase.js", () => ({ getSupabase: mocks.getSupabase }));

const { default: handler } = await import("../user-prefs.js");

function createReq(body) {
  // Ingen x-forwarded-for → rateLimit hoppar över; Bearer krävs av handlern
  return { method: "POST", headers: { authorization: "Bearer test-token" }, body };
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

// Kedjbar query-mock: select/eq/update/insert returnerar sig själv,
// maybeSingle ger läsresultatet och await:en på kedjan ger skrivresultatet.
function makeQuery({ read = { data: null, error: null }, write = { error: null } } = {}) {
  const q = {
    calls: [],
    select(...a) { q.calls.push(["select", ...a]); return q; },
    eq(...a) { q.calls.push(["eq", ...a]); return q; },
    update(...a) { q.calls.push(["update", ...a]); return q; },
    insert(...a) { q.calls.push(["insert", ...a]); return q; },
    maybeSingle: async () => read,
    then: (resolve, reject) => Promise.resolve(write).then(resolve, reject),
  };
  return q;
}

function makeSupabase({ rpc = { data: null, error: null }, query = makeQuery() } = {}) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    rpc: vi.fn().mockResolvedValue(rpc),
    from: vi.fn(() => query),
    _query: query,
  };
}

describe("POST /api/user-prefs", () => {
  beforeEach(() => {
    mocks.getSupabase.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("använder merge_preferences-RPC:n när den finns", async () => {
    const supabase = makeSupabase({ rpc: { data: { theme: "dark", goal: 5 }, error: null } });
    mocks.getSupabase.mockReturnValue(supabase);

    const res = createRes();
    await handler(createReq({ theme: "dark" }), res);

    expect(res.statusCode).toBe(200);
    expect(res._data).toEqual({ preferences: { theme: "dark", goal: 5 } });
    expect(supabase.rpc).toHaveBeenCalledWith("merge_preferences", { p_patch: { theme: "dark" } });
    // Ingen fallback-läsning/skrivning när RPC:n lyckas
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it.each(["PGRST202", "42883"])("faller tillbaka på läs → merge → skriv när RPC:n saknas (%s)", async (code) => {
    const query = makeQuery({
      read: { data: { preferences: { goal: 5 } }, error: null },
      write: { error: null },
    });
    const supabase = makeSupabase({ rpc: { data: null, error: { code, message: "not found" } }, query });
    mocks.getSupabase.mockReturnValue(supabase);

    const res = createRes();
    await handler(createReq({ theme: "dark" }), res);

    expect(res.statusCode).toBe(200);
    // Gamla vägen: befintliga prefs mergade med patchen
    expect(res._data).toEqual({ preferences: { goal: 5, theme: "dark" } });
    expect(query.calls).toContainEqual(["update", { preferences: { goal: 5, theme: "dark" } }]);
    expect(console.warn).toHaveBeenCalled();
  });

  it("insertar via fallbacken när raden inte finns", async () => {
    const query = makeQuery({ read: { data: null, error: null }, write: { error: null } });
    const supabase = makeSupabase({ rpc: { data: null, error: { code: "PGRST202", message: "not found" } }, query });
    mocks.getSupabase.mockReturnValue(supabase);

    const res = createRes();
    await handler(createReq({ theme: "dark" }), res);

    expect(res.statusCode).toBe(200);
    expect(res._data).toEqual({ preferences: { theme: "dark" } });
    expect(query.calls).toContainEqual(["insert", { user_id: "user-1", preferences: { theme: "dark" } }]);
  });

  it("svarar 500 på andra RPC-fel utan att röra fallbacken", async () => {
    const supabase = makeSupabase({ rpc: { data: null, error: { code: "42501", message: "permission denied" } } });
    mocks.getSupabase.mockReturnValue(supabase);

    const res = createRes();
    await handler(createReq({ theme: "dark" }), res);

    expect(res.statusCode).toBe(500);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("avvisar body som inte är ett objekt", async () => {
    const res = createRes();
    await handler(createReq(["inte", "ett", "objekt"]), res);
    expect(res.statusCode).toBe(400);
  });
});
