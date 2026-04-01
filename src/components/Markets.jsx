import { Component } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";
import SedanSist from "./SedanSist.jsx";
import PortfolioSummary from "./PortfolioSummary.jsx";
import PortfolioChart from "./PortfolioChart.jsx";
import WeeklySummary from "./WeeklySummary.jsx";
import UpcomingEarnings from "./UpcomingEarnings.jsx";
import TodoList from "./TodoList.jsx";
import InvestmentPlanTracker from "./InvestmentPlanTracker.jsx";

class SafeCard extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences, userId, displayName, onNavigate }) {
  const isMobile = useIsMobile();

  return (
    <div>
      <div style={{ marginBottom: isMobile ? 12 : 20 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
          Hej, {displayName}!
        </h1>
        {preferences.investorProfile && (() => {
          const p = preferences.investorProfile;
          const typeMap = { value: "Värdeinvesterare", growth: "Tillväxtinvesterare", dividend: "Utdelningsinvesterare", index: "Indexinvesterare", mixed: "Blandat" };
          const riskMap = { low: "Låg risk", medium: "Medel risk", high: "Hög risk" };
          const focusMap = { dividends: "Utdelning", appreciation: "Kursökning", both: "Totalavkastning" };
          const parts = [typeMap[p.investorType], riskMap[p.riskProfile], focusMap[p.focus]].filter(Boolean);
          return parts.length > 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{parts.join(" · ")}</div>
          ) : null;
        })()}
      </div>
      {preferences.todos?.length > 0 && (
        <TodoList
          todos={preferences.todos}
          onUpdate={(updated) => onUpdatePreferences({ todos: updated })}
          isMobile={isMobile}
        />
      )}
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} userId={userId} isMobile={isMobile} onNavigate={onNavigate} />
      <SafeCard><InvestmentPlanTracker preferences={preferences} onUpdatePreferences={onUpdatePreferences} isMobile={isMobile} onNavigate={onNavigate} /></SafeCard>
      <PortfolioSummary userId={userId} isMobile={isMobile} onNavigate={onNavigate} />
      {userId && (
        <SafeCard>
          <div style={{ marginBottom: isMobile ? 12 : 20 }}>
            <PortfolioChart userId={userId} compact />
          </div>
        </SafeCard>
      )}
      <WeeklySummary userId={userId} preferences={preferences} isMobile={isMobile} onNavigate={onNavigate} />
      <UpcomingEarnings userId={userId} isMobile={isMobile} />
    </div>
  );
}
