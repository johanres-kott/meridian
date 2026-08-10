import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InvestLanding from "../investment/InvestLanding.jsx";

describe("InvestLanding", () => {
  it("shows the three narrative cards in order: base, spice, whole", () => {
    render(<InvestLanding onFunds={vi.fn()} onStocks={vi.fn()} onPension={vi.fn()} />);
    expect(screen.getByText("Basen")).toBeTruthy();
    expect(screen.getByText("Kryddan")).toBeTruthy();
    expect(screen.getByText("Helheten")).toBeTruthy();
    expect(screen.getByText(/inte personlig rådgivning/)).toBeTruthy();
  });

  it("fires the right callback per CTA", () => {
    const onFunds = vi.fn(); const onStocks = vi.fn(); const onPension = vi.fn();
    render(<InvestLanding onFunds={onFunds} onStocks={onStocks} onPension={onPension} />);
    fireEvent.click(screen.getByText("Utforska fonder"));
    fireEvent.click(screen.getByText("Se aktieförslag"));
    fireEvent.click(screen.getByText("Till pensionen"));
    expect(onFunds).toHaveBeenCalledOnce();
    expect(onStocks).toHaveBeenCalledOnce();
    expect(onPension).toHaveBeenCalledOnce();
  });

  it("routes secondary actions via onNavigate", () => {
    const onNavigate = vi.fn();
    render(<InvestLanding onFunds={vi.fn()} onStocks={vi.fn()} onPension={vi.fn()} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Sök bolag"));
    expect(onNavigate).toHaveBeenCalledWith("search");
  });
});
