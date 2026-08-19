import { Component } from "react";
import { useTranslation } from "react-i18next";
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

  return (
    <div>
      <div style={{ marginBottom: isMobile ? 12 : 20 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
          {t("overview.greeting", { name: displayName })}
        </h1>
      </div>
      {preferences.todos?.length > 0 && (
        <TodoList
          todos={preferences.todos}
          onUpdate={(updated) => updatePreferences({ todos: updated })}
          isMobile={isMobile}
        />
      )}
      <SafeCard><HomeHero data={netWorthData} isMobile={isMobile} onNavigate={onNavigate} /></SafeCard>
      {userId && (
        <SafeCard>
          <div style={{ marginBottom: isMobile ? 12 : 20 }}>
            <PortfolioChart compact offsetSek={netWorthData.portfolioLoaded ? (netWorthData.pensionValue ?? 0) + netWorthData.assetSum - netWorthData.debtSum : 0} />
          </div>
        </SafeCard>
      )}
      <SafeCard><HomeMovers data={netWorthData} isMobile={isMobile} onNavigate={onNavigate} /></SafeCard>
      <SafeCard><NetWorthCard isMobile={isMobile} onNavigate={onNavigate} onAddAssets={onAddAssets} data={netWorthData} showTotal={false} /></SafeCard>
    </div>
  );
}
