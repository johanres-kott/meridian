// Curated portfolio data for Swedish investment companies.
// Holdings are listed stocks only (unlisted omitted).
// Update periodically — these companies report changes quarterly.
// weight = % of total assets, valueMSEK = value of stake in MSEK

export const INVESTMENT_COMPANIES = [
  {
    id: "investor",
    name: "Investor",
    url: "https://www.investorab.com/our-companies/",
    lastUpdated: "2025-12-31",
    holdings: [
      { name: "ABB", ticker: "ABB.ST", weight: 16, valueMSEK: 158000 },
      { name: "Atlas Copco", ticker: "ATCO-A.ST", weight: 13, valueMSEK: 140000 },
      { name: "AstraZeneca", ticker: "AZN.ST", weight: 8, valueMSEK: 75000 },
      { name: "Saab", ticker: "SAAB-B.ST", weight: 8, valueMSEK: 87000 },
      { name: "SEB", ticker: "SEB-A.ST", weight: 8, valueMSEK: 69000 },
      { name: "Nasdaq", ticker: "NDAQ", weight: 5, valueMSEK: 54000 },
      { name: "Epiroc", ticker: "EPI-A.ST", weight: 4, valueMSEK: 43000 },
      { name: "Sobi", ticker: "SOBI.ST", weight: 4, valueMSEK: 43000 },
      { name: "Ericsson", ticker: "ERIC-B.ST", weight: 3, valueMSEK: 33000 },
      { name: "Wärtsilä", ticker: "WRT1V.HE", weight: 3, valueMSEK: 33000 },
      { name: "EQT", ticker: "EQT.ST", weight: 2, valueMSEK: 22000 },
      { name: "Electrolux", ticker: "ELUX-B.ST", weight: 0, valueMSEK: 5000 },
      { name: "Electrolux Professional", ticker: "EPRO-B.ST", weight: 0, valueMSEK: 3000 },
      { name: "Husqvarna", ticker: "HUSQ-B.ST", weight: 0, valueMSEK: 4000 },
    ],
  },
  {
    id: "oresund",
    name: "Öresund",
    url: "https://www.oresund.se",
    lastUpdated: "2025-12-31",
    holdings: [
      { name: "Bilia", ticker: "BILI-A.ST", weight: 25.1, valueMSEK: 1325 },
      { name: "Scandi Standard", ticker: "SCST.ST", weight: 19.0, valueMSEK: 1004 },
      { name: "Ovzon", ticker: "OVZON.ST", weight: 10.9, valueMSEK: 574 },
      { name: "Bahnhof", ticker: "BAHN-B.ST", weight: 7.4, valueMSEK: 390 },
      { name: "Stenhus Fastigheter", ticker: "STENF.ST", weight: 7.1, valueMSEK: 374 },
      { name: "Securitas", ticker: "SECU-B.ST", weight: 5.6, valueMSEK: 294 },
      { name: "Scandic Hotels", ticker: "SHOT.ST", weight: 4.1, valueMSEK: 218 },
      { name: "SEB", ticker: "SEB-A.ST", weight: 3.7, valueMSEK: 196 },
      { name: "Ericsson", ticker: "ERIC-B.ST", weight: 3.4, valueMSEK: 181 },
      { name: "Q-linea", ticker: "QLINEA.ST", weight: 2.6, valueMSEK: 140 },
    ],
  },
  {
    id: "creades",
    name: "Creades",
    url: "https://creades.se/innehav/portfoljen/",
    lastUpdated: "2026-02-28",
    holdings: [
      { name: "Avanza", ticker: "AZA.ST", weight: 50, valueMSEK: 5260 },
      { name: "Apotea", ticker: "APOTEA.ST", weight: 1, valueMSEK: 76 },
      { name: "Seafire", ticker: "SEAF.ST", weight: 1, valueMSEK: 68 },
      { name: "Klarna", ticker: "KLAR", weight: 1, valueMSEK: 64 },
    ],
  },
];
