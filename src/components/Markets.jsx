import { useIsMobile } from "../hooks/useIsMobile.js";
import SedanSist from "./SedanSist.jsx";
import PortfolioSummary from "./PortfolioSummary.jsx";
import WeeklySummary from "./WeeklySummary.jsx";
import UpcomingEarnings from "./UpcomingEarnings.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences, userId, displayName, onNavigate }) {
  const isMobile = useIsMobile();

  return (
    <div>
      <div style={{ marginBottom: isMobile ? 12 : 20 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, color: "#131722" }}>
          Hej, {displayName}!
        </h1>
      </div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} userId={userId} isMobile={isMobile} onNavigate={onNavigate} />
      <PortfolioSummary userId={userId} isMobile={isMobile} onNavigate={onNavigate} />
      <WeeklySummary userId={userId} preferences={preferences} isMobile={isMobile} onNavigate={onNavigate} />
      <UpcomingEarnings userId={userId} isMobile={isMobile} />
    </div>
  );
}
