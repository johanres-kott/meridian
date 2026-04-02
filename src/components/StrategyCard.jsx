import Markdown from "./Markdown.jsx";
import { useUser } from "../contexts/UserContext.jsx";

export default function StrategyCard({ isMobile }) {
  const { preferences, updatePreferences } = useUser();

  if (!preferences.investmentPlan?.text) return null;

  const text = preferences.investmentPlan.text;
  // Parse sections: look for **VARFÖR...**, **VAD...**, **HUR...**, **Motivering** (or ## variants)
  const sectionRegex = /(?:^|\n)\s*(?:\*\*|#{1,3}\s*)(Varf[öo]r|Vad|Hur|Motivering)\b[^\n]*\n?/gi;
  const sections = {};
  let matches = [];
  let m;
  while ((m = sectionRegex.exec(text)) !== null) {
    const rawKey = m[1].toLowerCase().replace("ö", "o");
    const key = rawKey === "motivering" ? "motivering" : rawKey;
    matches.push({ key, index: m.index, end: m.index + m[0].length });
  }

  if (matches.length >= 2) {
    for (let i = 0; i < matches.length; i++) {
      const nextStart = i + 1 < matches.length ? matches[i + 1].index : text.length;
      sections[matches[i].key] = text.slice(matches[i].end, nextStart).trim();
    }
    const preamble = text.slice(0, matches[0].index).trim();

    return (
      <div style={{
        marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
        background: "linear-gradient(135deg, var(--accent-light), var(--bg-secondary))",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
            Din investeringsstrategi
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Sparad {new Date(preferences.investmentPlan.savedAt).toLocaleDateString("sv-SE")}
          </div>
        </div>
        {preamble && <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 10 }}><Markdown text={preamble} /></div>}
        {sections.varfor && (
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 12, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Varför</div>
            <Markdown text={sections.varfor} />
          </div>
        )}
        <div style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {sections.vad && (
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Vad</div>
              <Markdown text={sections.vad} />
            </div>
          )}
          {sections.hur && (
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Hur</div>
              <Markdown text={sections.hur} />
            </div>
          )}
        </div>
        {sections.motivering && (
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Motivering</div>
            <Markdown text={sections.motivering} />
          </div>
        )}
        <button
          onClick={() => updatePreferences({ investmentPlan: null })}
          style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Ta bort strategi
        </button>
      </div>
    );
  }

  // Fallback: render as plain text if sections not detected
  return (
    <div style={{
      marginBottom: 16, padding: isMobile ? 14 : 18, borderRadius: 8,
      background: "linear-gradient(135deg, var(--accent-light), var(--bg-secondary))",
      border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
          Din investeringsstrategi
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
          Sparad {new Date(preferences.investmentPlan.savedAt).toLocaleDateString("sv-SE")}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
        <Markdown text={text} />
      </div>
      <button
        onClick={() => updatePreferences({ investmentPlan: null })}
        style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        Ta bort strategi
      </button>
    </div>
  );
}
