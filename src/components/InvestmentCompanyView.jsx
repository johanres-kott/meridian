import { useState, useEffect } from "react";
import { fmt } from "./shared.js";
import { StatCard, PriceChart } from "./SharedComponents.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { PROFILES } from "../lib/investmentCompanyProfiles.js";

function formatValue(msek) {
  if (msek >= 1000) {
    const mdkr = msek / 1000;
    return `${mdkr % 1 === 0 ? mdkr.toFixed(0) : mdkr.toFixed(1)} Mdkr`;
  }
  return `${msek.toLocaleString("sv-SE")} Mkr`;
}

export default function InvestmentCompanyView({ companyName, holdings, onBack, onSelectStock, existingItems }) {
  const isMobile = useIsMobile();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const profile = PROFILES[companyName] || {};
  const ticker = profile.ticker || "";

  useEffect(() => {
    if (!ticker) { setLoading(false); return; }
    fetch(`/api/company?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setCompany(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  const hasValues = holdings?.some(h => h.valueMSEK != null);

  function handleHoldingClick(h) {
    if (!onSelectStock || !existingItems) return;
    const item = existingItems.find(i => i.ticker.toUpperCase() === h.ticker.toUpperCase());
    if (item) onSelectStock(item);
  }

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ fontSize: 12, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}>
          &larr; Tillbaka till portföljen
        </button>

        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#131722" }}>
            {companyName}
            <span style={{ fontSize: 13, color: "#787b86", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{ticker}</span>
          </div>
          <div style={{ fontSize: 13, color: "#787b86", marginTop: 4, maxWidth: 600, lineHeight: 1.5 }}>
            {profile.description}
          </div>
        </div>

        {/* Price row */}
        {company && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace" }}>
              {company.price?.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 13, color: "#787b86" }}>{company.currency}</span>
            {company.marketCap > 0 && <span style={{ fontSize: 12, color: "#787b86" }}>Mkt Cap: {company.marketCap}B {company.currency}</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: "#787b86", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Laddar bolagsdata...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 16 : 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Leadership */}
            <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
              <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 14 }}>Ledning</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                <div style={{ background: "#f8f9fd", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>VD</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#131722" }}>{profile.ceo || "–"}</div>
                </div>
                <div style={{ background: "#f8f9fd", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Styrelseordförande</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#131722" }}>{profile.boardChair || "–"}</div>
                </div>
              </div>
              {profile.founded && (
                <div style={{ fontSize: 11, color: "#787b86", marginTop: 10 }}>Grundat {profile.founded}</div>
              )}
            </div>

            {/* Key metrics */}
            {company && (
              <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
                <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 14 }}>Nyckeltal</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
                  <StatCard label="P/E Forward" value={fmt(company.peForward, "x")} />
                  <StatCard label="P/E Trailing" value={fmt(company.peTrailing, "x")} />
                  <StatCard label="Direktavkastning" value={fmt(company.dividendYield, "%")} />
                  <StatCard label="Tillväxt" value={fmt(company.revenueGrowth, "%")} neg={company.revenueGrowth < 0} />
                </div>
              </div>
            )}

            {/* Chart */}
            {ticker && <PriceChart ticker={ticker} />}

            {/* Analyst targets */}
            {company && (company.targetPrice > 0 || (company.recommendation && company.recommendation !== "—")) && (
              <div style={{ display: "flex", gap: 12 }}>
                {company.targetPrice > 0 && (
                  <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Kursmål</div>
                    <div style={{ fontSize: 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                      {company.targetPrice.toFixed(2)} {company.currency}
                    </div>
                    {company.price > 0 && (
                      <div style={{ fontSize: 11, color: "#787b86", marginTop: 4 }}>
                        Uppsida: <span style={{ color: company.targetPrice > company.price ? "#089981" : "#f23645" }}>
                          {(((company.targetPrice / company.price) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {company.recommendation && company.recommendation !== "—" && (
                  <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#787b86", marginBottom: 6 }}>Rekommendation</div>
                    <div style={{
                      fontSize: 16, fontWeight: 500, textTransform: "uppercase",
                      color: company.recommendation?.includes("buy") ? "#089981" : company.recommendation?.includes("sell") ? "#f23645" : "#131722",
                    }}>
                      {company.recommendation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* News */}
            {company?.news?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 12 }}>Senaste nyheter</div>
                {company.news.map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 0",
                      borderBottom: i < company.news.length - 1 ? "1px solid #f0f3fa" : "none",
                      textDecoration: "none", color: "#131722",
                    }}>
                    <span style={{ fontSize: 12, lineHeight: 1.4 }}>{n.headline}</span>
                    <span style={{ fontSize: 11, color: "#b2b5be", marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0 }}>{n.source}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Holdings */}
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 6, padding: isMobile ? 12 : 20 }}>
            <div style={{ fontSize: 11, color: "#787b86", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 14 }}>
              Innehav ({holdings?.length || 0} bolag)
            </div>

            {holdings?.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
                    <th style={{ ...thStyle, textAlign: "left" }}>Bolag</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Vikt</th>
                    {hasValues && <th style={{ ...thStyle, textAlign: "right" }}>Värde</th>}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, idx) => (
                    <tr key={idx}
                      onClick={() => handleHoldingClick(h)}
                      style={{
                        borderBottom: "1px solid #f0f3fa",
                        cursor: existingItems?.some(i => i.ticker.toUpperCase() === h.ticker.toUpperCase()) ? "pointer" : "default",
                      }}>
                      <td style={{ ...tdStyle, color: "#131722" }}>
                        <div>{h.name}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#787b86" }}>{h.ticker}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {h.weight != null ? `${h.weight}%` : "–"}
                      </td>
                      {hasValues && (
                        <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {h.valueMSEK != null ? formatValue(h.valueMSEK) : "–"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 12, color: "#787b86" }}>Inga innehav tillgängliga.</div>
            )}

            <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 12 }}>
              {profile.url && (
                <a href={profile.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2962ff", textDecoration: "none" }}>
                  {profile.url.replace("https://", "").replace("www.", "")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "#787b86", fontWeight: 500 };
const tdStyle = { padding: "8px 6px" };
