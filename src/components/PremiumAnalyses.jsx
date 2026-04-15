import { useState, useEffect } from "react";
import { usePremium } from "../hooks/usePremium.js";
import { supabase } from "../supabase.js";
import PremiumGate from "./PremiumGate.jsx";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

function AnalysisCard({ analysis, onSelect }) {
  return (
    <div
      onClick={() => onSelect(analysis)}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
        padding: 20, cursor: "pointer", transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{analysis.title}</div>
        <span style={{ fontSize: 10, color: "var(--text-muted)", ...mono, flexShrink: 0 }}>{analysis.date}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
        {(analysis.summary || "").slice(0, 150)}...
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(analysis.tags || []).map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 3,
            background: "var(--bg-secondary)", color: "var(--text-secondary)", fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompanyAnalysis({ company }) {
  if (!company) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
      overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `4px solid ${company.color || "var(--accent)"}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{company.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", ...mono }}>{company.ticker}</div>
          </div>
          {company.verdict && (
            <span style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 4,
              background: `${company.color || "var(--accent)"}15`, color: company.color || "var(--accent)", fontWeight: 600,
            }}>
              {company.verdict}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {company.metrics && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {Object.entries(company.metrics).map(([key, val]) => (
              <div key={key} style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "8px 12px", minWidth: 80 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                  {key}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", ...mono }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {company.strengths?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#089981", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Styrkor</div>
              <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                {company.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {company.risks?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f23645", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Risker</div>
              <ul style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                {company.risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PdfButton({ slug }) {
  const [loading, setLoading] = useState(false);

  async function openPdf() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/analysis-pdf?slug=${slug}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {}
    setLoading(false);
  }

  return (
    <button
      onClick={openPdf}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        marginTop: 16, padding: "10px 24px", fontSize: 13, fontWeight: 600,
        background: loading ? "var(--text-muted)" : "var(--accent)", color: "#fff", border: "none",
        borderRadius: 6, cursor: loading ? "default" : "pointer", fontFamily: "inherit",
      }}
    >
      {loading ? "Laddar..." : "Läs hela rapporten (PDF)"}
    </button>
  );
}

function AnalysisDetail({ analysis, onBack }) {
  if (!analysis) return null;
  return (
    <div>
      <button onClick={onBack}
        style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
        &larr; Tillbaka till analyser
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, ...mono }}>{analysis.date} · {analysis.sector}</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>{analysis.title}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          {analysis.summary}
        </p>
      </div>

      {(analysis.companies || []).map(c => <CompanyAnalysis key={c.ticker} company={c} />)}

      {analysis.conclusion && (
        <div style={{
          background: "rgba(8,153,129,0.04)", border: "1px solid rgba(8,153,129,0.15)",
          borderRadius: 8, padding: 20, marginTop: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Slutsats</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
            {analysis.conclusion}
          </p>
        </div>
      )}

      {analysis.pdf_url && <PdfButton slug={analysis.slug} />}

      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 12 }}>
        Denna analys är framtagen med AI-stöd och verifierad mot publika finansiella datakällor.
        Den utgör inte investeringsrådgivning. Gör alltid din egen research.
      </div>
    </div>
  );
}

export default function PremiumAnalyses({ isMobile }) {
  const { premium, loading, checkoutLoading, error, startCheckout } = usePremium();
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const headers = {};
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/analyses", { headers });
        const data = await res.json();

        if (data.analyses) {
          setAnalyses(data.analyses);
        } else if (data.slug) {
          setAnalyses([data]);
        }
      } catch (err) {
        setFetchError("Kunde inte ladda analyser");
      }
      setFetchLoading(false);
    }
    fetchAnalyses();
  }, []);

  async function selectAnalysis(analysis) {
    try {
      const headers = {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/analyses?slug=${analysis.slug}`, { headers });
      const data = await res.json();
      if (data && data.title) {
        setSelected(data);
      } else {
        setSelected(analysis);
      }
    } catch {
      setSelected(analysis);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Rapporter</h2>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            Djupanalyser och sektorrapporter
          </div>
        </div>
        {premium && (
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 4,
            background: "rgba(8,153,129,0.1)", color: "#089981", fontWeight: 600,
          }}>
            ★ Premium
          </span>
        )}
      </div>

      <PremiumGate premium={premium} loading={loading} checkoutLoading={checkoutLoading} error={error} onSubscribe={startCheckout}>
        {fetchLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>
            Laddar analyser...
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: 40, color: "#f23645", fontSize: 13 }}>
            {fetchError}
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>
            Inga analyser tillgängliga ännu.
          </div>
        ) : selected ? (
          <AnalysisDetail analysis={selected} onBack={() => setSelected(null)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {analyses.map(a => (
              <AnalysisCard key={a.id || a.slug} analysis={a} onSelect={selectAnalysis} />
            ))}
          </div>
        )}
      </PremiumGate>
    </div>
  );
}
