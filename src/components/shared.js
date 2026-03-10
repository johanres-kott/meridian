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

export const Chg = ({ value }) => (
  <span style={{ color: value >= 0 ? "#089981" : "#f23645" }}>
    {value >= 0 ? "+" : ""}{value.toFixed(2)}%
  </span>
);

export const MiniBar = ({ value, peer, max }) => {
  if (!value) return <span style={{ color: "#b2b5be", fontSize: 11 }}>—</span>;
  const vPct = Math.min((Math.abs(value) / max) * 100, 100);
  const pPct = Math.min((peer / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 3, background: "#f0f3fa", borderRadius: 2, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vPct}%`, background: value < peer ? "#f23645" : "#089981", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: -2, left: `${pPct}%`, width: 1, height: 7, background: "#b2b5be" }} />
      </div>
      <span style={{ fontSize: 11, color: value < peer ? "#f23645" : "#089981" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

export const Pill = ({ text, green }) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 3,
    background: green ? "#e8f5e9" : "#f5f5f5",
    color: green ? "#089981" : "#787b86", fontWeight: 500
  }}>{text}</span>
);

export const StatCard = ({ label, value, sub, neg }) => (
  <div style={{ background: "#f8f9fd", borderRadius: 4, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 500, color: neg ? "#f23645" : neg === false ? "#089981" : "#131722", fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#b2b5be", marginTop: 4 }}>{sub}</div>}
  </div>
);

export const TH = ({ children, right }) => (
  <th style={{ padding: "8px 10px", textAlign: right ? "right" : "left", fontSize: 11, fontWeight: 500, color: "#787b86", letterSpacing: "0.04em", borderBottom: "1px solid #e0e3eb" }}>
    {children}
  </th>
);

export const TD = ({ children, right, mono, color }) => (
  <td style={{ padding: "9px 10px", textAlign: right ? "right" : "left", fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit", color: color ?? "inherit", borderBottom: "1px solid #f0f3fa" }}>
    {children}
  </td>
);

