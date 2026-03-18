// Curated portfolio data for Swedish investment companies.
// Holdings are listed stocks only (unlisted omitted).
// Update periodically — these companies report changes quarterly.

export const INVESTMENT_COMPANIES = [
  {
    id: "investor",
    name: "Investor",
    url: "https://www.investorab.com/our-companies/",
    lastUpdated: "2026-03-17",
    holdings: [
      { name: "ABB", ticker: "ABB.ST" },
      { name: "AstraZeneca", ticker: "AZN.ST" },
      { name: "Atlas Copco", ticker: "ATCO-A.ST" },
      { name: "Electrolux", ticker: "ELUX-B.ST" },
      { name: "Electrolux Professional", ticker: "EPRO-B.ST" },
      { name: "Epiroc", ticker: "EPI-A.ST" },
      { name: "EQT", ticker: "EQT.ST" },
      { name: "Ericsson", ticker: "ERIC-B.ST" },
      { name: "Husqvarna", ticker: "HUSQ-B.ST" },
      { name: "Nasdaq", ticker: "NDAQ" },
      { name: "Saab", ticker: "SAAB-B.ST" },
      { name: "SEB", ticker: "SEB-A.ST" },
      { name: "Sobi", ticker: "SOBI.ST" },
      { name: "Wärtsilä", ticker: "WRT1V.HE" },
    ],
  },
  {
    id: "oresund",
    name: "Öresund",
    url: "https://www.oresund.se",
    lastUpdated: "2026-03-17",
    holdings: [
      { name: "Bahnhof", ticker: "BAHN-B.ST" },
      { name: "Bilia", ticker: "BILI-A.ST" },
      { name: "Ericsson", ticker: "ERIC-B.ST" },
      { name: "Handelsbanken", ticker: "SHB-A.ST" },
      { name: "Ovzon", ticker: "OVZON.ST" },
      { name: "Scandi Standard", ticker: "SCST.ST" },
      { name: "Scandic Hotels", ticker: "SHOT.ST" },
      { name: "SEB", ticker: "SEB-A.ST" },
      { name: "Securitas", ticker: "SECU-B.ST" },
      { name: "Stenhus Fastigheter", ticker: "STENF.ST" },
    ],
  },
  {
    id: "creades",
    name: "Creades",
    url: "https://creades.se/innehav/portfoljen/",
    lastUpdated: "2026-03-17",
    holdings: [
      { name: "Avanza", ticker: "AZA.ST" },
      { name: "Klarna", ticker: "KLAR.ST" },
      { name: "Apotea", ticker: "APOTEA.ST" },
      { name: "Seafire", ticker: "SEAF.ST" },
    ],
  },
];
