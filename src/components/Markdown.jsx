/**
 * Shared lightweight Markdown renderer.
 * Supports: headers (#/##/###), bold (**text**), lists (- / 1.), horizontal rules (---).
 * Used by Portfolio (strategy card) and ChatPanel (AI messages).
 *
 * Accepts an optional `compact` prop for tighter spacing (chat messages).
 */

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (!boldMatch) { parts.push(remaining); break; }
    const idx = boldMatch.index;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
    remaining = remaining.slice(idx + boldMatch[0].length);
  }
  return parts;
}

export default function Markdown({ text, compact = false }) {
  if (!text) return null;
  const lines = text.split("\n");
  const gap = compact ? 6 : 8;
  const listPad = compact ? 4 : 8;
  const emptyH = compact ? 4 : 6;

  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return <div key={i} style={{ fontWeight: 600, fontSize: 12, marginTop: i > 0 ? gap : 0, marginBottom: 2 }}>{renderInline(line.slice(4))}</div>;
        if (line.startsWith("## "))
          return <div key={i} style={{ fontWeight: 600, fontSize: 13, marginTop: i > 0 ? gap + 2 : 0, marginBottom: 2 }}>{renderInline(line.slice(3))}</div>;
        if (line.startsWith("# "))
          return <div key={i} style={{ fontWeight: 700, fontSize: 14, marginTop: i > 0 ? gap + 2 : 0, marginBottom: 4 }}>{renderInline(line.slice(2))}</div>;
        if (/^---+$/.test(line.trim()))
          return <hr key={i} style={{ border: "none", borderTop: "1px solid var(--border, #e0e3eb)", margin: `${gap}px 0` }} />;
        if (/^\d+\.\s/.test(line))
          return <div key={i} style={{ paddingLeft: listPad, marginTop: 2 }}>{renderInline(line)}</div>;
        if (line.startsWith("- "))
          return <div key={i} style={{ paddingLeft: listPad, marginTop: 2 }}>{renderInline(line)}</div>;
        if (!line.trim())
          return <div key={i} style={{ height: emptyH }} />;
        return <div key={i} style={{ marginTop: 1 }}>{renderInline(line)}</div>;
      })}
    </>
  );
}
