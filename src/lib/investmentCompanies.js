// Curated portfolio data for Swedish investment companies.
// Holdings are listed stocks only (unlisted omitted).
// Update periodically — these companies report changes quarterly.
// weight = % of total assets, valueMSEK = value in MSEK

export const INVESTMENT_COMPANIES = [
  {
    id: "investor",
    name: "Investor",
    url: "https://www.investorab.com/our-companies/",
    lastUpdated: "2026-03-17",
    holdings: [
      { name: "ABB", ticker: "ABB.ST", weight: 16, valueMSEK: null },
      { name: "Atlas Copco", ticker: "ATCO-A.ST", weight: 13, valueMSEK: null },
      { name: "AstraZeneca", ticker: "AZN.ST", weight: 8, valueMSEK: null },
      { name: "Saab", ticker: "SAAB-B.ST", weight: 8, valueMSEK: null },
      { name: "SEB", ticker: "SEB-A.ST", weight: 8, valueMSEK: null },
      { name: "Nasdaq", ticker: "NDAQ", weight: 5, valueMSEK: null },
      { name: "Epiroc", ticker: "EPI-A.ST", weight: 4, valueMSEK: null },
      { name: "Sobi", ticker: "SOBI.ST", weight: 4, valueMSEK: null },
      { name: "Ericsson", ticker: "ERIC-B.ST", weight: 3, valueMSEK: null },
      { name: "Wärtsilä", ticker: "WRT1V.HE", weight: 3, valueMSEK: null },
      { name: "EQT", ticker: "EQT.ST", weight: 2, valueMSEK: null },
      { name: "Electrolux", ticker: "ELUX-B.ST", weight: 0, valueMSEK: null },
      { name: "Electrolux Professional", ticker: "EPRO-B.ST", weight: 0, valueMSEK: null },
      { name: "Husqvarna", ticker: "HUSQ-B.ST", weight: 0, valueMSEK: null },
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
    lastUpdated: "2025-09-30",
    holdings: [
      { name: "Avanza", ticker: "AZA.ST", weight: 35, valueMSEK: null },
      { name: "Klarna", ticker: "KLAR.ST", weight: 15, valueMSEK: null },
      { name: "Apotea", ticker: "APOTEA.ST", weight: 10, valueMSEK: null },
      { name: "Seafire", ticker: "SEAF.ST", weight: 5, valueMSEK: null },
    ],
  },
];
