import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { PriceChart } from "./SharedComponents.jsx";
import SmartSuggestions from "./SmartSuggestions.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { useUser } from "../contexts/UserContext.jsx";

import { useFetch, Badge, SectionLabel, CompanyAvatar } from "./investment/primitives.jsx";
import EventList from "./investment/EventList.jsx";
import LeadershipPanel from "./investment/LeadershipPanel.jsx";
import InfoCard from "./investment/InfoCard.jsx";
import CompanySelector, { COMPANIES } from "./investment/CompanySelector.jsx";
import HoldingsTable from "./investment/HoldingsTable.jsx";
import FundSuggestions from "./FundSuggestions.jsx";
import FundEducation from "./FundEducation.jsx";
import PensionInvest from "./PensionInvest.jsx";

// ─── Main export ──────────────────────────────────────────────────────────────

export default function InvestmentCompanies({ onNavigate }) {
  const { userId, preferences } = useUser();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState("investor");
  const [tickers, setTickers] = useState([]);
  const [suggestMode, setSuggestMode] = useState("stock"); // "stock" | "fund"
  const company = COMPANIES.find(c => c.id === selectedId);

  useEffect(() => {
    if (!userId) return;
    supabase.from("watchlist").select("ticker").eq("user_id", userId).then(({ data }) => {
      setTickers((data || []).map(d => d.ticker));
    });
  }, [userId]);

  const fullTicker = `${company.ticker}.${company.exchange}`;
  const { data: leadershipData } = useFetch(`/api/leadership?id=${selectedId}`);
  const { data: companyData } = useFetch(`/api/company?ticker=${encodeURIComponent(fullTicker)}`);

  return (
    <div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Sub-navigation ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {[
          { id: "toppforslag", label: "Toppförslag" },
          { id: "pension", label: "Pension" },
          { id: "investmentbolag", label: "Investmentbolag" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{
              fontSize: isMobile ? 12 : 13, fontWeight: 500, padding: isMobile ? "8px 12px" : "10px 20px",
              background: "none", border: "none", borderBottom: "2px solid transparent",
              color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderBottomColor = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderBottomColor = "transparent"; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Smart Suggestions ── */}
      <div id="toppforslag" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Toppförslag</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "stock", label: "Aktier" },
              { id: "fund", label: "Fonder" },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSuggestMode(opt.id)}
                style={{
                  fontSize: 11, padding: "4px 12px", borderRadius: 4,
                  border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit",
                  fontWeight: suggestMode === opt.id ? 600 : 400,
                  background: suggestMode === opt.id ? "var(--accent)" : "var(--bg-card)",
                  color: suggestMode === opt.id ? "#fff" : "var(--text-secondary)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {suggestMode === "fund" ? (
          <>
            <FundSuggestions isMobile={isMobile} onNavigate={onNavigate} />
            <FundEducation />
          </>
        ) : preferences.investorProfile ? (
          <SmartSuggestions
            profile={preferences.investorProfile}
            existingTickers={tickers}
            isMobile={isMobile}
            onNavigate={onNavigate}
          />
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
            Skapa en investerarprofil för att få aktieförslag anpassade efter dig.
          </div>
        )}
      </div>

      {/* ── Pension section ── */}
      <div id="pension" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Pensionssparande</div>
        <PensionInvest isMobile={isMobile} />
      </div>

      {/* ── Investment companies section ── */}
      <div id="investmentbolag" style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Investera som investmentbolag</div>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.04em" }}>
          Investmentbolag <span style={{ margin: "0 4px" }}>›</span> {company.name}
        </div>
        <CompanySelector selected={selectedId} onSelect={setSelectedId} isMobile={isMobile} />
      </div>

      {/* ── Company hero ── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
        padding: isMobile ? "14px 12px" : "20px 24px", marginBottom: 16,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between", gap: isMobile ? 12 : 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
          <CompanyAvatar company={company} size={isMobile ? 34 : 42} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 600, color: "var(--text)" }}>{company.name}</span>
              <Badge
                text={`${company.ticker}.${company.exchange}`}
                color="var(--text-secondary)"
                bg="var(--border-light)"
              />
            </div>
            <a
              href={`https://www.${company.url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}
            >
              {company.url} ↗
            </a>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", ...(isMobile ? { width: "100%", justifyContent: "space-between" } : {}) }}>
          {companyData?.price != null && (
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "var(--text)" }}>
                {companyData.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>{companyData.currency}</span>
              </div>
              {companyData.changePercent != null && (
                <div style={{ fontSize: 12, fontWeight: 500, color: companyData.changePercent >= 0 ? "#089981" : "#f23645" }}>
                  {companyData.changePercent >= 0 ? "+" : ""}{companyData.changePercent.toFixed(2)}%
                </div>
              )}
            </div>
          )}
          {leadershipData && (
            <Badge
              text={leadershipData.source === "live" ? "● Live data" : "Cached data"}
              color={leadershipData.source === "live" ? "#089981" : "#b2b5be"}
              bg={leadershipData.source === "live" ? "#e8f5f1" : "#f5f5f5"}
            />
          )}
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 16, alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Leadership */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Ledning</SectionLabel>
            <LeadershipPanel companyId={selectedId} isMobile={isMobile} />
          </div>

          {/* Price chart */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Kursutveckling</SectionLabel>
            <PriceChart ticker={fullTicker} />
          </div>

          {/* Holdings */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Innehav</SectionLabel>
            <HoldingsTable companyId={selectedId} />
          </div>

          {/* Press releases */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel
              action={
                <Badge text="Pressreleaser" color="var(--text-secondary)" bg="var(--border-light)" />
              }
            >
              Senaste händelser
            </SectionLabel>
            <EventList
              url={`/api/company-news?id=${selectedId}&count=8`}
              emptyMsg="Inga pressreleaser hittade"
            />
          </div>

          {/* EFN */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel
              action={
                <Badge text="EFN.se" color="var(--accent)" bg="var(--accent-light)" />
              }
            >
              Nyheter &amp; Analyser
            </SectionLabel>
            <EventList
              url={`/api/efn-news?id=${selectedId}&count=8`}
              emptyMsg="Inga EFN-artiklar hittade"
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <InfoCard company={company} leadershipData={leadershipData} />

          {/* Quick links */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>
              Snabblänkar
            </div>
            {[
              { label: "Pressreleaser", href: `https://www.${company.url}/press` },
              { label: "IR-sida",       href: `https://www.${company.url}/investor-relations` },
              { label: "Bolagsstyrning",href: `https://www.${company.url}/bolagsstyrning` },
              { label: "EFN-sök",       href: `https://efn.se/sok/alla?q=${encodeURIComponent(company.name)}&index=artiklar` },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0",
                  borderBottom: "1px solid var(--bg-secondary)",
                  textDecoration: "none",
                  fontSize: 12, color: "var(--text)",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}
              >
                {link.label}
                <span style={{ fontSize: 11, color: "#c0c3cb" }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
