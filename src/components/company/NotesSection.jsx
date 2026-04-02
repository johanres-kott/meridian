import { useState } from "react";
import { sanitizeInput } from "../../lib/sanitize.js";

export default function NotesSection({ item, onUpdate }) {
  const [notes, setNotes] = useState(item.notes || "");
  const [editing, setEditing] = useState(false);
  const [showGAV, setShowGAV] = useState(false);
  const [shares, setShares] = useState(item.shares || "");
  const [gav, setGav] = useState(item.gav || "");

  async function saveNotes() {
    await onUpdate(item.id, { notes: sanitizeInput(notes) });
    setEditing(false);
  }

  async function saveGAV() {
    await onUpdate(item.id, { shares: parseFloat(shares) || null, gav: parseFloat(gav) || null });
    setShowGAV(false);
  }

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
      {/* GAV */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Egna kop</div>
          <button onClick={() => setShowGAV(!showGAV)}
            style={{ fontSize: 11, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 3, background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit" }}>
            {showGAV ? "Avbryt" : "Redigera"}
          </button>
        </div>

        {showGAV ? (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>ANTAL AKTIER</label>
                <input type="number" value={shares} onChange={e => setShares(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>GAV (SNITTPRIS)</label>
                <input type="number" value={gav} onChange={e => setGav(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }} />
              </div>
            </div>
            <button onClick={saveGAV}
              style={{ fontSize: 11, padding: "6px 14px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              Spara
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Antal</div>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{item.shares || "\u2014"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>GAV</div>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{item.gav ? item.gav.toLocaleString("sv-SE", { minimumFractionDigits: 2 }) : "\u2014"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Anteckningar</div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ fontSize: 11, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 3, background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit" }}>
              Redigera
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} autoFocus
              style={{ width: "100%", minHeight: 120, padding: "10px 12px", border: "1px solid var(--accent)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={saveNotes}
                style={{ fontSize: 11, padding: "6px 14px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer" }}>
                Spara
              </button>
              <button onClick={() => { setNotes(item.notes || ""); setEditing(false); }}
                style={{ fontSize: 11, padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer" }}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: notes ? "var(--text)" : "var(--text-muted)", whiteSpace: "pre-wrap", minHeight: 40 }}>
            {notes || "Inga anteckningar annu. Klicka Redigera for att lagga till investeringstes, analys, etc."}
          </div>
        )}
      </div>
    </div>
  );
}
