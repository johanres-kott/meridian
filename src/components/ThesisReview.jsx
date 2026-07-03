import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext.jsx";
import { sanitizeInput } from "../lib/sanitize.js";
import {
  computeReturnPct,
  monthsBetween,
  classifyHolding,
  summarizePortfolio,
  DEFAULT_THRESHOLD_PCT,
  DEFAULT_REVIEW_MONTHS,
} from "../lib/thesisReview.js";

const STATUS_COLORS = {
  active: { bg: "rgba(8,153,129,0.12)", fg: "#089981" },
  weakening: { bg: "rgba(255,152,0,0.15)", fg: "#ff9800" },
  broken: { bg: "rgba(242,54,69,0.15)", fg: "#f23645" },
};

export default function ThesisReview({ items, prices = {}, onUpdate, onSelect, isMobile }) {
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useUser();

  const thresholdPct = preferences.thesisThresholdPct ?? DEFAULT_THRESHOLD_PCT;
  const reviewMonths = preferences.thesisReviewMonths ?? DEFAULT_REVIEW_MONTHS;

  // Only stock-type holdings; funds don't have a "thesis" in this sense.
  const stocks = useMemo(
    () => items.filter(i => i.type !== "fund"),
    [items]
  );

  // Enrich each holding with returnPct + monthsSinceReview for classification.
  const enriched = useMemo(() => {
    return stocks.map(item => {
      const price = prices[item.ticker]?.price ?? null;
      const returnPct = computeReturnPct(item.gav, price);
      const monthsSinceReview = item.thesis_reviewed_at
        ? monthsBetween(item.thesis_reviewed_at)
        : null;
      const category = classifyHolding(
        { returnPct, thesisStatus: item.thesis_status, monthsSinceReview },
        { thresholdPct, reviewMonths }
      );
      return { item, returnPct, monthsSinceReview, category, currentPrice: price };
    });
  }, [stocks, prices, thresholdPct, reviewMonths]);

  const summary = useMemo(
    () => summarizePortfolio(enriched, { thresholdPct, reviewMonths }),
    [enriched, thresholdPct, reviewMonths]
  );

  // Sort: action-needed first (stale winners/losers), then by abs(return), then by name
  const sorted = useMemo(() => {
    const priority = { winner_stale: 0, loser_stale: 1, winner_fresh: 2, loser_fresh: 3, neutral: 4 };
    return enriched.slice().sort((a, b) => {
      const pa = priority[a.category];
      const pb = priority[b.category];
      if (pa !== pb) return pa - pb;
      return Math.abs(b.returnPct ?? 0) - Math.abs(a.returnPct ?? 0);
    });
  }, [enriched]);

  if (stocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)", fontSize: 13 }}>
        {t("thesisReview.noStocks")}
      </div>
    );
  }

  return (
    <div>
      <DispositionNudge
        summary={summary}
        thresholdPct={thresholdPct}
        reviewMonths={reviewMonths}
        onThresholdChange={pct => updatePreferences({ thesisThresholdPct: pct })}
        isMobile={isMobile}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {sorted.map(row => (
          <ThesisCard
            key={row.item.id}
            row={row}
            reviewMonths={reviewMonths}
            onUpdate={onUpdate}
            onSelect={onSelect}
            isMobile={isMobile}
          />
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
        {t("thesisReview.disclaimer", { thresholdPct, reviewMonths })}
      </div>
    </div>
  );
}

function DispositionNudge({ summary, thresholdPct, reviewMonths, onThresholdChange, isMobile }) {
  const { t } = useTranslation();
  const { counts, avgWinnerReturnPct, avgLoserReturnPct } = summary;
  const hasWinnerWarning = counts.winner_stale > 0;
  const hasLoserWarning = counts.loser_stale > 0;

  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(String(thresholdPct));

  function saveThreshold() {
    const n = parseFloat(thresholdInput);
    if (!Number.isFinite(n) || n <= 0 || n > 200) {
      setThresholdInput(String(thresholdPct));
      setEditingThreshold(false);
      return;
    }
    onThresholdChange(n);
    setEditingThreshold(false);
  }

  return (
    <div style={{
      padding: isMobile ? 14 : 18, borderRadius: 8,
      background: "var(--bg-card)", border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
            {t("thesisReview.sectionTitle")}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {t("thesisReview.sectionSubtitle")}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
          <span>{t("thesisReview.thresholdLabel")}</span>
          {editingThreshold ? (
            <>
              <input
                type="number"
                value={thresholdInput}
                onChange={e => setThresholdInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveThreshold(); if (e.key === "Escape") { setThresholdInput(String(thresholdPct)); setEditingThreshold(false); } }}
                autoFocus
                style={{ width: 56, padding: "3px 6px", border: "1px solid var(--accent)", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}
              />
              <button onClick={saveThreshold}
                style={{ fontSize: 10, padding: "3px 8px", border: "none", borderRadius: 3, background: "#2962ff", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                OK
              </button>
            </>
          ) : (
            <button onClick={() => { setThresholdInput(String(thresholdPct)); setEditingThreshold(true); }}
              style={{ fontSize: 11, padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 3, background: "var(--bg-card)", color: "var(--text)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              ±{thresholdPct}%
            </button>
          )}
        </div>
      </div>

      {/* Warnings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {hasWinnerWarning && (
          <NudgeRow
            tone="warning"
            title={t("thesisReview.winnerWarningTitle", { count: counts.winner_stale, months: reviewMonths })}
            body={t("thesisReview.winnerWarningBody", { threshold: thresholdPct })}
          />
        )}
        {hasLoserWarning && (
          <NudgeRow
            tone="danger"
            title={t("thesisReview.loserWarningTitle", { count: counts.loser_stale })}
            body={t("thesisReview.loserWarningBody", { threshold: thresholdPct })}
          />
        )}
        {!hasWinnerWarning && !hasLoserWarning && counts.winner_fresh + counts.loser_fresh > 0 && (
          <NudgeRow
            tone="ok"
            title={t("thesisReview.allGoodTitle")}
            body={t("thesisReview.allGoodBody")}
          />
        )}
      </div>

      {/* Aggregate numbers */}
      {(avgWinnerReturnPct != null || avgLoserReturnPct != null) && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-light)", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {avgWinnerReturnPct != null && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("thesisReview.avgWinner")}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#089981", fontFamily: "'IBM Plex Mono', monospace" }}>
                +{avgWinnerReturnPct.toFixed(1)}%
              </div>
            </div>
          )}
          {avgLoserReturnPct != null && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("thesisReview.avgLoser")}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#f23645", fontFamily: "'IBM Plex Mono', monospace" }}>
                {avgLoserReturnPct.toFixed(1)}%
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("thesisReview.toReview")}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {counts.winner_stale + counts.loser_stale}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NudgeRow({ tone, title, body }) {
  const palette = {
    warning: { bg: "rgba(255,152,0,0.10)", border: "rgba(255,152,0,0.4)", fg: "#ff9800" },
    danger: { bg: "rgba(242,54,69,0.08)", border: "rgba(242,54,69,0.35)", fg: "#f23645" },
    ok: { bg: "rgba(8,153,129,0.08)", border: "rgba(8,153,129,0.3)", fg: "#089981" },
  }[tone];

  return (
    <div style={{
      padding: "10px 12px", borderRadius: 6,
      background: palette.bg, border: `1px solid ${palette.border}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: palette.fg, marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  );
}

function ThesisCard({ row, reviewMonths, onUpdate, onSelect, isMobile }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const { item, returnPct, monthsSinceReview, category, currentPrice } = row;
  const [thesisText, setThesisText] = useState(item.thesis_text || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [status, setStatus] = useState(item.thesis_status || null);

  async function persistUpdate(updates) {
    if (!onUpdate) return;
    setSaving(true);
    // Parent (Portfolio.updateItem) handles both the Supabase write and the
    // React state update — never mutate `item` directly since it comes in as
    // a (frozen) prop in React 19.
    await onUpdate(item.id, updates);
    setSaving(false);
  }

  async function saveThesis() {
    const reviewedAt = new Date().toISOString();
    await persistUpdate({
      thesis_text: sanitizeInput(thesisText),
      thesis_reviewed_at: reviewedAt,
      thesis_status: status || "active",
    });
    setEditing(false);
  }

  async function setStatusAndPersist(newStatus) {
    setStatus(newStatus);
    await persistUpdate({
      thesis_status: newStatus,
      thesis_reviewed_at: new Date().toISOString(),
    });
  }

  const needsReview = category === "winner_stale" || category === "loser_stale";
  const cardBorder = needsReview
    ? (category === "loser_stale" ? "rgba(242,54,69,0.35)" : "rgba(255,152,0,0.4)")
    : "var(--border)";

  const monthsLabel = monthsSinceReview == null
    ? t("thesisReview.neverReviewed")
    : monthsSinceReview < 1
      ? t("thesisReview.reviewedRecently")
      : t("thesisReview.reviewedMonthsAgo", { months: Math.round(monthsSinceReview) });

  const monthsColor = monthsSinceReview == null || monthsSinceReview >= reviewMonths
    ? "#ff9800"
    : "var(--text-muted)";

  return (
    <div style={{
      background: "var(--bg-card)", border: `1px solid ${cardBorder}`,
      borderRadius: 6, padding: isMobile ? 14 : 18,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            onClick={() => onSelect?.(item)}
            style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
          >
            {item.name || item.ticker}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {item.ticker}
            {item.shares > 0 && item.gav && (
              <span style={{ marginLeft: 8 }}>· {t("thesisReview.sharesAt", { shares: item.shares, gav: item.gav.toLocaleString(numberLocale, { maximumFractionDigits: 2 }) })}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {returnPct != null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("thesisReview.sincePurchase")}</div>
              <div style={{
                fontSize: 15, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
                color: returnPct >= 0 ? "#089981" : "#f23645",
              }}>
                {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
              </div>
              {currentPrice != null && (
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {currentPrice.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("thesisReview.reviewHeader")}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: monthsColor }}>
              {monthsLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {["active", "weakening", "broken"].map(s => {
          const isActive = status === s;
          const pal = STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setStatusAndPersist(s)}
              disabled={saving}
              style={{
                padding: "4px 10px",
                fontSize: 11, fontWeight: isActive ? 600 : 500,
                border: `1px solid ${isActive ? pal.fg : "var(--border)"}`,
                borderRadius: 12,
                background: isActive ? pal.bg : "var(--bg-card)",
                color: isActive ? pal.fg : "var(--text-secondary)",
                cursor: saving ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {t(`thesisReview.status_${s}`)}
            </button>
          );
        })}
      </div>

      {/* Thesis text */}
      {editing ? (
        <div>
          <textarea
            value={thesisText}
            onChange={e => setThesisText(e.target.value)}
            autoFocus
            placeholder={t("thesisReview.thesisPlaceholder")}
            style={{ width: "100%", minHeight: 100, padding: "10px 12px", border: "1px solid var(--accent)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              style={{ fontSize: 11, padding: "3px 8px", border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
            >
              {t(showQuestions ? "thesisReview.hideQuestionsBtn" : "thesisReview.showQuestionsBtn")}
            </button>
            {showQuestions && (
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {["reviewQ1", "reviewQ2", "reviewQ3", "reviewQ4"].map((key, i) => (
                  <li key={i}>{t(`thesisReview.${key}`)}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={saveThesis}
              disabled={saving}
              style={{ fontSize: 11, padding: "6px 14px", border: "none", borderRadius: 4, background: "#2962ff", color: "#fff", cursor: saving ? "default" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
            >
              {t(saving ? "thesisReview.saving" : "thesisReview.saveAndMarkReviewed")}
            </button>
            <button
              onClick={() => { setThesisText(item.thesis_text || ""); setEditing(false); }}
              disabled={saving}
              style={{ fontSize: 11, padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit" }}
            >
              {t("thesisReview.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: 13, lineHeight: 1.55,
            color: thesisText ? "var(--text)" : "var(--text-muted)",
            whiteSpace: "pre-wrap", minHeight: 24,
          }}>
            {thesisText || t("thesisReview.noThesisText")}
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{ marginTop: 8, fontSize: 11, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 3, background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit", color: "var(--text)" }}
          >
            {t(thesisText ? "thesisReview.editThesisBtn" : "thesisReview.writeThesisBtn")}
          </button>
        </div>
      )}
    </div>
  );
}
