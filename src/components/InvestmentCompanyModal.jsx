import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { INVESTMENT_COMPANIES } from "../lib/investmentCompanies.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { useUser } from "../contexts/UserContext.jsx";

const HOLDINGS_API = "/api/holdings";

function formatValue(msek, locale) {
  if (msek >= 1000) {
    const mdkr = msek / 1000;
    return `${mdkr % 1 === 0 ? mdkr.toFixed(0) : mdkr.toFixed(1)} Mdkr`;
  }
  return `${msek.toLocaleString(locale)} Mkr`;
}

export default function InvestmentCompanyModal({ onClose, existingItems, onImport, groups, onSetActiveGroup }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const { updatePreferences } = useUser();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState(INVESTMENT_COMPANIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(HOLDINGS_API)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCompanies(data);
      })
      .catch(err => { console.error("Failed to fetch holdings:", err); }) // Fall back to static data
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
      setError(t("investmentCompanyModal.errorDuplicateGroup", { name: groupName.trim() }));
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
          setError(t("investmentCompanyModal.errorAddCompany", { message: result.error.message }));
          setImporting(false);
          return;
        }
        newIds = (result?.data || []).map(d => d.id);
      }

      const allIds = [...existingIds, ...newIds];
      const updated = [...(groups || []), { name: groupName.trim(), members: allIds }];
      updatePreferences({ groups: updated });
      onSetActiveGroup(groupName.trim());
      onClose();
    } catch (err) {
      setError(err.message || t("investmentCompanyModal.errorGeneric"));
      setImporting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: isMobile ? 16 : 28, width: isMobile ? "95vw" : 620, maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>

        {error && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid #fce4ec", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#c62828", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!selected ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>{t("investmentCompanyModal.title")}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
              {t("investmentCompanyModal.subtitle")}
              {loading && ` ${t("investmentCompanyModal.loadingData")}`}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 6,
                    background: "var(--bg-card)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{company.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {t("investmentCompanyModal.holdingsCount", { count: company.holdings.length })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {t("investmentCompanyModal.updatedAt", { date: company.lastUpdated })}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={btnSecondary}>{t("investmentCompanyModal.cancel")}</button>
            </div>
          </>
        ) : importing ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{t("investmentCompanyModal.creating")}</div>
          </div>
        ) : (() => {
          const hasValues = selected.holdings.some(h => h.valueMSEK != null);
          const totalWeight = selected.holdings.reduce((s, h) => s + (h.weight || 0), 0);
          return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <button
                onClick={() => { setSelected(null); setError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary)", padding: 0 }}
              >
                ←
              </button>
              <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>
                {selected.name}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              {t("investmentCompanyModal.holdingsCount", { count: selected.holdings.length })}
              {totalWeight > 0 ? ` ${t("investmentCompanyModal.weightSuffix", { weight: totalWeight.toFixed(1).replace(".0", "") })}` : ""}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ ...thStyle, textAlign: "left" }}>{t("investmentCompanyModal.colCompany")}</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>{t("investmentCompanyModal.colWeight")}</th>
                  {hasValues && <th style={{ ...thStyle, textAlign: "right" }}>{t("investmentCompanyModal.colValue")}</th>}
                  <th style={{ ...thStyle, textAlign: "left" }}>{t("investmentCompanyModal.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {selected.holdings.map((h, idx) => {
                  const exists = existingTickers.has(h.ticker.toUpperCase());
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ ...tdStyle, color: "var(--text)" }}>
                        <div>{h.name}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-secondary)" }}>{h.ticker}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                        {h.weight != null ? `${h.weight}%` : "–"}
                      </td>
                      {hasValues && (
                        <td style={{ ...tdStyle, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                          {h.valueMSEK != null ? formatValue(h.valueMSEK, numberLocale) : "–"}
                        </td>
                      )}
                      <td style={tdStyle}>
                        {exists ? (
                          <span style={{ color: "#1b5e20", fontSize: 11 }}>{t("investmentCompanyModal.inPortfolio")}</span>
                        ) : (
                          <span style={{ color: "var(--accent)", fontSize: 11 }}>{t("investmentCompanyModal.willBeAdded")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{t("investmentCompanyModal.groupNameLabel")}</label>
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", color: "var(--text)", background: "var(--bg-card)", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnSecondary}>{t("investmentCompanyModal.cancel")}</button>
              <button
                onClick={doCreate}
                disabled={!groupName.trim()}
                style={{ ...btnPrimary, opacity: !groupName.trim() ? 0.5 : 1 }}
              >
                {t("investmentCompanyModal.createButton", { count: selected.holdings.length })}
              </button>
            </div>
          </>
          );
        })()}
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 };
const tdStyle = { padding: "8px 6px" };
const btnSecondary = { padding: "7px 16px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text)" };
const btnPrimary = { padding: "7px 16px", border: "none", borderRadius: 4, background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" };
