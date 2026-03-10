import SedanSist from "./SedanSist.jsx";

export default function Markets({ lastSeenAt, preferences, onUpdatePreferences }) {
  return (
    <div>
      <SedanSist lastSeenAt={lastSeenAt} preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
    </div>
  );
}
