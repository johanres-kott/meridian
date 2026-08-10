import { useState } from "react";

// Värdeindikation från Booli-slutpriser via /api/property-valuation.
// Kräver Booli-nycklar på servern; annars visas en instruktion i stället.
// Median × boyta är aritmetik på verkliga slutpriser — märks som uppskattning.

export default function BooliValuation({ onUseEstimate, initialAddress = "", initialSqm = "" }) {
  const [address, setAddress] = useState(initialAddress);
  const [sqm, setSqm] = useState(initialSqm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null); // "not_configured" | "error" | null

  async function lookup() {
    if (address.trim().length < 3 || loading) return;
    setLoading(true);
    setResult(null);
    setStatus(null);
    try {
      const params = new URLSearchParams({ q: address.trim() });
      if (parseFloat(sqm) > 0) params.set("livingArea", String(parseFloat(sqm)));
      const r = await fetch(`/api/property-valuation?${params}`);
      if (r.status === 501) { setStatus("not_configured"); return; }
      if (!r.ok) { setStatus("error"); return; }
      setResult(await r.json());
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)",
    background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-card)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Värdeindikation från området</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
        Ange adress eller område så hämtar vi faktiska slutpriser i närheten (källa: Booli).
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adress eller område (t.ex. Storgatan 1, Uppsala)"
          onKeyDown={e => { if (e.key === "Enter") lookup(); }}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <input value={sqm} onChange={e => setSqm(e.target.value)} placeholder="Boyta m²" inputMode="numeric"
          onKeyDown={e => { if (e.key === "Enter") lookup(); }}
          style={{ ...inputStyle, width: 90 }} />
        <button onClick={lookup} disabled={loading}
          style={{
            fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 16, border: "none",
            background: "var(--accent)", color: "#fff", cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.6 : 1,
          }}>
          {loading ? "Hämtar..." : "Hämta slutpriser"}
        </button>
      </div>

      {status === "not_configured" && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 10 }}>
          Booli-koppling är inte konfigurerad ännu. Lägg <code>BOOLI_CALLER_ID</code> och <code>BOOLI_PRIVATE_KEY</code> i
          .env.local (API-nyckel ansöks hos Booli). Tills dess: slå upp värdet på booli.se/vardera och fyll i manuellt.
        </div>
      )}
      {status === "error" && (
        <div style={{ fontSize: 11, color: "#f23645", marginTop: 10 }}>Kunde inte hämta slutpriser — försök igen.</div>
      )}

      {result && result.count === 0 && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 10 }}>Inga slutpriser hittades för ”{address}”. Prova ett större område.</div>
      )}
      {result && result.count > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Median i området</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                {result.medianPricePerSqm.toLocaleString("sv-SE")} kr/m²
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{result.count} slutpriser · {result.source}</div>
            </div>
            {result.estimate != null && (
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Indikation för {sqm} m²</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  ≈ {result.estimate.toLocaleString("sv-SE")} kr
                </div>
                <button onClick={() => onUseEstimate(result.estimate)}
                  style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 2 }}>
                  Använd som värde →
                </button>
              </div>
            )}
          </div>
          {result.samples?.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--border-light)", paddingTop: 8 }}>
              {result.samples.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-secondary)", padding: "3px 0" }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address || s.area || "—"}</span>
                  {s.livingArea > 0 && <span style={{ flexShrink: 0 }}>{s.livingArea} m²</span>}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, color: "var(--text)" }}>{s.soldPrice.toLocaleString("sv-SE")} kr</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
            Median × boyta är en grov uppskattning från verkliga slutpriser — inte en värdering av just din bostad.
          </div>
        </div>
      )}
    </div>
  );
}
