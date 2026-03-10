export const PORTFOLIO = [
  { ticker: "ERIC-B.ST", name: "Ericsson", sector: "Telecom Equipment", peerMedianMargin: 18.4, peerPE: 22.1, stake: 7.3, upside: 48, status: "Active", flag: "🇸🇪" },
  { ticker: "SKF-B.ST", name: "SKF", sector: "Industrial", peerMedianMargin: 18.9, peerPE: 18.4, stake: 6.2, upside: 31, status: "Active", flag: "🇸🇪" },
  { ticker: "VOLV-B.ST", name: "Volvo", sector: "Trucks & Machinery", peerMedianMargin: 16.2, peerPE: 12.8, stake: 2.1, upside: 22, status: "Monitoring", flag: "🇸🇪" },
  { ticker: "SAND.ST", name: "Sandvik", sector: "Industrial Tools", peerMedianMargin: 21.4, peerPE: 20.1, stake: 1.8, upside: 19, status: "Monitoring", flag: "🇸🇪" },
  { ticker: "UBS", name: "UBS Group", sector: "Investment Banking", peerMedianMargin: 28.7, peerPE: 13.4, stake: 3.1, upside: 37, status: "Active", flag: "🇨🇭" },
  { ticker: "PSON.L", name: "Pearson", sector: "Education", peerMedianMargin: 24.1, peerPE: 24.3, stake: 15.2, upside: 41, status: "Active", flag: "🇬🇧" },
  { ticker: "AKZA.AS", name: "Akzo Nobel", sector: "Specialty Chemicals", peerMedianMargin: 19.3, peerPE: 23.8, stake: 9.8, upside: 52, status: "Active", flag: "🇳🇱" },
];

export const REGIONS = ["Americas", "Europe", "Asia Pacific", "Nordic"];

export const fmt = (v, suffix = "") => (v && v !== 0) ? `${v}${suffix}` : "—";
