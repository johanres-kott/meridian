import { useFetch, Skeleton } from "./primitives.jsx";

export default function HoldingsTable({ companyId }) {
  const { data, loading } = useFetch("/api/holdings");

  const companyHoldings = data?.find(c => c.id === companyId);
  const holdings = companyHoldings?.holdings ?? [];

  if (loading) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 80px", gap: 8, padding: "8px 0", borderBottom: i < 5 ? "1px solid var(--border-light)" : "none" }}>
            <Skeleton w="70%" h={12} />
            <Skeleton w="60%" h={12} />
            <Skeleton w="50%" h={12} />
            <Skeleton w="60%" h={12} />
          </div>
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "16px 0" }}>Inga innehav hittade</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Bolag", "Ticker", "Vikt (%)", "Värde (Mkr)"].map(h => (
              <th key={h} style={{
                textAlign: h === "Bolag" || h === "Ticker" ? "left" : "right",
                padding: "8px 6px", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: "var(--text-secondary)", whiteSpace: "nowrap",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={i} style={{ borderBottom: i < holdings.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <td style={{ padding: "8px 6px", color: "var(--text)", fontWeight: 500 }}>{h.name}</td>
              <td style={{ padding: "8px 6px", color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{h.ticker || "—"}</td>
              <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                {h.weight != null ? h.weight.toFixed(1) : "—"}
              </td>
              <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                {h.valueMSEK != null ? h.valueMSEK.toLocaleString("sv-SE") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
