import { useState, useMemo } from "react";

/**
 * Parse a DCA plan from the strategy text into structured monthly steps.
 * Handles formats like:
 *   Månad 1 (nu):\n- Atlas Copco (ATCO-A.ST): 12 000 SEK
 *   Mån 1: Bolag A — 8 000 kr
 */
function parseDCAPlan(text, savedAt) {
  if (!text) return null;

  // Find the HUR section (or fall back to full text)
  const hurMatch = text.match(/(?:\*\*|#{1,3}\s*)Hur\b[^\n]*\n([\s\S]*?)(?=(?:\*\*|#{1,3}\s*)(?:Varf|Vad|Motivering)|\s*$)/i);
  const hurText = hurMatch ? hurMatch[1] : text;

  // Match month headers: "Månad 1", "Mån 1", "Månad 2:", "Month 1 (nu):"
  const monthRegex = /(?:Månad|Mån|Vecka)\s*(\d+)[^\n]*\n([\s\S]*?)(?=(?:Månad|Mån|Vecka)\s*\d|$)/gi;
  const months = [];
  let match;

  while ((match = monthRegex.exec(hurText)) !== null) {
    const monthNum = parseInt(match[1]);
    const content = match[2].trim();

    // Parse individual purchases: "- Bolag (TICKER): 12 000 SEK" or "- Bolag (TICKER) — 12 000 kr"
    const purchaseRegex = /[-•]\s*([^(:]+?)(?:\s*\(([^)]+)\))?\s*[:—–-]\s*([\d\s]+)\s*(?:SEK|kr)/gi;
    const purchases = [];
    let pMatch;

    while ((pMatch = purchaseRegex.exec(content)) !== null) {
      purchases.push({
        name: pMatch[1].trim(),
        ticker: pMatch[2]?.trim() || null,
        amount: parseInt(pMatch[3].replace(/\s/g, "")),
      });
    }

    // If no structured purchases found, store raw content
    if (purchases.length === 0) {
      // Try simpler format: "Bolag A — 8 000 kr, Bolag B — 2 000 kr"
      const simpleRegex = /([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s]+?)(?:\s*\(([^)]+)\))?\s*[:—–-]\s*([\d\s]+)\s*(?:SEK|kr)/gi;
      let sMatch;
      while ((sMatch = simpleRegex.exec(content)) !== null) {
        purchases.push({
          name: sMatch[1].trim(),
          ticker: sMatch[2]?.trim() || null,
          amount: parseInt(sMatch[3].replace(/\s/g, "")),
        });
      }
    }

    if (purchases.length > 0) {
      months.push({
        month: monthNum,
        purchases,
        totalAmount: purchases.reduce((s, p) => s + p.amount, 0),
      });
    }
  }

  if (months.length === 0) return null;

  // Calculate which month we're in based on savedAt
  const startDate = new Date(savedAt);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  const currentMonth = Math.min(monthsElapsed + 1, months.length); // 1-indexed

  return {
    months,
    currentMonth,
    startDate,
    totalMonths: months.length,
    totalAmount: months.reduce((s, m) => s + m.totalAmount, 0),
  };
}

/**
 * Compact investment plan tracker card for the Overview page.
 * Shows current month's actions from a DCA plan.
 */
export default function InvestmentPlanTracker({ preferences, onUpdatePreferences, isMobile, onNavigate }) {
  const plan = preferences?.investmentPlan;
  if (!plan?.text) return null;

  const dcaPlan = useMemo(() => parseDCAPlan(plan.text, plan.savedAt), [plan.text, plan.savedAt]);
  if (!dcaPlan || dcaPlan.months.length <= 1) return null; // Only show for multi-month DCA plans

  const completedSteps = preferences?.planProgress?.completedSteps || [];

  const markStepComplete = (monthNum, purchaseIdx) => {
    const stepKey = `${monthNum}-${purchaseIdx}`;
    const current = preferences?.planProgress?.completedSteps || [];
    const updated = current.includes(stepKey)
      ? current.filter(s => s !== stepKey)
      : [...current, stepKey];
    onUpdatePreferences({
      planProgress: {
        ...preferences?.planProgress,
        completedSteps: updated,
      },
    });
  };

  const isComplete = (monthNum, purchaseIdx) => completedSteps.includes(`${monthNum}-${purchaseIdx}`);

  const allDone = dcaPlan.months.every((m) =>
    m.purchases.every((_, pi) => isComplete(m.month, pi))
  );

  const currentMonthData = dcaPlan.months.find(m => m.month === dcaPlan.currentMonth);
  const currentMonthAllDone = currentMonthData?.purchases.every((_, pi) => isComplete(currentMonthData.month, pi));

  // Progress calculation
  const totalSteps = dcaPlan.months.reduce((s, m) => s + m.purchases.length, 0);
  const doneSteps = completedSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  return (
    <div style={{
      marginBottom: isMobile ? 12 : 20,
      padding: isMobile ? 14 : 18,
      borderRadius: 8,
      background: allDone
        ? "linear-gradient(135deg, rgba(8,153,129,0.08), rgba(8,153,129,0.04))"
        : "linear-gradient(135deg, var(--accent-light), var(--bg-card))",
      border: allDone ? "1px solid rgba(8,153,129,0.3)" : "1px solid var(--border)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{allDone ? "✅" : "📋"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {allDone ? "Plan genomförd!" : "Din investeringsplan"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {dcaPlan.totalAmount.toLocaleString("sv-SE")} SEK över {dcaPlan.totalMonths} månader
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "right" }}>
          <div style={{ fontWeight: 500 }}>{progressPct}%</div>
          <div style={{ fontSize: 10 }}>{doneSteps}/{totalSteps} steg</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${progressPct}%`,
          background: allDone ? "#089981" : "var(--accent)",
          borderRadius: 2,
          transition: "width 0.3s ease",
        }} />
      </div>

      {/* Month timeline */}
      <div style={{ display: "flex", gap: isMobile ? 4 : 6, marginBottom: 14 }}>
        {dcaPlan.months.map((m) => {
          const monthDate = new Date(dcaPlan.startDate);
          monthDate.setMonth(monthDate.getMonth() + m.month - 1);
          const monthAllDone = m.purchases.every((_, pi) => isComplete(m.month, pi));
          const isCurrent = m.month === dcaPlan.currentMonth;
          const isPast = m.month < dcaPlan.currentMonth;

          return (
            <div key={m.month} style={{
              flex: 1,
              textAlign: "center",
              padding: "6px 4px",
              borderRadius: 6,
              background: isCurrent ? "var(--accent-light)" : monthAllDone ? "rgba(8,153,129,0.08)" : "transparent",
              border: isCurrent ? "1px solid var(--accent)" : "1px solid transparent",
            }}>
              <div style={{ fontSize: 10, color: isCurrent ? "var(--accent)" : "var(--text-secondary)", fontWeight: isCurrent ? 600 : 400 }}>
                {monthLabels[monthDate.getMonth()]}
              </div>
              <div style={{ fontSize: 14, marginTop: 2 }}>
                {monthAllDone ? "✅" : isCurrent ? "👉" : isPast ? "⚠️" : "⏳"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                {m.totalAmount.toLocaleString("sv-SE")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current month details */}
      {currentMonthData && !allDone && (
        <div style={{ background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            {currentMonthAllDone ? "✅ Klart för denna månad!" : `Att göra — Månad ${currentMonthData.month}`}
          </div>
          {currentMonthData.purchases.map((p, pi) => {
            const done = isComplete(currentMonthData.month, pi);
            return (
              <div
                key={pi}
                onClick={() => markStepComplete(currentMonthData.month, pi)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: pi < currentMonthData.purchases.length - 1 ? "1px solid var(--border-light)" : "none",
                  cursor: "pointer",
                  opacity: done ? 0.6 : 1,
                  userSelect: "none",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: done ? "none" : "2px solid var(--border)",
                  background: done ? "#089981" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}>
                  {done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                    textDecoration: done ? "line-through" : "none",
                  }}>
                    {p.name} {p.ticker && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({p.ticker})</span>}
                  </div>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: done ? "#089981" : "var(--text)",
                  textDecoration: done ? "line-through" : "none",
                }}>
                  {p.amount.toLocaleString("sv-SE")} kr
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show other months collapsed */}
      {!allDone && dcaPlan.months.filter(m => m.month !== dcaPlan.currentMonth).length > 0 && (
        <ExpandableMonths
          months={dcaPlan.months.filter(m => m.month !== dcaPlan.currentMonth)}
          dcaPlan={dcaPlan}
          isComplete={isComplete}
          markStepComplete={markStepComplete}
          monthLabels={monthLabels}
        />
      )}
    </div>
  );
}

function ExpandableMonths({ months, dcaPlan, isComplete, markStepComplete, monthLabels }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          fontSize: 11, color: "var(--text-secondary)", background: "none",
          border: "none", cursor: "pointer", fontFamily: "inherit",
          padding: "4px 0", display: "flex", alignItems: "center", gap: 4,
        }}
      >
        <span style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
        {expanded ? "Dölj" : "Visa"} övriga månader ({months.length})
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {months.map((m) => {
            const monthDate = new Date(dcaPlan.startDate);
            monthDate.setMonth(monthDate.getMonth() + m.month - 1);
            const monthAllDone = m.purchases.every((_, pi) => isComplete(m.month, pi));
            const isPast = m.month < dcaPlan.currentMonth;

            return (
              <div key={m.month} style={{
                background: "var(--bg-card)", borderRadius: 6,
                border: "1px solid var(--border)", padding: "8px 12px",
                opacity: monthAllDone ? 0.7 : 1,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isPast && !monthAllDone ? "#f23645" : "var(--text-secondary)", marginBottom: 6 }}>
                  {monthAllDone ? "✅" : isPast ? "⚠️" : "⏳"} Månad {m.month} — {monthLabels[monthDate.getMonth()]} {monthDate.getFullYear()}
                </div>
                {m.purchases.map((p, pi) => {
                  const done = isComplete(m.month, pi);
                  return (
                    <div
                      key={pi}
                      onClick={() => markStepComplete(m.month, pi)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "4px 0", cursor: "pointer", userSelect: "none",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 3,
                        border: done ? "none" : "1.5px solid var(--border)",
                        background: done ? "#089981" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text)", textDecoration: done ? "line-through" : "none", flex: 1 }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {p.amount.toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
