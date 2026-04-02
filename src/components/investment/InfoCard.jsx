import { Badge } from "./primitives.jsx";

export default function InfoCard({ company, leadershipData }) {
  const rows = [
    { label: "Ticker",    value: `${company.ticker}.${company.exchange}` },
    { label: "Grundat",   value: company.founded },
    { label: "Hemsida",   value: company.url, href: `https://www.${company.url}` },
  ];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>
          Bolagsinfo
        </div>
        {rows.map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.label}</span>
            {r.href
              ? <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {r.value}
                </a>
              : <span style={{ fontSize: 11, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>
                  {r.value}
                </span>
            }
          </div>
        ))}
      </div>

      {/* Data freshness */}
      {leadershipData && (
        <div style={{ padding: "10px 16px", background: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Ledarskapsdata</span>
            <Badge
              text={leadershipData.source === "live" ? "● Live" : "Cached"}
              color={leadershipData.source === "live" ? "#089981" : "#b2b5be"}
              bg={leadershipData.source === "live" ? "#e8f5f1" : "#f5f5f5"}
            />
          </div>
          {leadershipData.fetchedAt && (
            <div style={{ fontSize: 10, color: "#c0c3cb", marginTop: 4 }}>
              {new Date(leadershipData.fetchedAt).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
