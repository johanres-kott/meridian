import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const listTransactions = vi.fn();
const addTransaction = vi.fn(async (row) => ({ id: "tx-new", ...row }));
const deleteTransaction = vi.fn(async () => {});

// Panelen använder CRUD-hjälparna — stubba dem men behåll de rena
// beräkningsfunktionerna (computeHolding m.fl.). Supabase-klienten behövs
// aldrig när item har user_id, men stubbas så att importen är ofarlig.
vi.mock("../../supabase.js", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } } }));
vi.mock("../../lib/transactions.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listTransactions: (...a) => listTransactions(...a),
  addTransaction: (...a) => addTransaction(...a),
  deleteTransaction: (...a) => deleteTransaction(...a),
}));

import TransactionsPanel from "../TransactionsPanel.jsx";

const item = { id: "w1", user_id: "u1", ticker: "VOLV-B.ST", name: "Volvo B", shares: null, gav: null };

const tx = (over = {}) => ({
  id: "tx1", user_id: "u1", ticker: "VOLV-B.ST", side: "buy",
  shares: 10, price: 100, fee: 10, trade_date: "2026-01-05", created_at: "2026-01-05T10:00:00Z",
  ...over,
});

describe("TransactionsPanel", () => {
  beforeEach(() => {
    listTransactions.mockReset();
    addTransaction.mockClear();
    deleteTransaction.mockClear();
  });

  it("lägger till ett köp och synkar watchlist med rätt shares/gav", async () => {
    listTransactions.mockResolvedValueOnce([]); // första laddningen
    listTransactions.mockResolvedValueOnce([tx()]); // efter sparat köp
    const onSynced = vi.fn();

    render(<TransactionsPanel item={item} currency="SEK" onSynced={onSynced} />);
    await screen.findByText(/Inga transaktioner ännu/);

    fireEvent.change(screen.getByLabelText("Antal"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/^Pris/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Courtage"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Lägg till"));

    await waitFor(() => expect(addTransaction).toHaveBeenCalledTimes(1));
    expect(addTransaction.mock.calls[0][0]).toMatchObject({
      user_id: "u1", ticker: "VOLV-B.ST", side: "buy", shares: 10, price: 100, fee: 10,
    });
    // GAV enligt genomsnittsmetoden: (10 × 100 + 10) / 10 = 101
    await waitFor(() => expect(onSynced).toHaveBeenCalledWith({ shares: 10, gav: 101 }));
  });

  it("Sälj allt förifyller säljformuläret med hela innehavet", async () => {
    listTransactions.mockResolvedValue([tx({ shares: 8, price: 50, fee: 0 })]);

    render(<TransactionsPanel item={item} currency="SEK" onSynced={() => {}} />);
    const saljAllt = await screen.findByText("Sälj allt");
    fireEvent.click(saljAllt);

    expect(screen.getByLabelText("Antal")).toHaveValue(8);
    expect(screen.getByRole("button", { name: "Sälj", pressed: true })).toBeInTheDocument();
  });

  it("radering räknar om och synkar watchlist", async () => {
    const rows = [
      tx({ id: "a", shares: 10, price: 100, fee: 0 }),
      tx({ id: "b", side: "sell", shares: 5, price: 120, fee: 0, trade_date: "2026-02-01" }),
    ];
    listTransactions.mockResolvedValueOnce(rows);
    listTransactions.mockResolvedValueOnce([rows[0]]); // efter raderat sälj
    const onSynced = vi.fn();

    render(<TransactionsPanel item={item} currency="SEK" onSynced={onSynced} />);
    // Realiserat resultat visas när det inte är 0: 5 × (120 − 100) = 100
    await screen.findByText(/Realiserat resultat: \+100,00 SEK/);

    fireEvent.click(screen.getByLabelText("Radera transaktion 2026-02-01"));
    await waitFor(() => expect(deleteTransaction).toHaveBeenCalledWith("b"));
    await waitFor(() => expect(onSynced).toHaveBeenCalledWith({ shares: 10, gav: 100 }));
  });

  it("visar migrationshinten när tabellen saknas, utan att krascha", async () => {
    listTransactions.mockRejectedValue(
      Object.assign(new Error('relation "public.transactions" does not exist'), { code: "42P01" })
    );

    render(<TransactionsPanel item={item} onSynced={() => {}} />);
    await screen.findByText(/Transaktioner kräver att migrationen 2026-08-20_transactions\.sql körs i Supabase\./);
    expect(screen.queryByText("Lägg till")).not.toBeInTheDocument();
  });
});
