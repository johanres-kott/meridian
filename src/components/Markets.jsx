import SedanSist from "./SedanSist.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences, userId }) {
  return (
    <div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} userId={userId} />
    </div>
  );
}
