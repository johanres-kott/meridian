import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingModal from "../OnboardingModal.jsx";
import { deriveLegacyProfile } from "../onboarding/steps.js";

describe("deriveLegacyProfile", () => {
  it("maps the new economy profile to legacy fields the app still reads", () => {
    expect(deriveLegacyProfile({ style: "safe", experience: "beginner" })).toMatchObject({ investorType: "index", riskProfile: "low", experience: "beginner" });
    expect(deriveLegacyProfile({ style: "active", experience: "advanced" })).toMatchObject({ investorType: "mixed", riskProfile: "high", experience: "advanced" });
    expect(deriveLegacyProfile({ style: "balanced" })).toMatchObject({ investorType: "index", riskProfile: "medium", experience: "beginner" });
  });
});

describe("OnboardingModal (ekonomiprofil)", () => {
  function runThrough(onComplete) {
    render(<OnboardingModal onComplete={onComplete} />);
    expect(screen.getByText("Välkommen till Thesion")).toBeTruthy();
    fireEvent.click(screen.getByText("Kom igång"));
    // 1 livsskede
    expect(screen.getByText("Var i livet är du?")).toBeTruthy();
    fireEvent.click(screen.getByText("Bygger upp"));
    fireEvent.click(screen.getByText("Nästa →"));
    // 2 situation (multi)
    fireEvent.click(screen.getByText("Äger bostad"));
    fireEvent.click(screen.getByText("Har bolån"));
    fireEvent.click(screen.getByText("Nästa →"));
    // 3 mål (multi)
    fireEvent.click(screen.getByText("Bygga en buffert"));
    fireEvent.click(screen.getByText("Spara till något roligt (resa, bil, båt)"));
    fireEvent.click(screen.getByText("Nästa →"));
    // 4 stil + erfarenhet
    fireEvent.click(screen.getByText("Tryggt och enkelt"));
    fireEvent.click(screen.getByText("Nybörjare"));
    fireEvent.click(screen.getByText("Nästa →"));
  }

  it("offers a skip link on the welcome step and calls onSkip", () => {
    const onSkip = vi.fn();
    render(<OnboardingModal onComplete={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("Hoppa över — gör profilen senare"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("renders without a skip link when onSkip is not provided", () => {
    render(<OnboardingModal onComplete={() => {}} />);
    expect(screen.queryByText("Hoppa över — gör profilen senare")).toBeNull();
  });

  it("asks economy questions, not investor-type questions", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("Kom igång"));
    expect(screen.queryByText(/Vilken typ av investerare/)).toBeNull();
    expect(screen.getByText("Var i livet är du?")).toBeTruthy();
  });

  it("summarises with first steps derived from the answers", () => {
    runThrough(vi.fn());
    expect(screen.getByText("Din ekonomiprofil")).toBeTruthy();
    expect(screen.getByText("Dina första steg")).toBeTruthy();
    // bostad+bolån → lägg in bostaden; buffert-mål → lägg in buffert
    expect(screen.getByText("Lägg in bostaden")).toBeTruthy();
    expect(screen.getByText("Lägg in din buffert")).toBeTruthy();
    expect(screen.getByText(/inte personlig rådgivning/)).toBeTruthy();
  });

  it("completes with both new answers and derived legacy fields", () => {
    const onComplete = vi.fn();
    runThrough(onComplete);
    fireEvent.click(screen.getByText("Starta Thesion"));
    const profile = onComplete.mock.calls[0][0];
    expect(profile).toMatchObject({
      version: 2, lifeStage: "building", style: "safe", experience: "beginner",
      investorType: "index", riskProfile: "low",
    });
    expect(profile.situation).toEqual(expect.arrayContaining(["ownsHome", "hasMortgage"]));
    expect(profile.goals).toEqual(expect.arrayContaining(["buffer", "dream"]));
  });
});
