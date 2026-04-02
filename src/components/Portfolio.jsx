import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import PdfImportModal from "./PdfImportModal.jsx";
import ImportGuide from "./ImportGuide.jsx";
import CompanyView from "./CompanyView.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { sanitizeInput } from "../lib/sanitize.js";
import PortfolioChart from "./PortfolioChart.jsx";
import AllocationCard from "./AllocationCard.jsx";
import StrategyCard from "./StrategyCard.jsx";
import PortfolioTreemap from "./PortfolioTreemap.jsx";
import GroupFilterBar from "./GroupFilterBar.jsx";
import CompanyRow from "./CompanyRow.jsx";
import AddCompanyBar from "./AddCompanyBar.jsx";
import { useFxRates } from "../hooks/useFxRates.js";
import { useUser } from "../contexts/UserContext.jsx";

export default function Portfolio({ deepLink, onClearDeepLink }) {
  const { userId, preferences, updatePreferences } = useUser();
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selected, setSelected] = useState(null);
  const { fxRates } = useFxRates();
  const [activeGroup, setActiveGroup] = useState(null);
  const [scores, setScores] = useState({});
  const [prices, setPrices] = useState({});

  const groups = preferences.groups || [];

  useEffect(() => { load(); loadScores(); }, []);

  async function loadScores() {
    try {
      const res = await fetch("/api/suggestions?limit=300");
      const data = await res.json();
      const list = data?.suggestions || (Array.isArray(data) ? data : []);
      const map = {};
      list.forEach(s => { map[s.ticker?.toUpperCase()] = s; });
      setScores(map);
    } catch {}
  }

  // Handle deep link from Översikt
  useEffect(() => {
    if (!deepLink?.ticker || loading || items.length === 0) return;
    const match = items.find(i => i.ticker.toUpperCase() === deepLink.ticker.toUpperCase());
    if (match) {
      setSelected(match);
      onClearDeepLink?.();
    }
  }, [deepLink, loading, items]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at");
    setItems(data || []);
    setLoading(false);
    if (data && data.length > 0) {
      const withShares = data.filter(item => item.shares > 0);
      if (withShares.length > 0) {
        const results = await Promise.all(
          withShares.map(item =>
            fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => d?.price ? [item.ticker, d] : null)
              .catch(() => null)
          )
        );
        const map = {};
        for (const r of results) { if (r) map[r[0]] = r[1]; }
        setPrices(map);
      }
    }
  }

  async function addCompany({ ticker, name }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("watchlist").insert({ ticker, name, user_id: user.id, status: "Bevakar" }).select().single();
    if (!error) {
      setItems(prev => [...prev, data]);
      if (activeGroup && data) {
        toggleGroupMember(activeGroup, data.id);
      }
    }
  }

  async function updateItem(id, updates) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("watchlist").update(updates).eq("id", id).eq("user_id", user.id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (selected && selected.id === id) setSelected(prev => ({ ...prev, ...updates }));
  }

  async function deleteItem(id) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("watchlist").delete().eq("id", id).eq("user_id", user.id);
    setItems(prev => prev.filter(i => i.id !== id));
    const updated = groups.map(g => ({
      ...g,
      members: (g.members || []).filter(m => m !== id),
    }));
    if (JSON.stringify(updated) !== JSON.stringify(groups)) {
      updatePreferences({ groups: updated });
    }
  }

  function toggleGroupMember(groupName, itemId) {
    const updated = groups.map(g => {
      if (g.name !== groupName) return g;
      const members = g.members || [];
      if (members.includes(itemId)) {
        return { ...g, members: members.filter(m => m !== itemId) };
      } else {
        return { ...g, members: [...members, itemId] };
      }
    });
    updatePreferences({ groups: updated });
  }

  if (loading) return <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Laddar...</div>;

  async function importHoldings(holdings) {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = holdings.map(h => ({
      ticker: h.ticker, name: h.name, user_id: user.id,
      status: "Bevakar", shares: h.shares, gav: h.gav,
    }));
    const { data, error } = await supabase.from("watchlist").insert(rows).select();
    if (!error && data) {
      setItems(prev => [...prev, ...data]);
      if (activeGroup) {
        const newIds = data.map(d => d.id);
        const updated = groups.map(g => {
          if (g.name !== activeGroup) return g;
          return { ...g, members: [...(g.members || []), ...newIds] };
        });
        updatePreferences({ groups: updated });
      }
    }
    return { data, error };
  }

  if (selected) {
    const freshItem = items.find(i => i.id === selected.id) || selected;
    return <CompanyView item={freshItem} onBack={() => setSelected(null)} onUpdate={updateItem} investorType={preferences.investorProfile?.investorType} investorProfile={preferences.investorProfile} />;
  }

  // Filter items by active group
  const filteredItems = activeGroup
    ? items.filter(item => {
        const group = groups.find(g => g.name === activeGroup);
        return group && (group.members || []).includes(item.id);
      })
    : items;

  const hasAnyShares = filteredItems.some(i => i.shares);
  const hasAnyPL = filteredItems.some(i => i.gav && i.shares);

  return (
    <div>
      {showImport && (
        <PdfImportModal
          onClose={() => setShowImport(false)}
          existingTickers={items.map(i => i.ticker)}
          onImport={importHoldings}
        />
      )}
      {showGuide && (
        <ImportGuide
          onClose={() => setShowGuide(false)}
          onStartImport={() => setShowImport(true)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, gap: isMobile ? 12 : 0 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text)", marginBottom: 4 }}>Portfölj</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {activeGroup ? `${filteredItems.length} bolag i ${activeGroup}` : `${items.length} bolag`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexDirection: "row" }}>
          <button onClick={() => {
            const rows = [["Bolag", "Ticker", "Status", "Antal", "GAV", "Kurs", "Valuta"].join(";")];
            items.forEach(i => {
              rows.push([i.name || "", i.ticker, i.status || "", i.shares || "", i.gav || "", "", ""].join(";"));
            });
            const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "thesion-portfolj.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
            title="Exportera CSV"
            style={{ padding: isMobile ? "7px 10px" : "7px 16px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text)" }}>
            {isMobile ? "⬇ CSV" : "Exportera CSV"}
          </button>
          <button onClick={() => setShowImport(true)}
            title="Importera portfölj"
            style={{ padding: isMobile ? "7px 10px" : "7px 16px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text)" }}>
            {isMobile ? "⬆ Import" : "Importera portfölj"}
          </button>
          <button onClick={() => setShowGuide(true)}
            title="Hur importerar jag?"
            style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", color: "var(--text-secondary)" }}>
            ?
          </button>
        </div>
      </div>

      <StrategyCard isMobile={isMobile} />

      <AllocationCard
        items={items}
        scores={scores}
        prices={prices}
        fxRates={fxRates}
        riskProfile={preferences.investorProfile?.riskProfile || "medium"}
        isMobile={isMobile}
      />

      <GroupFilterBar items={items} activeGroup={activeGroup} setActiveGroup={setActiveGroup} isMobile={isMobile} />

      <AddCompanyBar onAdd={addCompany} isMobile={isMobile} />
      <PortfolioTreemap items={filteredItems} prices={prices} fxRates={fxRates} onSelect={setSelected} isMobile={isMobile} />

      {items.some(i => i.shares) && userId && <PortfolioChart />}

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)", fontSize: 13 }}>
          {activeGroup
            ? `Inga bolag i "${activeGroup}" — klicka + på en rad för att lägga till`
            : "Inga bolag ännu — sök efter ett bolag ovan för att lägga till"}
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 480 : undefined }}>
            <thead>
              <tr>
                {["", "Bolag", "Status", ...(isMobile ? [] : ["Grupper"]), "Kurs", ...(hasAnyShares ? ["Värde"] : []), ...(!isMobile && hasAnyPL ? ["P&L"] : []), " "].map(h => (
                  <th key={h || "flag"} style={{
                    padding: isMobile ? "6px 8px" : "8px 14px",
                    textAlign: ["Kurs", "Värde", "P&L"].includes(h) ? "right" : "left",
                    fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <CompanyRow key={item.id} item={item} onUpdate={updateItem} onSelect={setSelected} onDelete={deleteItem} fxRates={fxRates} groups={groups} onToggleGroup={toggleGroupMember} isMobile={isMobile} investorProfile={preferences.investorProfile} scoreData={scores[item.ticker?.toUpperCase()]} priceData={prices[item.ticker] || null} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile matching legend */}
      {preferences.investorProfile && filteredItems.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
            Hur vi poängsätter bolag
          </summary>
          <div style={{ marginTop: 8, padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 6, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(8,153,129,0.15)", color: "#089981", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>82</span>
                Totalpoäng 70–100: Stark matchning med din profil
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(255,152,0,0.15)", color: "#ff9800", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>55</span>
                Totalpoäng 40–69: Okej matchning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(242,54,69,0.15)", color: "#f23645", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>25</span>
                Totalpoäng 0–39: Svag matchning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, background: "var(--accent-light)", color: "#089981", fontWeight: 500, flexShrink: 0 }}>F-Score 8/9</span>
                Piotroski F-Score ≥ 7 — hög finansiell kvalitet
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
              Poäng baseras på Piotroski F-Score, Magic Formula, tillväxt, utdelning och kvalitet. Viktas efter din investerarprofil. Utgör inte finansiell rådgivning.
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
