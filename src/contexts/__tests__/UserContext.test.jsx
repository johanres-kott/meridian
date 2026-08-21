import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

// Styrbar supabase-mock: testet avgör när/hur preferences-hämtningen slutförs.
const singleMock = vi.fn();
const upsertMock = vi.fn(async () => ({}));
const updateEqMock = vi.fn(async () => ({ error: null }));
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: singleMock }) }),
      upsert: upsertMock,
      update: () => ({ eq: updateEqMock }),
    }),
  },
}));

import { UserProvider, useUser } from "../UserContext.jsx";

function Probe() {
  const { prefsLoaded, preferences, saveStatus, updatePreferences, retrySave } = useUser();
  return (
    <div>
      <span data-testid="loaded">{String(prefsLoaded)}</span>
      <span data-testid="profile">{preferences.investorProfile ? "yes" : "no"}</span>
      <span data-testid="status">{saveStatus}</span>
      <button data-testid="write" onClick={() => updatePreferences({ theme: "dark" })}>w</button>
      <button data-testid="retry" onClick={retrySave}>r</button>
    </div>
  );
}

const session = { user: { id: "u1", email: "test@example.com" }, access_token: "tok" };

describe("UserContext prefsLoaded", () => {
  beforeEach(() => { singleMock.mockReset(); upsertMock.mockClear(); });

  it("is false while preferences load and true once they arrive", async () => {
    let resolveFetch;
    singleMock.mockReturnValue(new Promise(r => { resolveFetch = r; }));
    render(<UserProvider session={session}><Probe /></UserProvider>);

    // Gaten: innan hämtningen slutförts får ingen onboarding-yta anta något
    expect(screen.getByTestId("loaded").textContent).toBe("false");

    await act(async () => {
      resolveFetch({ data: { last_seen_at: null, preferences: { investorProfile: { riskProfile: "medium" } } } });
    });
    await waitFor(() => expect(screen.getByTestId("loaded").textContent).toBe("true"));
    expect(screen.getByTestId("profile").textContent).toBe("yes");
  });

  it("becomes true even when the fetch fails, with empty preferences", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    singleMock.mockRejectedValue(new Error("network down"));
    render(<UserProvider session={session}><Probe /></UserProvider>);
    await waitFor(() => expect(screen.getByTestId("loaded").textContent).toBe("true"));
    expect(screen.getByTestId("profile").textContent).toBe("no");
    errSpy.mockRestore();
  });
});

describe("sparstatus", () => {
  beforeEach(() => {
    singleMock.mockResolvedValue({ data: { preferences: {} } });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("blir saved när proxyn lyckas", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ preferences: { theme: "dark" } }) });
    render(<UserProvider session={session}><Probe /></UserProvider>);
    await waitFor(() => expect(screen.getByTestId("loaded").textContent).toBe("true"));
    await act(async () => { screen.getByTestId("write").click(); });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("saved"));
  });

  it("blir error när både proxy och fallback fallerar, och retrySave räddar", async () => {
    fetch.mockRejectedValue(new Error("offline"));
    updateEqMock.mockResolvedValueOnce({ error: { message: "nope" } });
    render(<UserProvider session={session}><Probe /></UserProvider>);
    await waitFor(() => expect(screen.getByTestId("loaded").textContent).toBe("true"));
    await act(async () => { screen.getByTestId("write").click(); });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("error"));
    // nätet kommer tillbaka: retry skickar om den väntande patchen
    fetch.mockResolvedValue({ ok: true, json: async () => ({ preferences: { theme: "dark" } }) });
    await act(async () => { screen.getByTestId("retry").click(); });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("saved"));
    const sent = JSON.parse(fetch.mock.calls.at(-1)[1].body);
    expect(sent.theme).toBe("dark");
  });
});
