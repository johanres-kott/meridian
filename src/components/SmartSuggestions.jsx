import { useState, useEffect } from "react";
import { Chg } from "./SharedComponents.jsx";

const PROFILE_LABELS = {
  value: "Värdeinvesterare",
  growth: "Tillväxtinvesterare",
  dividend: "Utdelningsinvesterare",
  mixed: "Blandat",
  index: "Indexinvesterare",
};

function ScoreBadge({ score }) {
  const color = score >= 70 ? "#089981" : score >= 40 ? "#e65100" : "#f23645";
  const bg = score >= 70 ? "#e8f5e9" : score >= 40 ? "#fff8e1" : "#fce4ec";
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 6px",
      borderRadius: 3, background: bg, color, fontVariantNumeric: "tabular-nums",
    }}>
      {Math.round(score)}
    </span>
  );
}

export default function SmartSuggestions({ profile, existingTickers, isMobile, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const investorType = profile?.investorType || "mixed";
  const riskProfile = profile?.riskProfile;

  useEffect(() => {
    const exclude = (existingTickers || []).join(",");
    const params = new URLSearchParams({ profile: investorType, limit: "8" });
    if (riskProfile) params.set("risk", riskProfile);
    if (exclude) params.set("exclude", exclude);

    fetch(`/api/suggestions?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [investorType, riskProfile, existingTickers]);

  if (!loading && (!data?.suggestions || data.suggestions.length === 0)) return null;

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ marginBottom: 24, background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid #f0f3fa",
        background: "#f8f9fd", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#131722" }}>Toppförslag för dig</span>
          <span style={{ fontSize: 11, color: "#787b86", marginLeft: 8 }}>
            {PROFILE_LABELS[investorType] || investorType}
          </span>
        </div>
        <button
          onClick={() => onNavigate?.("methodology")}
          style={{ fontSize: 10, color: "#2962ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Hur fungerar poängsättningen? →
        </button>
      </div>

      <div style={{ padding: isMobile ? "12px 12px" : "16px 20px" }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "#787b86" }}>Beräknar förslag...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            {data.suggestions.map(item => (
              <div
                key={item.ticker}
                onClick={() => onNavigate?.("search", { ticker: item.ticker })}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 6, border: "1px solid #f0f3fa",
                  cursor: "pointer", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#2962ff"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f3fa"}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#131722" }}>{item.name}</span>
                    <ScoreBadge score={item.compositeScore} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: "#787b86", ...mono }}>{item.ticker}</span>
                    {item.highlights?.slice(0, 2).map(tag => (
                      <span key={tag} style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, background: "#e8f5e9", color: "#089981", fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {item.price != null && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#131722", ...mono }}>
                        {item.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.scoredAt && (
          <div style={{ fontSize: 10, color: "#b2b5be", marginTop: 10 }}>
            Poäng beräknade: {new Date(data.scoredAt).toLocaleDateString("sv-SE")}
          </div>
        )}
      </div>
    </div>
  );
}
