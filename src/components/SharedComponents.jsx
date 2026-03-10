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
