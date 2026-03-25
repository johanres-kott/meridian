import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { PriceChart } from "./SharedComponents.jsx";
import SmartSuggestions from "./SmartSuggestions.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ─── Data ────────────────────────────────────────────────────────────────────

const COMPANIES = [
  { id: "investor",       name: "Investor",       ticker: "INVE-B",  exchange: "ST", founded: 1916, url: "investorab.com",          color: "#1a56db" },
  { id: "industrivarden", name: "Industrivärden", ticker: "INDU-C",  exchange: "ST", founded: 1944, url: "industrivarden.se",        color: "#0e7c5b" },
  { id: "oresund",        name: "Öresund",        ticker: "ORES",    exchange: "ST", founded: 1979, url: "oresund.se",               color: "#7c3aed" },
  { id: "latour",         name: "Latour",         ticker: "LATO-B",  exchange: "ST", founded: 1985, url: "latour.se",                color: "#b45309" },
  { id: "lundbergs",      name: "Lundbergs",      ticker: "LUND-B",  exchange: "ST", founded: 1944, url: "lundbergforetagen.se",     color: "#be185d" },
  { id: "svolder",        name: "Svolder",        ticker: "SVOL-B",  exchange: "ST", founded: 1993, url: "svolder.se",               color: "#0f766e" },
  { id: "creades",        name: "Creades",        ticker: "CREAS",   exchange: "ST", founded: 2012, url: "creades.se",               color: "#dc2626" },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!url) return;
    let dead = false;
    setLoading(true);
    setData(null);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!dead) { setData(d); setLoading(false); } })
      .catch(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [url]);
  return { data, loading };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 13, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 3, marginBottom: mb,
      background: "linear-gradient(90deg,#f0f3fa 25%,#e4e8f5 50%,#f0f3fa 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
    }} />
  );
}

function Badge({ text, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
      padding: "2px 7px", borderRadius: 3,
      color: color ?? "#787b86", background: bg ?? "#f0f3fa",
    }}>
      {text}
    </span>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#787b86" }}>
        {children}
      </span>
      {action}
    </div>
  );
}

// ─── Company logo/avatar ──────────────────────────────────────────────────────

function CompanyAvatar({ company, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: company.color + "18",
      border: `1.5px solid ${company.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: company.color,
      flexShrink: 0, userSelect: "none",
    }}>
      {company.name[0]}
    </div>
  );
}

// ─── Event row (Quartr-style) ─────────────────────────────────────────────────

function EventRow({ item, isLast }) {
  const dateStr = item.date
    ? item.date.length === 4
      ? item.date                                    // just year
      : item.date.slice(5).replace("-", " /")        // "03 /24"
    : null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: isLast ? "none" : "1px solid #f0f3fa",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "opacity 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {/* Date chip */}
      <div style={{
        fontSize: 10, fontWeight: 500, color: "#b2b5be",
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.02em", lineHeight: 1.3,
      }}>
        {dateStr ?? "—"}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12.5, color: "#131722", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {item.title}
      </div>

      {/* Arrow */}
      <div style={{ fontSize: 11, color: "#c0c3cb", flexShrink: 0 }}>↗</div>
    </a>
  );
}

function EventList({ url, emptyMsg }) {
  const { data, loading } = useFetch(url);
  const items = data?.items ?? [];

  if (loading) {
    return (
      <div>
        {[90, 75, 85, 70, 80].map((w, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 12, padding: "11px 0", borderBottom: i < 4 ? "1px solid #f0f3fa" : "none" }}>
            <Skeleton w={36} h={10} />
            <div>
              <Skeleton w={`${w}%`} h={12} mb={5} />
              <Skeleton w={`${Math.max(40, w - 20)}%`} h={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div style={{ fontSize: 12, color: "#b2b5be", padding: "16px 0" }}>{emptyMsg}</div>;
  }

  return (
    <div>
      {items.map((item, i) => (
        <EventRow key={i} item={item} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}

// ─── Leadership panel ─────────────────────────────────────────────────────────

function LeadershipPanel({ companyId, isMobile }) {
  const { data, loading } = useFetch(companyId ? `/api/leadership?id=${companyId}` : null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
      {["boardChair", "ceo"].map(key => (
        <div key={key} style={{ background: "#f8f9fd", border: "1px solid #edf0f7", borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#b2b5be", marginBottom: 7 }}>
            {key === "boardChair" ? "Styrelseordförande" : "Verkst. direktör"}
          </div>
          {loading
            ? <Skeleton w="70%" h={14} />
            : <div style={{ fontSize: 13.5, fontWeight: 500, color: "#131722" }}>
                {data?.[key] || "—"}
              </div>
          }
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar info card ────────────────────────────────────────────────────────

function InfoCard({ company, leadershipData }) {
  const rows = [
    { label: "Ticker",    value: `${company.ticker}.${company.exchange}` },
    { label: "Grundat",   value: company.founded },
    { label: "Hemsida",   value: company.url, href: `https://www.${company.url}` },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f3fa" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#787b86", marginBottom: 12 }}>
          Bolagsinfo
        </div>
        {rows.map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <span style={{ fontSize: 11, color: "#787b86" }}>{r.label}</span>
            {r.href
              ? <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2962ff", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {r.value}
                </a>
              : <span style={{ fontSize: 11, color: "#131722", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>
                  {r.value}
                </span>
            }
          </div>
        ))}
      </div>

      {/* Data freshness */}
      {leadershipData && (
        <div style={{ padding: "10px 16px", background: "#f8f9fd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#b2b5be" }}>Ledarskapsdata</span>
            <Badge
              text={leadershipData.source === "live" ? "● Live" : "Cached"}
              color={leadershipData.source === "live" ? "#089981" : "#b2b5be"}
              bg={leadershipData.source === "live" ? "#e8f5f1" : "#f5f5f5"}
            />
          </div>
          {leadershipData.fetchedAt && (
            <div style={{ fontSize: 10, color: "#c0c3cb", marginTop: 4 }}>
              {new Date(leadershipData.fetchedAt).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Company selector (horizontal tab strip) ─────────────────────────────────

function CompanySelector({ selected, onSelect, isMobile }) {
  return (
    <div style={{ display: "flex", gap: isMobile ? 3 : 4, flexWrap: "wrap" }}>
      {COMPANIES.map(c => {
        const active = c.id === selected;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 4 : 7,
              padding: isMobile ? "5px 8px" : "6px 12px", borderRadius: 6,
              border: active ? `1.5px solid ${c.color}40` : "1.5px solid transparent",
              background: active ? c.color + "0f" : "transparent",
              cursor: "pointer", fontFamily: "inherit",
              fontSize: isMobile ? 11 : 12.5, fontWeight: active ? 600 : 400,
              color: active ? c.color : "#787b86",
              transition: "all 0.12s",
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: active ? c.color : "#d1d4dc",
              transition: "background 0.12s",
            }} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── Holdings table ──────────────────────────────────────────────────────────

function HoldingsTable({ companyId }) {
  const { data, loading } = useFetch("https://thesion-scraper.vercel.app/api/holdings");

  const companyHoldings = data?.find(c => c.id === companyId);
  const holdings = companyHoldings?.holdings ?? [];

  if (loading) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 80px", gap: 8, padding: "8px 0", borderBottom: i < 5 ? "1px solid #f0f3fa" : "none" }}>
            <Skeleton w="70%" h={12} />
            <Skeleton w="60%" h={12} />
            <Skeleton w="50%" h={12} />
            <Skeleton w="60%" h={12} />
          </div>
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return <div style={{ fontSize: 12, color: "#b2b5be", padding: "16px 0" }}>Inga innehav hittade</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e0e3eb" }}>
            {["Bolag", "Ticker", "Vikt (%)", "Värde (Mkr)"].map(h => (
              <th key={h} style={{
                textAlign: h === "Bolag" || h === "Ticker" ? "left" : "right",
                padding: "8px 6px", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: "#787b86", whiteSpace: "nowrap",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={i} style={{ borderBottom: i < holdings.length - 1 ? "1px solid #f0f3fa" : "none" }}>
              <td style={{ padding: "8px 6px", color: "#131722", fontWeight: 500 }}>{h.name}</td>
              <td style={{ padding: "8px 6px", color: "#787b86", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{h.ticker || "—"}</td>
              <td style={{ padding: "8px 6px", textAlign: "right", color: "#131722", fontFamily: "'IBM Plex Mono', monospace" }}>
                {h.weight != null ? h.weight.toFixed(1) : "—"}
              </td>
              <td style={{ padding: "8px 6px", textAlign: "right", color: "#131722", fontFamily: "'IBM Plex Mono', monospace" }}>
                {h.valueMSEK != null ? h.valueMSEK.toLocaleString("sv-SE") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function InvestmentCompanies({ preferences = {}, userId, onNavigate }) {
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState("investor");
  const [tickers, setTickers] = useState([]);
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
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e0e3eb", marginBottom: 24 }}>
        {[
          { id: "toppforslag", label: "Toppförslag" },
          { id: "investmentbolag", label: "Investmentbolag" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{
              fontSize: isMobile ? 12 : 13, fontWeight: 500, padding: isMobile ? "8px 12px" : "10px 20px",
              background: "none", border: "none", borderBottom: "2px solid transparent",
              color: "#787b86", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#2962ff"; e.currentTarget.style.borderBottomColor = "#2962ff"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#787b86"; e.currentTarget.style.borderBottomColor = "transparent"; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Smart Suggestions ── */}
      {preferences.investorProfile && (
        <div id="toppforslag" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#131722", marginBottom: 16 }}>Toppförslag</div>
          <SmartSuggestions
            profile={preferences.investorProfile}
            existingTickers={tickers}
            isMobile={isMobile}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* ── Investment companies section ── */}
      <div id="investmentbolag" style={{ fontSize: 18, fontWeight: 600, color: "#131722", marginBottom: 16 }}>Investera som investmentbolag</div>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#b2b5be", marginBottom: 8, letterSpacing: "0.04em" }}>
          Investmentbolag <span style={{ margin: "0 4px" }}>›</span> {company.name}
        </div>
        <CompanySelector selected={selectedId} onSelect={setSelectedId} isMobile={isMobile} />
      </div>

      {/* ── Company hero ── */}
      <div style={{
        background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8,
        padding: isMobile ? "14px 12px" : "20px 24px", marginBottom: 16,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between", gap: isMobile ? 12 : 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
          <CompanyAvatar company={company} size={isMobile ? 34 : 42} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 600, color: "#131722" }}>{company.name}</span>
              <Badge
                text={`${company.ticker}.${company.exchange}`}
                color="#787b86"
                bg="#f0f3fa"
              />
            </div>
            <a
              href={`https://www.${company.url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#b2b5be", textDecoration: "none" }}
            >
              {company.url} ↗
            </a>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", ...(isMobile ? { width: "100%", justifyContent: "space-between" } : {}) }}>
          {companyData?.price != null && (
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 300, fontFamily: "'IBM Plex Mono', monospace", color: "#131722" }}>
                {companyData.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={{ fontSize: 12, color: "#787b86", marginLeft: 4 }}>{companyData.currency}</span>
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
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Ledning</SectionLabel>
            <LeadershipPanel companyId={selectedId} isMobile={isMobile} />
          </div>

          {/* Price chart */}
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Kursutveckling</SectionLabel>
            <PriceChart ticker={fullTicker} />
          </div>

          {/* Holdings */}
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel>Innehav</SectionLabel>
            <HoldingsTable companyId={selectedId} />
          </div>

          {/* Press releases */}
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel
              action={
                <Badge text="Pressreleaser" color="#787b86" bg="#f0f3fa" />
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
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <SectionLabel
              action={
                <Badge text="EFN.se" color="#2962ff" bg="#eef2ff" />
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
          <div style={{ background: "#fff", border: "1px solid #e0e3eb", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#787b86", marginBottom: 10 }}>
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
                  borderBottom: "1px solid #f8f9fd",
                  textDecoration: "none",
                  fontSize: 12, color: "#131722",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#2962ff"}
                onMouseLeave={e => e.currentTarget.style.color = "#131722"}
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
