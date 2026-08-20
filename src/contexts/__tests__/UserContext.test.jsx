import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

// Styrbar supabase-mock: testet avgör när/hur preferences-hämtningen slutförs.
const singleMock = vi.fn();
const upsertMock = vi.fn(async () => ({}));
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: singleMock }) }),
      upsert: upsertMock,
    }),
  },
}));

import { UserProvider, useUser } from "../UserContext.jsx";

function Probe() {
  const { prefsLoaded, preferences } = useUser();
  return (
    <div>
      <span data-testid="loaded">{String(prefsLoaded)}</span>
      <span data-testid="profile">{preferences.investorProfile ? "yes" : "no"}</span>
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
