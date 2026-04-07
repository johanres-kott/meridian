import { useState } from "react";
import { fmt } from "../shared.js";
import { StatCard, PriceChart } from "../SharedComponents.jsx";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useUser } from "../../contexts/UserContext.jsx";
import { matchStock, getRisk, riskLabel, betaDescription, isInvestmentCompany } from "../../lib/profileMatcher.js";
import { PROFILE_LABELS } from "../../constants.js";
import { ScoreBar } from "../company/ProfileInsight.jsx";

export default function SearchResultDetail({ result, scoreData, added, onAddToPortfolio }) {
  const { preferences } = useUser();
  const isMobile = useIsMobile();
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [expandedScore, setExpandedScore] = useState(null);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 4, padding: isMobile ? 12 : 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {result.sector}{result.industry !== "—" ? ` · ${result.industry}` : ""}
          </div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>
            {result.name}
            <span style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 10 }}>{result.ticker}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 300, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {result.price?.toFixed(2)}
            <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 8 }}>{result.currency}</span>
            {result.marketCap > 0 && <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 16 }}>Mkt Cap: {result.marketCap}B {result.currency}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {added ? (
            <span style={{ fontSize: 12, color: "#089981", fontWeight: 500 }}>✓ I din portfölj</span>
          ) : (
            <button onClick={onAddToPortfolio}
              style={{ padding: "7px 16px", background: "#2962ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500 }}>
              + Lägg till i portfölj
            </button>
          )}
          {result.week52High > 0 && (
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)" }}>
              <span>52v: <span style={{ color: "#f23645" }}>{result.week52Low?.toFixed(0)}</span> – <span style={{ color: "#089981" }}>{result.week52High.toFixed(0)}</span> {result.currency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {(() => {
        const exp = showAllMetrics ? "advanced" : preferences.investorProfile?.experience;
        const allMetrics = [
          { key: "peForward", label: "P/E Forward", value: fmt(result.peForward, "x"), neg: false, tip: "Aktiekurs delat med förväntad vinst per aktie kommande 12 mån. Lägre = billigare.", level: "beginner" },
          { key: "peTrailing", label: "P/E Trailing", value: fmt(result.peTrailing, "x"), neg: false, tip: "Aktiekurs delat med vinst per aktie senaste 12 mån. Lägre = billigare.", level: "intermediate" },
          { key: "ebitdaMargin", label: "EBITDA-marginal", value: fmt(result.ebitdaMargin, "%"), neg: result.ebitdaMargin < 0, tip: "Vinst före räntor, skatt och avskrivningar som andel av omsättningen.", level: "advanced" },
          { key: "operatingMargin", label: "Rör.marginal", value: fmt(result.operatingMargin, "%"), neg: result.operatingMargin < 0, tip: "Rörelseresultat delat med omsättning. Visar hur mycket som blir vinst.", level: "advanced" },
          { key: "grossMargin", label: "Bruttomarginal", value: fmt(result.grossMargin, "%"), neg: false, tip: "Omsättning minus varukostnad, delat med omsättning. Högre = bättre.", level: "advanced" },
          { key: "roic", label: "ROIC / ROE", value: fmt(result.roic, "%"), neg: result.roic < 0, tip: "Avkastning på investerat kapital. Visar hur effektivt bolaget använder sina pengar.", level: "beginner" },
          { key: "debtEbitda", label: "Nettoskuld/EBITDA", value: fmt(result.debtEbitda, "x"), neg: result.debtEbitda > 3, tip: "Nettoskuld delat med EBITDA. Över 3x anses högt belånat.", level: "intermediate" },
          { key: "revenueGrowth", label: "Tillväxt", value: fmt(result.revenueGrowth, "%"), neg: result.revenueGrowth < 0, tip: "Omsättningstillväxt jämfört med föregående år (YoY).", level: "beginner" },
          { key: "dividendYield", label: "Direktavkastning", value: fmt(result.dividendYield, "%"), neg: false, tip: "Årlig utdelning delat med aktiekursen. Högre = mer tillbaka varje år.", level: "beginner" },
        ];
        const levels = { beginner: 1, intermediate: 2, advanced: 3 };
        const userLevel = levels[exp] || 3;
        const visible = allMetrics.filter(m => levels[m.level] <= userLevel);
        const isFiltered = !showAllMetrics && userLevel < 3;
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Nyckeltal</div>
              {isFiltered && (
                <button onClick={() => setShowAllMetrics(true)}
                  style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Visa alla →
                </button>
              )}
              {showAllMetrics && preferences.investorProfile?.experience !== "advanced" && (
                <button onClick={() => setShowAllMetrics(false)}
                  style={{ fontSize: 10, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Visa färre
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
              {visible.map(m => (
                <StatCard key={m.key} label={m.label} value={m.value} neg={m.neg} tooltip={m.tip} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Profile insight + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {preferences.investorProfile && (() => {
          const profile = preferences.investorProfile;
          const companyData = { beta: result.beta, dividendYield: result.dividendYield, revenueGrowth: result.revenueGrowth, marketCap: result.marketCap };
          const { score } = matchStock(result.ticker, profile, companyData);
          const risk = getRisk(result.beta, result.marketCap, result.ticker);
          const items = [];
          if (risk) {
            const rc = risk === "low" ? "#089981" : risk === "medium" ? "#ff9800" : "#f23645";
            items.push({ icon: "◉", color: rc, text: isInvestmentCompany(result.ticker) ? `${riskLabel(risk)} — diversifierat investmentbolag` : result.beta != null ? betaDescription(result.beta) : `${riskLabel(risk)} (baserat på börsvärde)` });
          }
          if (result.dividendYield > 0) items.push({ icon: "💰", color: "#089981", text: `Direktavkastning ${result.dividendYield.toFixed(1)}%` });
          else items.push({ icon: "–", color: "var(--text-secondary)", text: "Ingen utdelning" });
          return (
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 10 }}>Din profil & detta bolag</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: it.color, fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{it.icon}</span>
                    <span style={{ color: "var(--text)" }}>{it.text}</span>
                  </div>
                ))}
              </div>
              {scoreData?.scores && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>Vår analys</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <ScoreBar label="Piotroski" value={scoreData.scores.piotroski?.normalized} scoreKey="piotroski" scoreData={scoreData.scores} expanded={expandedScore === "piotroski"} onToggle={() => setExpandedScore(expandedScore === "piotroski" ? null : "piotroski")} />
                    <ScoreBar label="Magic Formula" value={scoreData.scores.magicFormula} scoreKey="magicFormula" scoreData={scoreData.scores} expanded={expandedScore === "magicFormula"} onToggle={() => setExpandedScore(expandedScore === "magicFormula" ? null : "magicFormula")} />
                    <ScoreBar label="Tillväxt" value={scoreData.scores.growth} scoreKey="growth" scoreData={scoreData.scores} expanded={expandedScore === "growth"} onToggle={() => setExpandedScore(expandedScore === "growth" ? null : "growth")} />
                    <ScoreBar label="Utdelning" value={scoreData.scores.dividend} scoreKey="dividend" scoreData={scoreData.scores} expanded={expandedScore === "dividend"} onToggle={() => setExpandedScore(expandedScore === "dividend" ? null : "dividend")} />
                    <ScoreBar label="Kvalitet" value={scoreData.scores.quality} scoreKey="quality" scoreData={scoreData.scores} expanded={expandedScore === "quality"} onToggle={() => setExpandedScore(expandedScore === "quality" ? null : "quality")} />
                  </div>
                  {scoreData.composite && (() => {
                    const profileType = profile?.investorType || "mixed";
                    const compositeScore = scoreData.composite[profileType] ?? scoreData.composite.mixed;
                    if (compositeScore == null) return null;
                    const color = compositeScore >= 70 ? "#089981" : compositeScore >= 40 ? "#ff9800" : "#f23645";
                    return (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(compositeScore)}</span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>/ 100 — totalpoäng för {PROFILE_LABELS[profileType] || profileType}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
              {(() => {
                const profileType = profile?.investorType || "mixed";
                const cs = scoreData?.composite?.[profileType] ?? scoreData?.composite?.mixed ?? score;
                const matchColor = cs >= 70 ? "#089981" : cs >= 40 ? "#e65100" : "#c62828";
                const matchBg = cs >= 70 ? "rgba(8,153,129,0.12)" : cs >= 40 ? "rgba(255,152,0,0.12)" : "rgba(200,40,40,0.12)";
                const matchText = cs >= 70 ? "Stark matchning" : cs >= 40 ? "Delvis matchning" : "Svag matchning";
                return (
                  <div style={{ marginTop: 10, padding: "8px 10px", background: matchBg, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: matchColor }}>{matchText}</div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
        <PriceChart ticker={result.ticker} />
      </div>

      {/* Analyst */}
      {(result.targetPrice > 0 || result.recommendation !== "—") && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {result.targetPrice > 0 && (
            <div style={{ flex: 1, minWidth: 160, border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Kursmål (snitt)</div>
              <div style={{ fontSize: 18, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#089981" }}>
                {result.targetPrice.toFixed(2)} {result.currency}
              </div>
              {result.targetLow > 0 && result.targetHigh > 0 && (
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                  Spann: {result.targetLow.toFixed(0)} – {result.targetHigh.toFixed(0)} {result.currency}
                </div>
              )}
              {result.price > 0 && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                  Uppsida: <span style={{ color: result.targetPrice > result.price ? "#089981" : "#f23645" }}>
                    {(((result.targetPrice / result.price) - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {result.numberOfAnalysts > 0 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                  {result.numberOfAnalysts} analytiker · Yahoo Finance
                </div>
              )}
            </div>
          )}
          {result.recommendation !== "—" && (
            <div style={{ flex: 1, minWidth: 160, border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Rekommendation</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: result.recommendation?.includes("buy") ? "#089981" : result.recommendation?.includes("sell") ? "#f23645" : "var(--text)", textTransform: "uppercase" }}>
                {result.recommendation}
              </div>
              {result.numberOfAnalysts > 0 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                  {result.numberOfAnalysts} analytiker · Yahoo Finance consensus
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Datakällor</div>
            <div style={{ fontSize: 12, color: "var(--text)" }}>{result.sources?.fundamentals}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Nyheter: {result.sources?.news}</div>
          </div>
        </div>
      )}

      {/* News */}
      {result.news?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Senaste nyheter</div>
          {result.news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", textDecoration: "none", color: "var(--text)" }}>
              <span style={{ fontSize: 12 }}>{n.headline}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 16, whiteSpace: "nowrap" }}>{n.source}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
