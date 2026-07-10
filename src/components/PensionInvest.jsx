import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext.jsx";
import MyITPSection from "./MyITPSection.jsx";
import { useItpProviders } from "../hooks/useItpProviders.js";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 };

// ─── PPM fund suggestions (real funds available on Pensionsmyndighetens fondtorg) ───

function getPpmSuggestions(t) {
  return [
    { name: "AP7 Aktiefond", fee: 0.05, type: "index", note: t("pensionInvest.ppmFunds.ap7EquityNote") },
    { name: "AP7 Räntefond", fee: 0.05, type: "index", note: t("pensionInvest.ppmFunds.ap7BondNote") },
    { name: "Avanza Zero", fee: 0.00, type: "index", note: t("pensionInvest.ppmFunds.avanzaZeroNote") },
    { name: "Länsförsäkringar Global Indexnära", fee: 0.22, type: "index", note: t("pensionInvest.ppmFunds.lansforsakringarNote") },
    { name: "SPP Aktiefond Global", fee: 0.14, type: "index", note: t("pensionInvest.ppmFunds.sppGlobalNote") },
    { name: "Swedbank Robur Access Global", fee: 0.20, type: "index", note: t("pensionInvest.ppmFunds.swedbankRoburNote") },
  ];
}

// ITP providers loaded from Supabase via useItpProviders hook

// ─── Age-based model portfolios ───

function getModelPortfolios(t) {
  return [
    {
      label: t("pensionInvest.models.youngLabel"),
      icon: "🚀",
      color: "#089981",
      allocation: t("pensionInvest.models.youngAllocation"),
      suggestion: t("pensionInvest.models.youngSuggestion"),
      detail: t("pensionInvest.models.youngDetail"),
    },
    {
      label: t("pensionInvest.models.midCareerLabel"),
      icon: "⚖️",
      color: "#5b9bd5",
      allocation: t("pensionInvest.models.midCareerAllocation"),
      suggestion: t("pensionInvest.models.midCareerSuggestion"),
      detail: t("pensionInvest.models.midCareerDetail"),
    },
    {
      label: t("pensionInvest.models.nearRetirementLabel"),
      icon: "🛡️",
      color: "#ff9800",
      allocation: t("pensionInvest.models.nearRetirementAllocation"),
      suggestion: t("pensionInvest.models.nearRetirementSuggestion"),
      detail: t("pensionInvest.models.nearRetirementDetail"),
    },
    {
      label: t("pensionInvest.models.retireeLabel"),
      icon: "🏖️",
      color: "#9c27b0",
      allocation: t("pensionInvest.models.retireeAllocation"),
      suggestion: t("pensionInvest.models.retireeSuggestion"),
      detail: t("pensionInvest.models.retireeDetail"),
    },
  ];
}

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
  const { t } = useTranslation();
  const thStyle = { fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>{t("pensionInvest.fundTable.colFund")}</th>
            <th style={{ ...thStyle, textAlign: "right" }}>{t("pensionInvest.fundTable.colFee")}</th>
            <th style={thStyle}>{t("pensionInvest.fundTable.colType")}</th>
            <th style={thStyle}>{t("pensionInvest.fundTable.colNote")}</th>
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
                  {f.type === "index" ? t("pensionInvest.fundTable.typeIndex") : t("pensionInvest.fundTable.typeActive")}
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
  const { t } = useTranslation();
  const thStyle = { fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const dot = (ok) => <span style={{ color: ok ? "#089981" : "var(--text-muted)" }}>{ok ? "✓" : "—"}</span>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>{t("pensionInvest.providerTable.colInsurer")}</th>
            <th style={{ ...thStyle, textAlign: "center" }}>{t("pensionInvest.providerTable.colUnitLinked")}</th>
            <th style={{ ...thStyle, textAlign: "center" }}>{t("pensionInvest.providerTable.colTraditional")}</th>
            <th style={thStyle}>{t("pensionInvest.providerTable.colNote")}</th>
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "ppm" | "itp"
  const { preferences, updatePreferences } = useUser();
  const pension = preferences.pension || {};
  const { providers } = useItpProviders();

  const tabs = [
    { id: "overview", label: t("pensionInvest.tabs.overview") },
    { id: "ppm", label: t("pensionInvest.tabs.ppm") },
    { id: "itp", label: t("pensionInvest.tabs.itp") },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {tabs.map(tab => (
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
      {activeTab === "itp" && <ITPTab isMobile={isMobile} pension={pension} updatePreferences={updatePreferences} providers={providers} />}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ isMobile }) {
  const { t } = useTranslation();
  const modelPortfolios = getModelPortfolios(t);

  return (
    <>
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          {t("pensionInvest.overview.pillarsTitle")}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
          {t("pensionInvest.overview.pillarsDesc")}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PensionPillarCard icon="🏛️" title={t("pensionInvest.overview.pillar1Title")} pct={t("pensionInvest.overview.pillar1Pct")} color="8,153,129">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {t("pensionInvest.overview.pillar1Desc")}
            </p>
          </PensionPillarCard>

          <PensionPillarCard icon="🏢" title={t("pensionInvest.overview.pillar2Title")} pct={t("pensionInvest.overview.pillar2Pct")} color="91,155,213">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {t("pensionInvest.overview.pillar2Desc")}
            </p>
          </PensionPillarCard>

          <PensionPillarCard icon="🏦" title={t("pensionInvest.overview.pillar3Title")} pct={t("pensionInvest.overview.pillar3Pct")} color="156,39,176">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {t("pensionInvest.overview.pillar3Desc")}
            </p>
          </PensionPillarCard>
        </div>
      </div>

      {/* Age-based portfolios */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          {t("pensionInvest.overview.agePortfoliosTitle")}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
          {t("pensionInvest.overview.agePortfoliosSubtitle")}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {modelPortfolios.map(mp => (
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
          {t("pensionInvest.overview.keyInsightTitle")}
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>{t("pensionInvest.overview.keyInsight1")}</li>
          <li>{t("pensionInvest.overview.keyInsight2")}</li>
          <li>{t("pensionInvest.overview.keyInsight3")}</li>
          <li>{t("pensionInvest.overview.keyInsight4")}</li>
        </ul>
      </div>
    </>
  );
}

// ─── Premiepension ───────────────────────────────────────────────────────────

function PPMTab({ isMobile }) {
  const { t } = useTranslation();
  const ppmSuggestions = getPpmSuggestions(t);

  return (
    <>
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          {t("pensionInvest.ppm.title")}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>
          {t("pensionInvest.ppm.desc")}
        </p>

        <div style={{
          background: "rgba(91,155,213,0.06)", border: "1px solid rgba(91,155,213,0.15)",
          borderRadius: 6, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {t("pensionInvest.ppm.ap7Title")}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: "4px 0 0 0" }}>
            {t("pensionInvest.ppm.ap7Desc")}
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          {t("pensionInvest.ppm.fundsTitle")}
        </div>
        <FundTable funds={ppmSuggestions} />
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
          {t("pensionInvest.ppm.fundsDisclaimer")}
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          {t("pensionInvest.ppm.switchTitle")}
        </div>
        <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>{t("pensionInvest.ppm.step1")}</li>
          <li>{t("pensionInvest.ppm.step2")}</li>
          <li>{t("pensionInvest.ppm.step3")}</li>
          <li>{t("pensionInvest.ppm.step4")}</li>
        </ol>
      </div>

      <div style={{
        ...cardStyle,
        background: "rgba(255,152,0,0.04)", border: "1px solid rgba(255,152,0,0.15)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          {t("pensionInvest.ppm.mistakesTitle")}
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>{t("pensionInvest.ppm.mistake1")}</li>
          <li>{t("pensionInvest.ppm.mistake2")}</li>
          <li>{t("pensionInvest.ppm.mistake3")}</li>
          <li>{t("pensionInvest.ppm.mistake4")}</li>
        </ul>
      </div>
    </>
  );
}

// ─── ITP / Tjänstepension ────────────────────────────────────────────────────

function ITPTab({ isMobile, pension, updatePreferences, providers }) {
  const { t } = useTranslation();

  return (
    <>
      <MyITPSection pension={pension} updatePreferences={updatePreferences} isMobile={isMobile} />

      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          {t("pensionInvest.itp.title")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{t("pensionInvest.itp.itp1Title")}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>{t("pensionInvest.itp.itp1Born")}</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>{t("pensionInvest.itp.itp1Bullet1")}</li>
              <li>{t("pensionInvest.itp.itp1Bullet2")}</li>
              <li>{t("pensionInvest.itp.itp1Bullet3")}</li>
              <li>{t("pensionInvest.itp.itp1Bullet4")}</li>
            </ul>
          </div>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{t("pensionInvest.itp.itp2Title")}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>{t("pensionInvest.itp.itp2Born")}</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>{t("pensionInvest.itp.itp2Bullet1")}</li>
              <li>{t("pensionInvest.itp.itp2Bullet2")}</li>
              <li>{t("pensionInvest.itp.itp2Bullet3")}</li>
              <li>{t("pensionInvest.itp.itp2Bullet4")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fondförsäkring vs Traditionell */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          {t("pensionInvest.itp.insuranceTitle")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{
            padding: 16, borderRadius: 6,
            border: "1px solid rgba(8,153,129,0.2)", background: "rgba(8,153,129,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 8 }}>{t("pensionInvest.itp.unitLinkedTitle")}</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>{t("pensionInvest.itp.unitLinkedBullet1")}</li>
              <li>{t("pensionInvest.itp.unitLinkedBullet2")}</li>
              <li>{t("pensionInvest.itp.unitLinkedBullet3")}</li>
              <li><strong>{t("pensionInvest.itp.unitLinkedBullet4Prefix")}</strong> {t("pensionInvest.itp.unitLinkedBullet4Desc")}</li>
            </ul>
          </div>
          <div style={{
            padding: 16, borderRadius: 6,
            border: "1px solid rgba(91,155,213,0.2)", background: "rgba(91,155,213,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5b9bd5", marginBottom: 8 }}>{t("pensionInvest.itp.traditionalTitle")}</div>
            <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
              <li>{t("pensionInvest.itp.traditionalBullet1")}</li>
              <li>{t("pensionInvest.itp.traditionalBullet2")}</li>
              <li>{t("pensionInvest.itp.traditionalBullet3")}</li>
              <li><strong>{t("pensionInvest.itp.traditionalBullet4Prefix")}</strong> {t("pensionInvest.itp.traditionalBullet4Desc")}</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.15)",
          borderRadius: 6, padding: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {t("pensionInvest.itp.warningTitle")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("pensionInvest.itp.warningDesc")}
          </div>
        </div>
      </div>

      {/* Försäkringsbolag */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          {t("pensionInvest.itp.providersTitle")}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          {t("pensionInvest.itp.providersDesc")}
        </p>
        <ProviderTable providers={providers} />
      </div>

      {/* Steg-för-steg */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          {t("pensionInvest.itp.howTitle")}
        </div>
        <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>{t("pensionInvest.itp.howStep1")}</li>
          <li>{t("pensionInvest.itp.howStep2")}</li>
          <li><strong>{t("pensionInvest.itp.howStep3")}</strong></li>
          <li>{t("pensionInvest.itp.howStep4")}</li>
          <li>{t("pensionInvest.itp.howStep5")}</li>
        </ol>
      </div>

      <div style={{
        ...cardStyle,
        background: "rgba(8,153,129,0.04)", border: "1px solid rgba(8,153,129,0.15)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          {t("pensionInvest.itp.summaryTitle")}
        </div>
        <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li><strong>{t("pensionInvest.itp.summaryLine1Prefix")}</strong> {t("pensionInvest.itp.summaryLine1Desc")}</li>
          <li><strong>{t("pensionInvest.itp.summaryLine2Prefix")}</strong> {t("pensionInvest.itp.summaryLine2Desc")}</li>
          <li><strong>{t("pensionInvest.itp.summaryLine3Prefix")}</strong> {t("pensionInvest.itp.summaryLine3Desc")}</li>
          <li><strong>{t("pensionInvest.itp.summaryLine4Prefix")}</strong> {t("pensionInvest.itp.summaryLine4Desc")}</li>
        </ul>
      </div>
    </>
  );
}
