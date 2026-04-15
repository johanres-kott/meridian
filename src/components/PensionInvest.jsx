import { useState, useEffect } from "react";
import { searchFunds } from "../lib/apiClient.js";
import { useUser } from "../contexts/UserContext.jsx";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 };

// ─── PPM fund suggestions (real funds available on Pensionsmyndighetens fondtorg) ───

const PPM_SUGGESTIONS = [
  { name: "AP7 Aktiefond", fee: 0.05, type: "index", note: "Statens defaultval. Mycket låg avgift, global aktieexponering med hävstång." },
  { name: "AP7 Räntefond", fee: 0.05, type: "index", note: "Statens räntefond. Låg risk, obligationer." },
  { name: "Avanza Zero", fee: 0.00, type: "index", note: "OMX Stockholm 30-index. Nollavgift." },
  { name: "Länsförsäkringar Global Indexnära", fee: 0.22, type: "index", note: "Brett globalt index. Låg avgift." },
  { name: "SPP Aktiefond Global", fee: 0.14, type: "index", note: "Global indexfond via SPP." },
  { name: "Swedbank Robur Access Global", fee: 0.20, type: "index", note: "Bred global exponering." },
];

const ITP_PROVIDERS = [
  { name: "Avanza Pension", fondforsakring: true, trad: false, note: "Brett fondutbud, låga avgifter" },
  { name: "Nordnet Pension", fondforsakring: true, trad: false, note: "Brett fondutbud, nollavgift på utvalda indexfonder" },
  { name: "SEB", fondforsakring: true, trad: true, note: "Traditionell försäkring + fondförsäkring" },
  { name: "Länsförsäkringar", fondforsakring: true, trad: true, note: "Bred närvaro, bra indexfonder" },
  { name: "Alecta", fondforsakring: false, trad: true, note: "Default ITP-val, traditionell försäkring" },
  { name: "AMF", fondforsakring: true, trad: true, note: "Kooperativt ägd, låga avgifter" },
];

// ─── Age-based model portfolios ───

const MODEL_PORTFOLIOS = [
  {
    label: "Ung (25–40 år)",
    icon: "🚀",
    color: "#089981",
    allocation: "90–100% aktier",
    suggestion: "AP7 Såfa eller 100% global indexfond",
    detail: "Lång horisont — maximera tillväxt. Nedgångar hinner återhämta sig.",
  },
  {
    label: "Mitt i karriären (40–55)",
    icon: "⚖️",
    color: "#5b9bd5",
    allocation: "60–80% aktier, 20–40% räntor",
    suggestion: "Blanda globalfond + räntefond",
    detail: "Börja trappa ner risk. Behåll tillväxtfokus men skydda en del.",
  },
  {
    label: "Nära pension (55–65)",
    icon: "🛡️",
    color: "#ff9800",
    allocation: "40–60% aktier, 40–60% räntor",
    suggestion: "Trad.försäkring eller balanserad mix",
    detail: "Prioritera kapitalskydd. Kortare tid att återhämta sig från nedgångar.",
  },
  {
    label: "Pensionär (65+)",
    icon: "🏖️",
    color: "#9c27b0",
    allocation: "20–40% aktier, 60–80% räntor",
    suggestion: "Räntefonder + lite aktiefond",
    detail: "Fokus på stabilitet och löpande utbetalning.",
  },
];

function PensionPillarCard({ icon, title, pct, children, color }) {
  return (
    <div style={{
      background: `rgba(${color},0.04)`, border: `1px solid rgba(${color},0.15)`,
      borderRadius: 8, padding: 20, marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</div>
          <div style={{ fontSize: 11, color: `rgb(${color})`, fontWeight: 600, ...mono }}>{pct}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function FundTable({ funds }) {
  const thStyle = { fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Fond</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Avgift</th>
            <th style={thStyle}>Typ</th>
            <th style={thStyle}>Kommentar</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)" }}>{f.name}</td>
              <td style={{ ...tdStyle, textAlign: "right", ...mono, color: f.fee <= 0.1 ? "#089981" : f.fee <= 0.3 ? "#5b9bd5" : "var(--text-secondary)" }}>
                {f.fee.toFixed(2)}%
              </td>
              <td style={tdStyle}>
                <span style={{
                  fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 500,
                  background: f.type === "index" ? "rgba(33,150,243,0.12)" : "rgba(156,39,176,0.10)",
                  color: f.type === "index" ? "#1976d2" : "#7b1fa2",
                }}>
                  {f.type === "index" ? "Index" : "Aktiv"}
                </span>
              </td>
              <td style={{ ...tdStyle, fontSize: 11, maxWidth: 200 }}>{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderTable({ providers }) {
  const thStyle = { fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const dot = (ok) => <span style={{ color: ok ? "#089981" : "var(--text-muted)" }}>{ok ? "✓" : "—"}</span>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Försäkringsbolag</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Fondförsäkring</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Traditionell</th>
            <th style={thStyle}>Kommentar</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)" }}>{p.name}</td>
              <td style={{ ...tdStyle, textAlign: "center" }}>{dot(p.fondforsakring)}</td>
              <td style={{ ...tdStyle, textAlign: "center" }}>{dot(p.trad)}</td>
              <td style={{ ...tdStyle, fontSize: 11 }}>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PensionInvest({ isMobile }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "ppm" | "itp"
  const { preferences, updatePreferences } = useUser();
  const pension = preferences.pension || {};

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[
          { id: "overview", label: "Överblick" },
          { id: "ppm", label: "Premiepension" },
          { id: "itp", label: "Tjänstepension (ITP)" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 11, padding: "5px 14px", borderRadius: 4,
              border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit",
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: activeTab === tab.id ? "var(--accent)" : "var(--bg-card)",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab isMobile={isMobile} />}
      {activeTab === "ppm" && <PPMTab isMobile={isMobile} />}
      {activeTab === "itp" && <ITPTab isMobile={isMobile} pension={pension} updatePreferences={updatePreferences} />}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ isMobile }) {
  return (
    <>
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Pensionens tre delar
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
          Din framtida pension byggs upp av tre delar. Genom att göra aktiva val i premiepensionen och
          tjänstepensionen kan du påverka hur stor din pension blir.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PensionPillarCard icon="🏛️" title="Allmän pension" pct="~55% av pensionen" color="8,153,129">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Inkomstpension (16%) + premiepension (2.5%). Du kan välja fonder för premiepensionsdelen
              via Pensionsmyndigheten.
            </p>
          </PensionPillarCard>

          <PensionPillarCard icon="🏢" title="Tjänstepension" pct="~30% av pensionen" color="91,155,213">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Arbetsgivaren betalar in. ITP1 (premiebestämd) eller ITP2 (förmånsbestämd).
              Du väljer ofta hur pengarna placeras via Collectum.
            </p>
          </PensionPillarCard>

          <PensionPillarCard icon="🏦" title="Privat sparande" pct="~15% av pensionen" color="156,39,176">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              ISK, kapitalförsäkring, aktier, fonder. Det du sparar själv utöver pensionen.
              Behövs för att behålla levnadsstandarden.
            </p>
          </PensionPillarCard>
        </div>
      </div>

      {/* Age-based portfolios */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          Modellportföljer efter ålder
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
          Pensionssparande handlar om tidshorisonten. Ju längre tid kvar, desto mer risk kan du ta.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {MODEL_PORTFOLIOS.map(mp => (
            <div key={mp.label} style={{
              background: "var(--bg-secondary)", borderRadius: 6, padding: 16,
              borderLeft: `3px solid ${mp.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{mp.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{mp.label}</div>
              </div>
              <div style={{ fontSize: 12, color: mp.color, fontWeight: 500, marginBottom: 4, ...mono }}>{mp.allocation}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{mp.detail}</div>
              <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>→ {mp.suggestion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div style={{
        ...cardStyle,
        background: "rgba(8,153,129,0.04)", border: "1px solid rgba(8,153,129,0.15)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          💡 Det viktigaste att komma ihåg
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>Allmän pension + tjänstepension ger ofta bara 50–60% av slutlönen</li>
          <li>Avgiften är den enskilt viktigaste faktorn — 0.2% vs 1.5% kan skilja miljoner</li>
          <li>AP7 Såfa slår de flesta aktiva fonder på lång sikt</li>
          <li>Gör ditt ITP-val — defaultvalet (Alecta trad) är sällan optimalt för unga</li>
        </ul>
      </div>
    </>
  );
}

// ─── Premiepension ───────────────────────────────────────────────────────────

function PPMTab({ isMobile }) {
  return (
    <>
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          Premiepensionen
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>
          2.5% av din pensionsgrundande inkomst går till premiepensionen. Du väljer själv
          bland fonderna på Pensionsmyndighetens fondtorg.
        </p>

        <div style={{
          background: "rgba(91,155,213,0.06)", border: "1px solid rgba(91,155,213,0.15)",
          borderRadius: 6, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            📊 AP7 Såfa — statens defaultval
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: "4px 0 0 0" }}>
            Om du inte gör ett aktivt val placeras allt i AP7 Såfa — en generationsfond med 0.05% avgift
            som automatiskt minskar aktieandelen från 55 års ålder. Historisk avkastning: ca 10–12% per år
            sedan start. Svårslagen av de flesta aktiva fonder.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Rekommenderade PPM-fonder
        </div>
        <FundTable funds={PPM_SUGGESTIONS} />
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
          Fonderna ovan finns på Pensionsmyndighetens fondtorg. Avgifterna kan ha ändrats.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Så byter du PPM-fonder
        </div>
        <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>Logga in på <strong>pensionsmyndigheten.se</strong> eller <strong>minpension.se</strong> med BankID</li>
          <li>Gå till "Premiepension" → "Byt fond"</li>
          <li>Sök efter fonder — prioritera låg avgift och brett index</li>
          <li>Bekräfta bytet — genomförs inom 2–3 bankdagar</li>
        </ol>
      </div>

      <div style={{
        ...cardStyle,
        background: "rgba(255,152,0,0.04)", border: "1px solid rgba(255,152,0,0.15)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          ⚠️ Vanliga misstag
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>Välja fonder med avgift över 1% — äter din pension</li>
          <li>Byta fonder ofta — tajming fungerar sällan, kostar i form av utanför-marknaden-dagar</li>
          <li>Glömma att man valt — kolla en gång per år att fonden fortfarande fungerar</li>
          <li>Tro att aktiv förvaltning slår index — 80–90% av aktiva fonder underpresterar på 10+ år</li>
        </ul>
      </div>
    </>
  );
}

// ─── My ITP section ─────────────────────────────────────────────────────────

const PROVIDER_NAMES = ITP_PROVIDERS.map(p => p.name);

function MyITPSection({ pension, updatePreferences, isMobile }) {
  const [editing, setEditing] = useState(!pension.itpType);
  const [form, setForm] = useState({
    itpType: pension.itpType || "",
    provider: pension.provider || "",
    insuranceType: pension.insuranceType || "",
    funds: pension.funds?.length ? pension.funds : [{ name: "", allocation: 100, fee: "" }],
    monthlyContribution: pension.monthlyContribution ?? "",
    currentValue: pension.currentValue ?? "",
  });

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateFund(index, key, value) {
    setForm(prev => {
      const funds = [...prev.funds];
      funds[index] = { ...funds[index], [key]: value };
      return { ...prev, funds };
    });
  }

  function addFund() {
    setForm(prev => ({ ...prev, funds: [...prev.funds, { name: "", allocation: 0, fee: "" }] }));
  }

  function removeFund(index) {
    setForm(prev => ({ ...prev, funds: prev.funds.filter((_, i) => i !== index) }));
  }

  function save() {
    const cleaned = {
      itpType: form.itpType || null,
      provider: form.provider || null,
      insuranceType: form.insuranceType || null,
      funds: form.funds.filter(f => f.name.trim()).map(f => ({
        name: f.name.trim(),
        allocation: Number(f.allocation) || 0,
        fee: f.fee === "" ? null : Number(f.fee),
      })),
      monthlyContribution: form.monthlyContribution === "" ? null : Number(form.monthlyContribution),
      currentValue: form.currentValue === "" ? null : Number(form.currentValue),
    };
    updatePreferences({ pension: cleaned });
    setEditing(false);
  }

  const inputStyle = {
    padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4,
    fontSize: 13, fontFamily: "inherit", background: "var(--bg-card)", color: "var(--text)",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const smallLabel = { fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 };

  // Summary view
  if (!editing && pension.itpType) {
    const totalAlloc = (pension.funds || []).reduce((s, f) => s + (f.allocation || 0), 0);
    const avgFee = (pension.funds || []).length > 0
      ? (pension.funds.reduce((s, f) => s + (f.fee || 0) * (f.allocation || 0), 0) / (totalAlloc || 1))
      : null;
    return (
      <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Min ITP-pension</div>
          <button onClick={() => setEditing(true)}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Redigera
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: pension.funds?.length ? 12 : 0 }}>
          <div>
            <div style={smallLabel}>Typ</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{pension.itpType}</div>
          </div>
          <div>
            <div style={smallLabel}>Bolag</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{pension.provider || "–"}</div>
          </div>
          <div>
            <div style={smallLabel}>Försäkringsform</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
              {pension.insuranceType === "fond" ? "Fondförsäkring" : pension.insuranceType === "trad" ? "Traditionell" : "–"}
            </div>
          </div>
          {pension.currentValue != null && (
            <div>
              <div style={smallLabel}>Aktuellt värde</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", ...mono }}>
                {Number(pension.currentValue).toLocaleString("sv-SE")} kr
              </div>
            </div>
          )}
        </div>

        {pension.funds?.length > 0 && (
          <div>
            <div style={smallLabel}>Fonder</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pension.funds.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < pension.funds.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{f.name}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", ...mono }}>{f.allocation}%</span>
                    {f.fee != null && <span style={{ fontSize: 11, color: f.fee <= 0.3 ? "#089981" : "var(--text-secondary)", ...mono }}>avg. {f.fee}%</span>}
                  </div>
                </div>
              ))}
            </div>
            {avgFee != null && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, ...mono }}>
                Viktad snittavgift: {avgFee.toFixed(2)}%
              </div>
            )}
          </div>
        )}

        {pension.monthlyContribution != null && (
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
            Månadsinbetalning: <span style={mono}>{Number(pension.monthlyContribution).toLocaleString("sv-SE")} kr</span>
          </div>
        )}
      </div>
    );
  }

  // Edit/create form
  return (
    <div style={{ ...cardStyle, borderLeft: "3px solid var(--accent)" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Min ITP-pension</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
        Fyll i dina uppgifter för att få en samlad bild av ditt pensionssparande.
      </div>

      {/* ITP type */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>ITP-typ</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ITP1", "ITP2"].map(t => (
            <button key={t} onClick={() => updateField("itpType", t)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                border: form.itpType === t ? "2px solid var(--accent)" : "2px solid var(--border)",
                background: form.itpType === t ? "var(--accent-light)" : "var(--bg-card)",
                color: form.itpType === t ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: form.itpType === t ? 600 : 400,
              }}>
              {t}
              <div style={{ fontSize: 10, marginTop: 2, color: "var(--text-muted)" }}>
                {t === "ITP1" ? "Premiebestämd (f. 1979+)" : "Förmånsbestämd (f. –1978)"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>Försäkringsbolag</div>
        <select value={form.provider} onChange={e => updateField("provider", e.target.value)} style={selectStyle}>
          <option value="">Välj bolag...</option>
          {PROVIDER_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          <option value="Annat">Annat</option>
        </select>
      </div>

      {/* Insurance type */}
      <div style={{ marginBottom: 14 }}>
        <div style={smallLabel}>Försäkringsform</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ value: "fond", label: "Fondförsäkring" }, { value: "trad", label: "Traditionell" }].map(opt => (
            <button key={opt.value} onClick={() => updateField("insuranceType", opt.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                border: form.insuranceType === opt.value ? "2px solid var(--accent)" : "2px solid var(--border)",
                background: form.insuranceType === opt.value ? "var(--accent-light)" : "var(--bg-card)",
                color: form.insuranceType === opt.value ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: form.insuranceType === opt.value ? 600 : 400,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Funds (only for fondförsäkring) */}
      {form.insuranceType === "fond" && (
        <div style={{ marginBottom: 14 }}>
          <div style={smallLabel}>Fonder</div>
          {form.funds.map((fund, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <input placeholder="Fondnamn" value={fund.name} onChange={e => updateFund(i, "name", e.target.value)}
                style={{ ...inputStyle, flex: 3 }} />
              <input placeholder="%" type="number" value={fund.allocation} onChange={e => updateFund(i, "allocation", e.target.value)}
                style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
              <input placeholder="Avgift %" type="number" step="0.01" value={fund.fee} onChange={e => updateFund(i, "fee", e.target.value)}
                style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
              {form.funds.length > 1 && (
                <button onClick={() => removeFund(i)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
                  x
                </button>
              )}
            </div>
          ))}
          <button onClick={addFund}
            style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
            + Lägg till fond
          </button>
        </div>
      )}

      {/* Monthly contribution + current value */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={smallLabel}>Månadsinbetalning (kr)</div>
          <input type="number" placeholder="t.ex. 3500" value={form.monthlyContribution}
            onChange={e => updateField("monthlyContribution", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={smallLabel}>Aktuellt värde (kr)</div>
          <input type="number" placeholder="t.ex. 450000" value={form.currentValue}
            onChange={e => updateField("currentValue", e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save}
          disabled={!form.itpType}
          style={{
            padding: "8px 20px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none",
            background: form.itpType ? "var(--accent)" : "var(--border)",
            color: form.itpType ? "#fff" : "var(--text-secondary)",
            cursor: form.itpType ? "pointer" : "default", fontFamily: "inherit",
          }}>
          Spara
        </button>
        {pension.itpType && (
          <button onClick={() => setEditing(false)}
            style={{ padding: "8px 20px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ITP / Tjänstepension ────────────────────────────────────────────────────

function ITPTab({ isMobile, pension, updatePreferences }) {
  return (
    <>
      <MyITPSection pension={pension} updatePreferences={updatePreferences} isMobile={isMobile} />

      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Tjänstepension — ITP
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>ITP1 — premiebestämd</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>Födda 1979 eller senare</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>4.5% på lön upp till 7.5 inkomstbasbelopp</li>
              <li>30% på lön över 7.5 inkomstbasbelopp</li>
              <li>Du väljer själv hur pengarna placeras</li>
              <li>Slutsumman beror helt på avkastning + avgifter</li>
            </ul>
          </div>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>ITP2 — förmånsbestämd</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>Födda 1978 eller tidigare</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>Garanterad pension som andel av slutlönen</li>
              <li>10% av lön upp till 7.5 inkomstbasbelopp</li>
              <li>65% av lön mellan 7.5–20 basbelopp</li>
              <li>ITPK-delen (2%) kan du välja placering för</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fondförsäkring vs Traditionell */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Fondförsäkring vs Traditionell försäkring
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{
            padding: 16, borderRadius: 6,
            border: "1px solid rgba(8,153,129,0.2)", background: "rgba(8,153,129,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 8 }}>Fondförsäkring</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>Du väljer fonder själv</li>
              <li>Högre potentiell avkastning</li>
              <li>Ingen garanti — du bär risken</li>
              <li><strong>Bäst för:</strong> under ~55 år med lång horisont</li>
            </ul>
          </div>
          <div style={{
            padding: 16, borderRadius: 6,
            border: "1px solid rgba(91,155,213,0.2)", background: "rgba(91,155,213,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5b9bd5", marginBottom: 8 }}>Traditionell försäkring</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>Bolaget sköter placeringen</li>
              <li>Garanterad miniminivå</li>
              <li>Lägre men säkrare avkastning</li>
              <li><strong>Bäst för:</strong> nära pension, vill ha trygghet</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.15)",
          borderRadius: 6, padding: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            ⚠️ Gör ett aktivt val!
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Utan aktivt val hamnar din ITP1-pension i traditionell försäkring hos Alecta.
            Som ung med 30+ år kvar kan fondförsäkring ge betydligt mer.
          </div>
        </div>
      </div>

      {/* Försäkringsbolag */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Försäkringsbolag via Collectum
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          Du väljer bolag och placeringsform på <strong>collectum.se</strong> med BankID.
        </p>
        <ProviderTable providers={ITP_PROVIDERS} />
      </div>

      {/* Steg-för-steg */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Så gör du ditt ITP-val
        </div>
        <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>Logga in på <strong>collectum.se</strong> med BankID</li>
          <li>Välj försäkringsbolag (t.ex. Avanza Pension, Nordnet, AMF)</li>
          <li>Välj <strong>fondförsäkring</strong> om du är under ~55 år</li>
          <li>Välj globala indexfonder med avgifter under 0.3%</li>
          <li>Fördelningsförslag: 70% global aktieindex, 20% Sverige-index, 10% räntefond</li>
        </ol>
      </div>

      <div style={{
        ...cardStyle,
        background: "rgba(8,153,129,0.04)", border: "1px solid rgba(8,153,129,0.15)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          📌 Sammanfattning
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li><strong>ITP1:</strong> Välj fondförsäkring med globala indexfonder om du har 15+ år kvar</li>
          <li><strong>ITP2/ITPK:</strong> Samma logik — indexfonder med låga avgifter</li>
          <li><strong>Avgiften avgör:</strong> 0.2% vs 1.5% kan skilja hundratusentals kronor</li>
          <li><strong>Kolla en gång per år</strong> att dina val fortfarande passar</li>
        </ul>
      </div>
    </>
  );
}
