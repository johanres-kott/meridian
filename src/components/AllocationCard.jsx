import { useMemo } from "react";
import { analyzeAllocation, BUCKET_META } from "../utils/portfolioAllocation.js";

/**
 * Visual allocation breakdown card showing Core/Satellite/Speculation
 * distribution vs target allocation based on risk profile.
 */
export default function AllocationCard({ items, scores, prices, fxRates, riskProfile = "medium", isMobile }) {
  const analysis = useMemo(
    () => analyzeAllocation(items, scores, prices, fxRates, riskProfile),
    [items, scores, prices, fxRates, riskProfile]
  );

  if (!analysis || analysis.holdings.length === 0) return null;

  const { current, target, gap, grouped, isBalanced } = analysis;
  const bucketKeys = ["core", "satellite", "speculation"];

  return (
    <div style={{
      marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
      background: "var(--bg-card)", border: "1px solid var(--border)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
            Portföljallokering
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
            Core-Satellite-modellen
          </div>
        </div>
        {isBalanced ? (
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(8,153,129,0.1)", color: "#089981", fontWeight: 500 }}>
            ✓ Balanserad
          </span>
        ) : (
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(242,54,69,0.1)", color: "#f23645", fontWeight: 500 }}>
            Obalanserad
          </span>
        )}
      </div>

      {/* Allocation bars: Current vs Target */}
      <div style={{ marginBottom: 14 }}>
        {/* Current */}
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Nu</div>
        <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          {bucketKeys.map(key => {
            const pct = current[key];
            if (pct <= 0) return null;
            const meta = BUCKET_META[key];
            return (
              <div key={key} style={{
                width: `${pct}%`, background: meta.color, display: "flex",
                alignItems: "center", justifyContent: "center", transition: "width 0.3s ease",
              }}>
                {pct >= 12 && (
                  <span style={{ fontSize: 9, color: "#fff", fontWeight: 600 }}>{pct}%</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Target */}
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Mål</div>
        <div style={{ display: "flex", height: 12, borderRadius: 3, overflow: "hidden", opacity: 0.5 }}>
          {bucketKeys.map(key => {
            const pct = target[key];
            if (pct <= 0) return null;
            const meta = BUCKET_META[key];
            return (
              <div key={key} style={{
                width: `${pct}%`, background: meta.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pct >= 15 && (
                  <span style={{ fontSize: 8, color: "#fff", fontWeight: 600 }}>{pct}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bucket details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bucketKeys.map(key => {
          const meta = BUCKET_META[key];
          const pct = current[key];
          const gapVal = gap[key];
          const holdings = grouped[key];

          return (
            <div key={key} style={{
              padding: "8px 10px", borderRadius: 6,
              background: "var(--bg-secondary)", border: "1px solid var(--border-light, var(--border))",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 10, color: gapVal === 0 ? "var(--text-muted)" : Math.abs(gapVal) <= 5 ? "#ff9800" : "#f23645", fontWeight: 500 }}>
                  {gapVal === 0 ? "= mål" : `${gapVal > 0 ? "+" : ""}${gapVal}pp vs mål`}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: holdings.length > 0 ? 4 : 0 }}>
                {meta.desc}
              </div>
              {holdings.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {holdings.map(h => h.name).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
