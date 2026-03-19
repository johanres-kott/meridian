import { useState, useEffect } from "react";
import { INVESTMENT_COMPANIES } from "../lib/investmentCompanies.js";

const SCRAPER_API = "https://thesion-scraper.vercel.app/api/holdings";

function formatValue(msek) {
  if (msek >= 1000) {
    const mdkr = msek / 1000;
    return `${mdkr % 1 === 0 ? mdkr.toFixed(0) : mdkr.toFixed(1)} Mdkr`;
  }
  return `${msek.toLocaleString("sv-SE")} Mkr`;
}

export default function InvestmentCompanyModal({ onClose, existingItems, onImport, groups, onUpdatePreferences, onSetActiveGroup }) {
  const [selected, setSelected] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState(INVESTMENT_COMPANIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SCRAPER_API)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCompanies(data);
      })
      .catch(() => {}) // Fall back to static data
      .finally(() => setLoading(false));
  }, []);

  const existingTickers = new Set((existingItems || []).map(i => i.ticker.toUpperCase()));
  const groupNames = new Set((groups || []).map(g => g.name));

  function selectCompany(company) {
    setSelected(company);
    let name = company.name;
    if (groupNames.has(name)) {
      let i = 2;
      while (groupNames.has(`${company.name} ${i}`)) i++;
      name = `${company.name} ${i}`;
    }
    setGroupName(name);
  }

  async function doCreate() {
    if (!groupName.trim()) return;
    if (groupNames.has(groupName.trim())) {
      setError(`Gruppen "${groupName.trim()}" finns redan. Välj ett annat namn.`);
      return;
    }
    setError(null);
    setImporting(true);

    try {
      const newHoldings = selected.holdings.filter(h => !existingTickers.has(h.ticker.toUpperCase()));
      const existingIds = selected.holdings
        .filter(h => existingTickers.has(h.ticker.toUpperCase()))
        .map(h => {
          const item = existingItems.find(i => i.ticker.toUpperCase() === h.ticker.toUpperCase());
          return item?.id;
        })
        .filter(Boolean);

      let newIds = [];
      if (newHoldings.length > 0) {
        const result = await onImport(newHoldings.map(h => ({
          ticker: h.ticker, name: h.name, shares: null, gav: null,
        })));
        if (result?.error) {
          setError("Kunde inte lägga till bolag: " + result.error.message);
          setImporting(false);
          return;
        }
        newIds = (result?.data || []).map(d => d.id);
      }

      const allIds = [...existingIds, ...newIds];
      const updated = [...(groups || []), { name: groupName.trim(), members: allIds }];
      onUpdatePreferences({ groups: updated });
      onSetActiveGroup(groupName.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Något gick fel.");
      setImporting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 28, width: 620, maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #fce4ec", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#c62828", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!selected ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#131722", marginBottom: 4 }}>Skapa grupp från investmentbolag</div>
            <div style={{ fontSize: 12, color: "#787b86", marginBottom: 20 }}>
              Välj ett investmentbolag för att skapa en grupp med deras noterade innehav.
              {loading && " Hämtar data..."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", border: "1px solid #e0e3eb", borderRadius: 6,
                    background: "#fff", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#2962ff"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e3eb"}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#131722" }}>{company.name}</div>
                    <div style={{ fontSize: 12, color: "#787b86", marginTop: 2 }}>
                      {company.holdings.length} noterade innehav
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#787b86" }}>
                    Uppdaterad {company.lastUpdated}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={btnSecondary}>Avbryt</button>
            </div>
          </>
        ) : importing ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 13, color: "#131722" }}>Skapar grupp...</div>
          </div>
        ) : (() => {
          const hasValues = selected.holdings.some(h => h.valueMSEK != null);
          const totalWeight = selected.holdings.reduce((s, h) => s + (h.weight || 0), 0);
          return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <button
                onClick={() => { setSelected(null); setError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#787b86", padding: 0 }}
              >
                ←
              </button>
              <div style={{ fontWeight: 600, fontSize: 16, color: "#131722" }}>
                {selected.name}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#787b86", marginBottom: 16 }}>
              {selected.holdings.length} noterade innehav{totalWeight > 0 ? ` — ${totalWeight.toFixed(1).replace(".0", "")}% av totala tillgångar` : ""}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
                  <th style={{ ...thStyle, textAlign: "left" }}>Bolag</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Vikt</th>
                  {hasValues && <th style={{ ...thStyle, textAlign: "right" }}>Värde</th>}
                  <th style={{ ...thStyle, textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {selected.holdings.map((h, idx) => {
                  const exists = existingTickers.has(h.ticker.toUpperCase());
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f0f3fa" }}>
                      <td style={{ ...tdStyle, color: "#131722" }}>
                        <div>{h.name}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#787b86" }}>{h.ticker}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "#131722", fontVariantNumeric: "tabular-nums" }}>
                        {h.weight != null ? `${h.weight}%` : "–"}
                      </td>
                      {hasValues && (
                        <td style={{ ...tdStyle, textAlign: "right", color: "#131722", fontVariantNumeric: "tabular-nums" }}>
                          {h.valueMSEK != null ? formatValue(h.valueMSEK) : "–"}
                        </td>
                      )}
                      <td style={tdStyle}>
                        {exists ? (
                          <span style={{ color: "#1b5e20", fontSize: 11 }}>Finns i portfölj</span>
                        ) : (
                          <span style={{ color: "#2962ff", fontSize: 11 }}>Läggs till</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#787b86", display: "block", marginBottom: 4 }}>Gruppnamn</label>
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e3eb", borderRadius: 4, fontSize: 13, fontFamily: "inherit", color: "#131722", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnSecondary}>Avbryt</button>
              <button
                onClick={doCreate}
                disabled={!groupName.trim()}
                style={{ ...btnPrimary, opacity: !groupName.trim() ? 0.5 : 1 }}
              >
                Skapa grupp med {selected.holdings.length} bolag
              </button>
            </div>
          </>
          );
        })()}
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "#787b86", fontWeight: 500 };
const tdStyle = { padding: "8px 6px" };
const btnSecondary = { padding: "7px 16px", border: "1px solid #e0e3eb", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "#131722" };
const btnPrimary = { padding: "7px 16px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" };
