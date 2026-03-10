import { useState, useRef } from "react";
import { parseAvanzaPdf } from "../lib/parsePdf.js";
import { resolveAllTickers } from "../lib/resolveTickersAvanza.js";

const PHASES = { upload: "upload", parsing: "parsing", resolving: "resolving", preview: "preview", importing: "importing" };

export default function PdfImportModal({ onClose, onImport, existingTickers }) {
  const [phase, setPhase] = useState(PHASES.upload);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");
  const [rows, setRows] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Välj en PDF-fil.");
      return;
    }
    setError(null);
    setPhase(PHASES.parsing);

    try {
      const buffer = await file.arrayBuffer();
      const holdings = await parseAvanzaPdf(buffer);

      if (holdings.length === 0) {
        setError("Hittade inga innehav i PDF:en. Kontrollera att det är rätt fil.");
        setPhase(PHASES.upload);
        return;
      }

      setPhase(PHASES.resolving);
      const resolved = await resolveAllTickers(holdings, (current, total) => {
        setProgress(`Söker ticker ${current} av ${total}...`);
      });

      const existingSet = new Set((existingTickers || []).map((t) => t.toUpperCase()));
      const withStatus = resolved.map((r) => ({
        ...r,
        selected: r.matched && !existingSet.has(r.ticker.toUpperCase()),
        duplicate: existingSet.has(r.ticker.toUpperCase()),
      }));

      setRows(withStatus);
      setPhase(PHASES.preview);
    } catch (err) {
      setError(err.message || "Kunde inte tolka PDF:en.");
      setPhase(PHASES.upload);
    }
  }

  function updateRow(idx, field, value) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function doImport() {
    const selected = rows.filter((r) => r.selected && r.ticker);
    if (selected.length === 0) return;

    setPhase(PHASES.importing);
    const result = await onImport(
      selected.map((r) => ({
        ticker: r.ticker,
        name: r.resolvedName || r.name,
        shares: r.shares,
        gav: r.gav,
      }))
    );

    if (result?.error) {
      setError("Import misslyckades: " + result.error.message);
      setPhase(PHASES.preview);
    } else {
      onClose();
    }
  }

  const selectedCount = rows.filter((r) => r.selected && r.ticker).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 28, width: 620, maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: "#131722", marginBottom: 20 }}>Importera portfölj från PDF</div>

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #fce4ec", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#c62828", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Upload phase */}
        {phase === PHASES.upload && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#2962ff" : "#e0e3eb"}`,
              borderRadius: 8,
              padding: "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "#f0f4ff" : "#fafbfd",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>PDF</div>
            <div style={{ fontSize: 13, color: "#131722", marginBottom: 6 }}>Dra och släpp en PDF från Avanza</div>
            <div style={{ fontSize: 12, color: "#787b86" }}>eller klicka för att välja fil</div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Parsing / resolving phase */}
        {(phase === PHASES.parsing || phase === PHASES.resolving) && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 13, color: "#131722", marginBottom: 8 }}>
              {phase === PHASES.parsing ? "Läser PDF..." : progress}
            </div>
            <div style={{ fontSize: 12, color: "#787b86" }}>Vänta medan filen bearbetas</div>
          </div>
        )}

        {/* Preview phase */}
        {phase === PHASES.preview && (
          <>
            <div style={{ fontSize: 12, color: "#787b86", marginBottom: 12 }}>
              {rows.length} innehav hittade. Granska och justera innan import.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e3eb" }}>
                    <th style={thStyle}></th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Värdepapper</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Ticker</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Antal</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>GAV</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f0f3fa" }}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => updateRow(idx, "selected", e.target.checked)}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: "#131722", maxWidth: 180 }}>
                        {row.name}
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.ticker}
                          onChange={(e) => updateRow(idx, "ticker", e.target.value)}
                          style={{
                            width: 110,
                            padding: "3px 6px",
                            border: `1px solid ${row.matched ? "#e0e3eb" : "#f23645"}`,
                            borderRadius: 3,
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: "#131722",
                          }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <input
                          type="number"
                          value={row.shares ?? ""}
                          onChange={(e) => updateRow(idx, "shares", parseFloat(e.target.value) || null)}
                          style={{ width: 70, padding: "3px 6px", border: "1px solid #e0e3eb", borderRadius: 3, fontSize: 11, textAlign: "right", fontFamily: "inherit" }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <input
                          type="number"
                          value={row.gav ?? ""}
                          onChange={(e) => updateRow(idx, "gav", parseFloat(e.target.value) || null)}
                          style={{ width: 80, padding: "3px 6px", border: "1px solid #e0e3eb", borderRadius: 3, fontSize: 11, textAlign: "right", fontFamily: "inherit" }}
                        />
                      </td>
                      <td style={tdStyle}>
                        {row.duplicate ? (
                          <span style={{ color: "#e65100", fontSize: 11 }}>Finns redan</span>
                        ) : row.matched ? (
                          <span style={{ color: "#1b5e20", fontSize: 11 }}>Ny</span>
                        ) : (
                          <span style={{ color: "#c62828", fontSize: 11 }}>Ej matchad</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={btnSecondary}>Avbryt</button>
              <button onClick={doImport} disabled={selectedCount === 0} style={{ ...btnPrimary, opacity: selectedCount === 0 ? 0.5 : 1 }}>
                Importera {selectedCount} bolag
              </button>
            </div>
          </>
        )}

        {/* Importing phase */}
        {phase === PHASES.importing && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 13, color: "#131722" }}>Importerar...</div>
          </div>
        )}

        {/* Close button for upload phase */}
        {phase === PHASES.upload && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={onClose} style={btnSecondary}>Avbryt</button>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 6px", fontSize: 11, color: "#787b86", fontWeight: 500 };
const tdStyle = { padding: "8px 6px" };
const btnSecondary = { padding: "7px 16px", border: "1px solid #e0e3eb", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "#131722" };
const btnPrimary = { padding: "7px 16px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" };
