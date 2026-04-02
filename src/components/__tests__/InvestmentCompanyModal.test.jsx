import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InvestmentCompanyModal from "../InvestmentCompanyModal.jsx";

// Mock useUser hook
vi.mock("../../contexts/UserContext.jsx", () => ({
  useUser: () => ({
    userId: "test-user",
    preferences: {},
    updatePreferences: vi.fn(),
    lastSeenAt: null,
    displayName: "Test",
    session: { user: { id: "test-user", email: "test@test.com" } },
  }),
}));

const defaultProps = {
  onClose: vi.fn(),
  existingItems: [],
  onImport: vi.fn(),
  groups: [],
  onSetActiveGroup: vi.fn(),
};

describe("InvestmentCompanyModal", () => {
  it("renders without crashing", () => {
    render(<InvestmentCompanyModal {...defaultProps} />);
    expect(screen.getByText("Skapa grupp från investmentbolag")).toBeTruthy();
  });

  it("shows all three investment companies", () => {
    render(<InvestmentCompanyModal {...defaultProps} />);
    expect(screen.getByText("Investor")).toBeTruthy();
    expect(screen.getByText("Öresund")).toBeTruthy();
    expect(screen.getByText("Creades")).toBeTruthy();
  });

  it("shows holdings list when company is clicked", () => {
    render(<InvestmentCompanyModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Öresund"));
    // Should show Öresund holdings
    expect(screen.getByText("Bilia")).toBeTruthy();
    expect(screen.getByText("Scandi Standard")).toBeTruthy();
  });

  it("shows 'Finns i portfölj' for existing items", () => {
    const props = {
      ...defaultProps,
      existingItems: [{ id: 1, ticker: "BILI-A.ST" }],
    };
    render(<InvestmentCompanyModal {...props} />);
    fireEvent.click(screen.getByText("Öresund"));
    expect(screen.getByText("Finns i portfölj")).toBeTruthy();
  });

  it("calls onClose when Avbryt is clicked", () => {
    const onClose = vi.fn();
    render(<InvestmentCompanyModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Avbryt"));
    expect(onClose).toHaveBeenCalled();
  });

  it("pre-fills group name with company name", () => {
    render(<InvestmentCompanyModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Investor"));
    const input = screen.getByDisplayValue("Investor");
    expect(input).toBeTruthy();
  });

  it("appends number if group name already exists", () => {
    const props = {
      ...defaultProps,
      groups: [{ name: "Investor", members: [] }],
    };
    render(<InvestmentCompanyModal {...props} />);
    fireEvent.click(screen.getByText("Investor"));
    const input = screen.getByDisplayValue("Investor 2");
    expect(input).toBeTruthy();
  });
});
