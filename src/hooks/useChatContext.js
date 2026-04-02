import { useRef, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useUser } from "../contexts/UserContext.jsx";
import { parseFxRates } from "./useFxRates.js";
import { analyzeAllocation, allocationSummary } from "../utils/portfolioAllocation.js";

/**
 * Hook that builds the chat context object for the AI assistant.
 * Extracted from App.jsx to reduce its complexity.
 *
 * Fetches indices, commodities, watchlist, company data, scores,
 * and allocation analysis when the chat is open.
 */
export function useChatContext(chatOpen) {
  const { userId, preferences, session } = useUser();
  const contextRef = useRef({});

  useEffect(() => {
    if (!chatOpen || !session) return;

    let cancelled = false;

    async function loadContext() {
      try {
        const [indicesRes, commoditiesRes, watchlistRes] = await Promise.all([
          fetch("/api/indices").then(r => r.json()).catch(err => { console.error("Failed to fetch indices:", err); return []; }),
          fetch("/api/commodities").then(r => r.json()).catch(err => { console.error("Failed to fetch commodities:", err); return []; }),
          supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at"),
        ]);

        if (cancelled) return;

        const watchlist = watchlistRes.data || [];
        const portfolio = await Promise.all(
          watchlist.slice(0, 20).map(async (item) => {
            try {
              const r = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
              const d = await r.json();
              const shares = item.shares || 0;
              const gav = item.gav || 0;
              const valueSek = shares > 0 ? shares * d.price : 0;
              const costSek = shares > 0 && gav > 0 ? shares * gav : 0;
              const plSek = costSek > 0 ? valueSek - costSek : null;
              const plPct = costSek > 0 ? ((valueSek - costSek) / costSek * 100) : null;
              return {
                ticker: item.ticker, name: d.name || item.name, price: d.price, currency: d.currency,
                changePercent: d.changePercent, status: item.status,
                shares, gav, valueSek: Math.round(valueSek),
                plSek: plSek != null ? Math.round(plSek) : null,
                plPct: plPct != null ? +plPct.toFixed(1) : null,
                sector: d.sector,
              };
            } catch (err) {
              console.error(`Failed to fetch company data for ${item.ticker}:`, err);
              return null;
            }
          })
        );

        if (cancelled) return;

        const validPortfolio = portfolio.filter(Boolean);

        // Fetch scoring data for owned stocks
        const ownedTickers = validPortfolio.filter(p => p.shares > 0).map(p => p.ticker);
        const scoreResults = await Promise.all(
          ownedTickers.slice(0, 15).map(async (ticker) => {
            try {
              const r = await fetch(`/api/score?ticker=${encodeURIComponent(ticker)}`);
              const d = await r.json();
              return d ? { ticker, composite: d.composite, scores: d.scores, data: d.data, risk: d.risk } : null;
            } catch (err) {
              console.error(`Failed to fetch score for ${ticker}:`, err);
              return null;
            }
          })
        );

        if (cancelled) return;

        const scoresMap = {};
        scoreResults.filter(Boolean).forEach(s => { scoresMap[s.ticker] = s; });

        // Enrich portfolio with scores
        const enrichedPortfolio = validPortfolio.map(p => ({
          ...p,
          score: scoresMap[p.ticker] || null,
        }));

        const totalValue = enrichedPortfolio.reduce((s, p) => s + (p.valueSek || 0), 0);
        const totalCost = enrichedPortfolio.reduce((s, p) => s + (p.shares > 0 && p.gav > 0 ? p.shares * p.gav : 0), 0);
        const totalPl = totalCost > 0 ? totalValue - totalCost : null;
        const totalPlPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : null;

        // Build sector distribution
        const sectorDist = {};
        enrichedPortfolio.filter(p => p.shares > 0 && p.valueSek > 0).forEach(p => {
          const sector = p.sector || "Okänd";
          sectorDist[sector] = (sectorDist[sector] || 0) + p.valueSek;
        });
        const sectorBreakdown = totalValue > 0
          ? Object.entries(sectorDist).map(([sector, value]) => ({
              sector, value: Math.round(value), pct: +((value / totalValue) * 100).toFixed(1),
            })).sort((a, b) => b.value - a.value)
          : [];

        // Build allocation analysis
        const riskProfile = preferences.investorProfile?.riskProfile || "medium";
        const allocItems = enrichedPortfolio.filter(p => p.shares > 0).map(p => ({
          ticker: p.ticker, name: p.name, shares: p.shares,
        }));
        const allocScores = {};
        enrichedPortfolio.forEach(p => {
          if (p.score) {
            allocScores[p.ticker.toUpperCase()] = {
              beta: p.score.data?.beta,
              risk: p.score.risk,
              sector: p.sector,
              marketCap: p.score.data?.marketCap,
              subScores: { qualityScore: p.score.scores?.quality, piotroski: p.score.scores?.piotroski?.raw },
            };
          }
        });
        const allocPrices = {};
        enrichedPortfolio.forEach(p => {
          allocPrices[p.ticker] = { price: p.price, currency: p.currency };
        });
        const fxRatesForAlloc = parseFxRates(commoditiesRes);
        const allocation = analyzeAllocation(allocItems, allocScores, allocPrices, fxRatesForAlloc, riskProfile);
        const allocationText = allocationSummary(allocation);

        contextRef.current = {
          portfolio: enrichedPortfolio,
          portfolioSummary: {
            totalValue, totalCost,
            totalPl: totalPl != null ? Math.round(totalPl) : null,
            totalPlPct: totalPlPct != null ? +totalPlPct.toFixed(1) : null,
            holdingsWithShares: enrichedPortfolio.filter(p => p.shares > 0).length,
            totalHoldings: enrichedPortfolio.length,
            sectorBreakdown,
          },
          allocation: allocationText,
          indices: indicesRes.filter(i => i.price > 0),
          commodities: commoditiesRes.filter(c => c.price > 0),
          investorProfile: preferences.investorProfile || null,
          accountType: preferences.accountType || null,
          savedStrategy: preferences.investmentPlan?.text || null,
          savedTodos: (preferences.todos || []).filter(t => !t.done).map(t => t.text).slice(0, 5),
          topSuggestions: null,
        };

        // Fetch top suggestions
        try {
          const investorType = preferences.investorProfile?.investorType || "mixed";
          const sugRes = await fetch(`/api/suggestions?profile=${investorType}&limit=10`);
          const sugData = await sugRes.json();
          if (sugData?.suggestions) {
            contextRef.current.topSuggestions = sugData.suggestions.map(s => ({
              ticker: s.ticker, name: s.name, score: s.compositeScore,
              sector: s.sector, risk: s.risk,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch suggestions for chat:", err);
        }
      } catch (err) {
        console.error("Chat context load error:", err);
      }
    }

    loadContext();
    return () => { cancelled = true; };
  }, [chatOpen, session, userId, preferences.investorProfile]);

  return contextRef;
}
