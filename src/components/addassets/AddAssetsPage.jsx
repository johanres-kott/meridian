import { useState } from "react";
import { createManualAsset } from "../../lib/manualAssets.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import BostadWizard from "./BostadWizard.jsx";
import FordonWizard from "./FordonWizard.jsx";

// Helsides "Komplettera din portfölj" — Finary-inspirerad Add Assets-katalog
// (se PIVOT.md) i Thesions färger. Sök + kategorikort; manuella tillgångar
// sparas i manual_assets, investeringskategorier navigerar in i appen.
// Värden fylls i manuellt — vi hämtar aldrig och hittar aldrig på värderingar.
// För bostad länkar vi till Booli/hitta.se så användaren kan slå upp värdet själv.

const CATEGORIES = [
  { id: "stocks", icon: "📈", title: "Aktier", desc: "Bolag du tror på — med produktsida och hälsosignalen ”Går bolaget bra?”" },
  { id: "funds", icon: "💠", title: "Fonder", desc: "Globala indexfonder och toppfonder med avgifter och betyg från Morningstar" },
  { id: "bostad", icon: "🏠", title: "Bostad", desc: "Lägenhet, hus eller fritidshus — slå upp värdet på Booli eller hitta.se" },
  { id: "fordon", icon: "🚗", title: "Fordon", desc: "Bil, MC, husbil eller båt" },
  { id: "sparkonto", icon: "🏦", title: "Sparkonto & buffert", desc: "Kontanter, sparkonton och din buffert" },
  { id: "lan", icon: "📄", title: "Bolån & skulder", desc: "Lån dras av från din nettoförmögenhet" },
  { id: "pension", icon: "🪺", title: "Pension (ITP)", desc: "Din tjänstepension — följ värdet och jämför fondval" },
  { id: "ovrigt", icon: "📦", title: "Övrigt", desc: "Konst, klockor eller andra tillgångar värda att räkna med" },
];

// Manuella formulär per kategori. kinds = valbara typer (måste matcha manual_assets-constrainten).
const MANUAL_FORMS = {
  sparkonto: {
    title: "Lägg till sparkonto",
    kinds: [
      { value: "sparkonto", label: "Sparkonto" },
      { value: "buffert", label: "Buffert" },
    ],
    namePlaceholder: "Namn (t.ex. Sparkonto SBAB)",
    hint: "Saldo i kronor.",
  },
  lan: {
    title: "Lägg till lån",
    kinds: [
      { value: "bolan", label: "Bolån" },
      { value: "skuld", label: "Övrig skuld" },
    ],
    namePlaceholder: "Namn (t.ex. Bolån Handelsbanken)",
    hint: "Kvarvarande skuld i kronor. Dras av från nettoförmögenheten.",
  },
  ovrigt: {
    title: "Lägg till övrig tillgång",
    kinds: [{ value: "ovrigt", label: "Övrig tillgång" }],
    namePlaceholder: "Namn (t.ex. Klocksamling)",
    hint: "Uppskattat värde i kronor.",
  },
};

function ManualForm({ formId, onSaved, onBack }) {
  const isMobile = useIsMobile();
  const form = MANUAL_FORMS[formId];
  const [kind, setKind] = useState(form.kinds[0].value);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    const parsed = parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
    if (!label.trim() || !(parsed >= 0) || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createManualAsset({
        kind,
        label: label.trim(),
        value_sek: parsed,
        is_debt: kind === "bolan" || kind === "skuld",
      });
      onSaved();
    } catch (err) {
      console.error("AddAssetsPage: insert failed:", err);
      setError(err.message || true);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", fontSize: 14, padding: "10px 0", border: "none",
    borderBottom: "1px solid var(--border)", background: "none",
    color: "var(--text)", fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <button onClick={onBack}
        style={{ fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
        ‹ Tillbaka
      </button>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>{form.title}</h1>

      {form.kinds.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {form.kinds.map(k => (
            <button key={k.value} onClick={() => setKind(k.value)}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
                border: `1px solid ${kind === k.value ? "var(--accent)" : "var(--border)"}`,
                background: kind === k.value ? "var(--accent-light)" : "var(--bg-card)",
                color: kind === k.value ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: kind === k.value ? 600 : 400,
              }}>
              {k.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder={form.namePlaceholder} style={inputStyle} autoFocus />
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Värde i kr" inputMode="numeric" style={inputStyle} />
      </div>

      {(form.hint || form.lookups) && (
        <div style={{ marginTop: 20, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-card)" }}>
          {form.hint && (
            <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              <span style={{ flexShrink: 0 }}>ⓘ</span>
              <span>{form.hint}</span>
            </div>
          )}
          {form.lookups && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: form.hint ? 8 : 0, paddingLeft: 20 }}>
              {form.lookups.map(l => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={save} disabled={saving}
        style={{
          marginTop: 24, fontSize: 14, fontWeight: 600, padding: "10px 28px", borderRadius: 20,
          border: "none", background: "var(--accent)", color: "#fff",
          cursor: saving ? "wait" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1,
        }}>
        {saving ? "Sparar..." : "Spara"}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: "#f23645", marginTop: 10 }}>
          Kunde inte spara{typeof error === "string" ? `: ${error}` : ""} — försök igen.
        </div>
      )}
    </div>
  );
}

export default function AddAssetsPage({ onClose, onNavigate }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [view, setView] = useState(null); // null = katalog, annars kategori-id

  function openCategory(id) {
    if (id === "stocks") {
      onNavigate("investment", { subTab: "toppforslag", suggestMode: "stock" });
      onClose();
    } else if (id === "funds") {
      onNavigate("investment", { subTab: "toppforslag", suggestMode: "fund", fundCategory: "aktie_global", fundType: "index" });
      onClose();
    } else if (id === "pension") {
      onNavigate("investment", { subTab: "pension" });
      onClose();
    } else {
      setView(id);
    }
  }

  function handleSaved() {
    onNavigate("markets");
    onClose();
  }

  const q = query.trim().toLowerCase();
  const filtered = CATEGORIES.filter(c => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, overflow: "auto",
      background: "var(--bg)", color: "var(--text)",
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Stängknapp */}
      <button onClick={onClose} title="Stäng"
        style={{
          position: "fixed", top: 16, right: isMobile ? 16 : 32, zIndex: 310,
          width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)",
          background: "var(--bg-card)", color: "var(--text-secondary)",
          fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>
        ✕
      </button>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: isMobile ? "56px 16px 40px" : "72px 32px 60px" }}>
        {view === "bostad" ? (
          <BostadWizard onSaved={handleSaved} onBack={() => setView(null)} />
        ) : view === "fordon" ? (
          <FordonWizard onSaved={handleSaved} onBack={() => setView(null)} />
        ) : view ? (
          <ManualForm formId={view} onSaved={handleSaved} onBack={() => setView(null)} />
        ) : (
          <>
            <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
              Komplettera din portfölj
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 28 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 15 }}>⌕</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Bostad, fonder, sparkonto..."
                autoFocus
                style={{ flex: 1, fontSize: 14, border: "none", background: "none", color: "var(--text)", fontFamily: "inherit", outline: "none" }}
              />
            </div>

            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Alla kategorier</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {filtered.map(cat => (
                <button key={cat.id} onClick={() => openCategory(cat.id)}
                  style={{
                    position: "relative", overflow: "hidden", textAlign: "left",
                    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                    padding: "18px 110px 18px 20px", cursor: "pointer", fontFamily: "inherit", minHeight: 96,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{cat.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{cat.desc}</div>
                  <span aria-hidden style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 52, opacity: 0.22, pointerEvents: "none",
                  }}>
                    {cat.icon}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)", padding: 20 }}>Inget matchade ”{query}”</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
