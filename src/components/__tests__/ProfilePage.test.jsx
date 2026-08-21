import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

let prefs = {};
const updatePreferences = vi.fn();
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({
    session: { user: { email: "johan@example.com" } },
    userId: "u1",
    preferences: prefs,
    updatePreferences,
  }),
}));
// Familj-sektionen läser manual_assets för borttagnings-varningen; Lotten (p1)
// står som ägare på en rad, raden utan owners räknas inte.
vi.mock("../../supabase.js", () => ({
  supabase: {
    auth: { signOut: vi.fn() },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [
            { id: "r1", metadata: { owners: { me: 50, p1: 50 } } },
            { id: "r2", metadata: { ownershipShare: 50 } },
          ],
        }),
      }),
    }),
  },
}));
vi.mock("../../hooks/useIsMobile.js", () => ({ useIsMobile: () => false }));

import ProfilePage from "../ProfilePage.jsx";

const lotten = { id: "p1", name: "Lotten" };

describe("ProfilePage — Familj", () => {
  beforeEach(() => {
    prefs = {};
    updatePreferences.mockClear();
  });

  it("adds a person by name and saves it in preferences.household", () => {
    render(<ProfilePage onResetProfile={() => {}} />);
    fireEvent.click(screen.getByText("+ Lägg till person"));
    fireEvent.change(screen.getByPlaceholderText("Namn (t.ex. Lotten)"), { target: { value: "Lotten" } });
    fireEvent.click(screen.getByText("Lägg till"));
    expect(updatePreferences).toHaveBeenCalledTimes(1);
    const { household } = updatePreferences.mock.calls[0][0];
    expect(household.members).toHaveLength(1);
    expect(household.members[0].name).toBe("Lotten");
    expect(household.members[0].id).toBeTruthy();
    expect(household.economyType).toBe("gemensam"); // visade defaulten persisteras
  });

  it("saves nothing for an empty name", () => {
    render(<ProfilePage onResetProfile={() => {}} />);
    fireEvent.click(screen.getByText("+ Lägg till person"));
    fireEvent.click(screen.getByText("Lägg till"));
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it("changes the economy type while keeping the members", async () => {
    prefs = { household: { members: [lotten], economyType: "gemensam" } };
    render(<ProfilePage onResetProfile={() => {}} />);
    fireEvent.click(screen.getByText("Enskild"));
    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
    const { household } = updatePreferences.mock.calls[0][0];
    expect(household.economyType).toBe("enskild");
    expect(household.members).toEqual([lotten]);
  });

  it("renames a member inline", async () => {
    prefs = { household: { members: [lotten], economyType: "gemensam" } };
    render(<ProfilePage onResetProfile={() => {}} />);
    // Två "Ändra" finns (visningsnamnet + medlemmen) — medlemmens är den sista
    const buttons = screen.getAllByText("Ändra");
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.change(screen.getByLabelText("Nytt namn för Lotten"), { target: { value: "Lotta" } });
    fireEvent.keyDown(screen.getByLabelText("Nytt namn för Lotten"), { key: "Enter" });
    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
    expect(updatePreferences.mock.calls[0][0].household.members).toEqual([{ id: "p1", name: "Lotta" }]);
  });

  it("warns that ownership stays when removing a member who owns rows, then removes only the member", async () => {
    prefs = { household: { members: [lotten], economyType: "gemensam" } };
    render(<ProfilePage onResetProfile={() => {}} />);
    fireEvent.click(screen.getByTitle("Ta bort Lotten"));
    // varningen räknar raderna där p1 står som ägare (1 st i mocken)
    expect(await screen.findByText(/står som ägare på 1 rad/)).toBeTruthy();
    expect(screen.getByText(/Okänd person/)).toBeTruthy();
    expect(updatePreferences).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Ja, ta bort"));
    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
    expect(updatePreferences.mock.calls[0][0].household.members).toEqual([]);
  });
});
