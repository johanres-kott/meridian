import { describe, it, expect } from "vitest";
import {
  parseBankStatement,
  parseSwedishNumber,
  parseStatementDate,
  detectBank,
  decodeStatementBuffer,
} from "../parseBankStatement.js";

// Nordea-formatet är grundat i riktiga exporter (samma rubrikrad och taltyp
// som Nordeas CSV-export av personkonto): semikolon, "1 234,56", Reserverad.
const NORDEA_CSV = `Bokföringsdag;Belopp;Avsändare;Mottagare;Rubrik;Saldo;Valuta
2025-03-25;52 000,00;;;LÖN TECHFÖRETAGET AB;80 395,00;SEK
2025-03-25;-15 000,00;;;ÖVERFÖRING SPARKONTO;65 395,00;SEK
2025-03-03;-1 847,00;;;ICA MAXI NACKA;38 883,00;SEK
2025-03-01;-8 500,00;;;SBAB BOLÅNERÄNTA;45 230,00;SEK
2025-02-25;51 000,00;;;LÖN TECHFÖRETAGET AB;53 730,00;SEK
2025-02-14;-1 200,00;;;VATTENFALL;2 730,00;SEK`;

const NORDEA_WITH_RESERVED = `Bokföringsdag;Belopp;Avsändare;Mottagare;Rubrik;Saldo;Valuta
Reserverad;-450,00;;;ICA KVANTUM;;SEK
2025-03-25;52 000,00;;;LÖN;80 395,00;SEK`;

const SEB_CSV = `Bokföringsdatum,Valutadatum,Verifikationsnummer,Text/mottagare,Belopp,Saldo
2025-03-24,2025-03-24,5501234567,LÖN,"45 000,00","61 200,00"
2025-03-20,2025-03-20,5501234566,COOP KONSUM,"-890,50","16 200,00"`;

describe("parseSwedishNumber", () => {
  it("läser svensk taltyp med mellanslag och decimalkomma", () => {
    expect(parseSwedishNumber("1 234,56")).toBe(1234.56);
    expect(parseSwedishNumber("-8 500,00")).toBe(-8500);
    expect(parseSwedishNumber("1 234,56")).toBe(1234.56);
    expect(parseSwedishNumber("52000")).toBe(52000);
  });
  it("ger null för tomt och skräp", () => {
    expect(parseSwedishNumber("")).toBeNull();
    expect(parseSwedishNumber("abc")).toBeNull();
    expect(parseSwedishNumber(null)).toBeNull();
  });
});

describe("parseStatementDate", () => {
  it("normaliserar vanliga datumformat", () => {
    expect(parseStatementDate("2025-03-01")).toBe("2025-03-01");
    expect(parseStatementDate("2025/03/01")).toBe("2025-03-01");
    expect(parseStatementDate("01/03/2025")).toBe("2025-03-01");
    expect(parseStatementDate("20250301")).toBe("2025-03-01");
  });
  it("ger null för Reserverad och skräp", () => {
    expect(parseStatementDate("Reserverad")).toBeNull();
    expect(parseStatementDate("")).toBeNull();
  });
});

describe("detectBank", () => {
  it("känner igen Nordea och SEB på rubrikraden", () => {
    expect(detectBank(["Bokföringsdag", "Belopp", "Saldo"])).toBe("nordea");
    expect(detectBank(["Bokföringsdatum", "Valutadatum", "Text/mottagare", "Belopp"])).toBe("seb");
    expect(detectBank(["Date", "Amount"])).toBe("okand");
  });
});

describe("parseBankStatement — Nordea", () => {
  it("läser transaktioner, saldo och period", () => {
    const r = parseBankStatement(NORDEA_CSV);
    expect(r.errors).toEqual([]);
    expect(r.bank).toBe("nordea");
    expect(r.transactions).toHaveLength(6);
    expect(r.period).toEqual({ from: "2025-02-14", to: "2025-03-25" });
    // Nyaste raden ligger först i Nordeas export — dess löpande saldo gäller.
    expect(r.latestBalance).toEqual({ value: 80395, date: "2025-03-25" });
  });

  it("summerar per månad, nyaste först", () => {
    const r = parseBankStatement(NORDEA_CSV);
    expect(r.monthly.map(m => m.month)).toEqual(["2025-03", "2025-02"]);
    const mars = r.monthly[0];
    expect(mars.inSek).toBe(52000);
    expect(mars.outSek).toBe(8500 + 1847 + 15000);
    expect(mars.netSek).toBe(52000 - 25347);
    // Perioden slutar 25/3 — mars är inte komplett.
    expect(mars.partial).toBe(true);
  });

  it("hoppar över reserverade rader med varning", () => {
    const r = parseBankStatement(NORDEA_WITH_RESERVED);
    expect(r.transactions).toHaveLength(1);
    expect(r.skippedPending).toBe(1);
    expect(r.warnings.some(w => w.includes("hoppades över"))).toBe(true);
    expect(r.latestBalance).toEqual({ value: 80395, date: "2025-03-25" });
  });
});

describe("parseBankStatement — SEB", () => {
  it("läser kommaseparerad fil med citerade svenska tal", () => {
    const r = parseBankStatement(SEB_CSV);
    expect(r.errors).toEqual([]);
    expect(r.bank).toBe("seb");
    expect(r.transactions).toHaveLength(2);
    expect(r.transactions[0].amount).toBe(45000);
    expect(r.latestBalance).toEqual({ value: 61200, date: "2025-03-24" });
  });
});

describe("parseBankStatement — generiskt och fel", () => {
  it("hittar rubrikraden även när kontouppgifter ligger överst", () => {
    const csv = `Konto;Personkonto 1234 56 78901\nPeriod;2025-03-01 till 2025-03-31\n\nDatum;Belopp;Text;Saldo\n2025-03-05;-100,00;KAFFE;900,00\n2025-03-01;1 000,00;INSÄTTNING;1 000,00`;
    const r = parseBankStatement(csv);
    expect(r.errors).toEqual([]);
    expect(r.transactions).toHaveLength(2);
    expect(r.latestBalance).toEqual({ value: 900, date: "2025-03-05" });
  });

  it("stigande sortering: saldot tas från sista raden", () => {
    const csv = `Datum;Belopp;Text;Saldo\n2025-03-01;1 000,00;INSÄTTNING;1 000,00\n2025-03-05;-100,00;KAFFE;900,00\n2025-03-05;-50,00;BULLE;850,00`;
    const r = parseBankStatement(csv);
    expect(r.latestBalance).toEqual({ value: 850, date: "2025-03-05" });
  });

  it("fil utan igenkännbara rubriker ger ärligt fel", () => {
    const r = parseBankStatement("hej\nhopp\n123");
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.transactions).toEqual([]);
  });

  it("tom fil ger fel utan att kasta", () => {
    expect(parseBankStatement("").errors.length).toBeGreaterThan(0);
    expect(parseBankStatement(null).errors.length).toBeGreaterThan(0);
  });

  it("rader i annan valuta hoppas över med varning", () => {
    const csv = `Bokföringsdag;Belopp;Rubrik;Saldo;Valuta\n2025-03-05;-100,00;HOTELL;900,00;EUR\n2025-03-01;1 000,00;INSÄTTNING;1 000,00;SEK`;
    const r = parseBankStatement(csv);
    expect(r.transactions).toHaveLength(1);
    expect(r.warnings.some(w => w.includes("valuta"))).toBe(true);
  });
});

describe("decodeStatementBuffer", () => {
  it("läser UTF-8", () => {
    const buf = new TextEncoder().encode("Bokföringsdag;Belopp\n2025-03-01;100,00");
    expect(decodeStatementBuffer(buf)).toContain("Bokföringsdag");
  });
  it("faller tillbaka på Latin-1 för å/ä/ö", () => {
    // "Bokföringsdag" i ISO-8859-1: ö = 0xF6 (ogiltig ensam byte i UTF-8)
    const bytes = Uint8Array.from("Bokf\xf6ringsdag".split("").map(c => c.charCodeAt(0)));
    expect(decodeStatementBuffer(bytes)).toBe("Bokföringsdag");
  });
});
