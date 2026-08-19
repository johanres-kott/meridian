import { Component, useState } from "react";
import { useTranslation } from "react-i18next";
import RangeBar from "./RangeBar.jsx";
import { DEFAULT_RANGE } from "../lib/portfolioChartConstants.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { useUser } from "../contexts/UserContext.jsx";
import PortfolioChart from "./PortfolioChart.jsx";
import TodoList from "./TodoList.jsx";
import NetWorthCard from "./NetWorthCard.jsx";
import HomeHero from "./HomeHero.jsx";
import HomeMovers from "./HomeMovers.jsx";
import useNetWorth from "../hooks/useNetWorth.js";

// Hem enligt Finary-IA (DESIGN.md): en ENKEL dashboard som svarar på
// "hur mår min ekonomi?" — nettoförmögenhet, graf, dagens rörelser, posterna.
// Allt aktie-/bevaknings-relaterat bor under Portfölj → Bevakning,
// råd (Din bas, Avgiftskoll) under Investera.

class SafeCard extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

export default function Overview({ onNavigate, onAddAssets }) {
  const { userId, preferences, updatePreferences, displayName } = useUser();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const netWorthData = useNetWorth();
  // Globalt tidsspann (Finary): styr hero-förändringen och grafen samtidigt
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [period, setPeriod] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: isMobile ? 4 : 8, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? 24 : 30, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text)", marginBottom: 2 }}>
          {t("overview.greeting", { name: displayName })}
        </h1>
        {userId && <RangeBar value={range} onChange={setRange} isMobile={isMobile} />}
      </div>
      {preferences.todos?.length > 0 && (
        <TodoList
          todos={preferences.todos}
          onUpdate={(updated) => updatePreferences({ todos: updated })}
          isMobile={isMobile}
        />
      )}
      <SafeCard><HomeHero data={netWorthData} isMobile={isMobile} onNavigate={onNavigate} period={period} /></SafeCard>
      {userId && (
        <SafeCard>
          <div style={{ marginBottom: isMobile ? 12 : 20 }}>
            <PortfolioChart
              compact
              netWorth={netWorthData.portfolioLoaded ? { pensionValue: netWorthData.pensionValue ?? 0, manualRows: netWorthData.manualRows } : null}
              range={range}
              onRangeChange={setRange}
              onPeriodChange={setPeriod}
            />
          </div>
        </SafeCard>
      )}
      <SafeCard><HomeMovers data={netWorthData} isMobile={isMobile} onNavigate={onNavigate} /></SafeCard>
      <SafeCard><NetWorthCard isMobile={isMobile} onNavigate={onNavigate} onAddAssets={onAddAssets} data={netWorthData} showTotal={false} /></SafeCard>
    </div>
  );
}
