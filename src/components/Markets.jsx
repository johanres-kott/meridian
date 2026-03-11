import SedanSist from "./SedanSist.jsx";
import PortfolioSummary from "./PortfolioSummary.jsx";
import WeeklySummary from "./WeeklySummary.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences, userId }) {
  return (
    <div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} userId={userId} />
      <PortfolioSummary userId={userId} />
      <WeeklySummary userId={userId} preferences={preferences} />
    </div>
  );
}
