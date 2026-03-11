import SedanSist from "./SedanSist.jsx";
import PortfolioSummary from "./PortfolioSummary.jsx";
import WeeklySummary from "./WeeklySummary.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences, userId, displayName }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "#131722" }}>Hej, {displayName}!</h1>
      </div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} userId={userId} />
      <PortfolioSummary userId={userId} />
      <WeeklySummary userId={userId} preferences={preferences} />
    </div>
  );
}
