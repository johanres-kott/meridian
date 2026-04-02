// ─── Data ────────────────────────────────────────────────────────────────────

export const COMPANIES = [
  { id: "investor",       name: "Investor",       ticker: "INVE-B",  exchange: "ST", founded: 1916, url: "investorab.com",          color: "#1a56db" },
  { id: "industrivarden", name: "Industrivärden", ticker: "INDU-C",  exchange: "ST", founded: 1944, url: "industrivarden.se",        color: "#0e7c5b" },
  { id: "oresund",        name: "Öresund",        ticker: "ORES",    exchange: "ST", founded: 1979, url: "oresund.se",               color: "#7c3aed" },
  { id: "latour",         name: "Latour",         ticker: "LATO-B",  exchange: "ST", founded: 1985, url: "latour.se",                color: "#b45309" },
  { id: "lundbergs",      name: "Lundbergs",      ticker: "LUND-B",  exchange: "ST", founded: 1944, url: "lundbergforetagen.se",     color: "#be185d" },
  { id: "svolder",        name: "Svolder",        ticker: "SVOL-B",  exchange: "ST", founded: 1993, url: "svolder.se",               color: "#0f766e" },
  { id: "creades",        name: "Creades",        ticker: "CREAS",   exchange: "ST", founded: 2012, url: "creades.se",               color: "#dc2626" },
];

// ─── Company selector (horizontal tab strip) ─────────────────────────────────

export default function CompanySelector({ selected, onSelect, isMobile }) {
  return (
    <div style={{ display: "flex", gap: isMobile ? 3 : 4, flexWrap: "wrap" }}>
      {COMPANIES.map(c => {
        const active = c.id === selected;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 4 : 7,
              padding: isMobile ? "5px 8px" : "6px 12px", borderRadius: 6,
              border: active ? `1.5px solid ${c.color}40` : "1.5px solid transparent",
              background: active ? c.color + "0f" : "transparent",
              cursor: "pointer", fontFamily: "inherit",
              fontSize: isMobile ? 11 : 12.5, fontWeight: active ? 600 : 400,
              color: active ? c.color : "var(--text-secondary)",
              transition: "all 0.12s",
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: active ? c.color : "#d1d4dc",
              transition: "background 0.12s",
            }} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
