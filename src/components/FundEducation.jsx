import { useState } from "react";
import { useTranslation } from "react-i18next";

function FeeCalculator() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "en" ? "en-GB" : "sv-SE";
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(20);
  const [returnPct, setReturnPct] = useState(8);

  const fees = [0.2, 0.5, 1.0, 1.5, 2.0];

  function calcValue(fee) {
    const netReturn = (returnPct - fee) / 100;
    return amount * Math.pow(1 + netReturn, years);
  }

  const maxValue = calcValue(0);
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>{t("fundEducation.feeCalculator.title")}</div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>{t("fundEducation.feeCalculator.labelAmount")}</label>
          <select value={amount} onChange={e => setAmount(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
            <option value={50000}>{t("fundEducation.feeCalculator.amount50k")}</option>
            <option value={100000}>{t("fundEducation.feeCalculator.amount100k")}</option>
            <option value={500000}>{t("fundEducation.feeCalculator.amount500k")}</option>
            <option value={1000000}>{t("fundEducation.feeCalculator.amount1m")}</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>{t("fundEducation.feeCalculator.labelHorizon")}</label>
          <select value={years} onChange={e => setYears(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
            <option value={5}>{t("fundEducation.feeCalculator.years", { n: 5 })}</option>
            <option value={10}>{t("fundEducation.feeCalculator.years", { n: 10 })}</option>
            <option value={20}>{t("fundEducation.feeCalculator.years", { n: 20 })}</option>
            <option value={30}>{t("fundEducation.feeCalculator.years", { n: 30 })}</option>
            <option value={40}>{t("fundEducation.feeCalculator.years", { n: 40 })}</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>{t("fundEducation.feeCalculator.labelReturn")}</label>
          <select value={returnPct} onChange={e => setReturnPct(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
            <option value={5}>5%</option>
            <option value={7}>7%</option>
            <option value={8}>8%</option>
            <option value={10}>10%</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fees.map(fee => {
          const value = calcValue(fee);
          const lost = maxValue - value;
          const pctOfMax = (value / maxValue) * 100;
          const isLow = fee <= 0.5;
          return (
            <div key={fee}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: "var(--text-secondary)", width: 80 }}>{t("fundEducation.feeCalculator.feeLabel", { fee: fee.toFixed(1) })}</span>
                <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
                  {Math.round(value).toLocaleString(numberLocale)} kr
                </span>
                <span style={{ ...mono, fontSize: 11, color: "#f23645", width: 120, textAlign: "right" }}>
                  {lost > 0 ? `−${Math.round(lost).toLocaleString(numberLocale)} kr` : ""}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pctOfMax}%`,
                  background: isLow ? "#089981" : fee >= 1.5 ? "#f23645" : "#ff9800",
                  borderRadius: 4,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10 }}>
        {t("fundEducation.feeCalculator.note")}
      </div>
    </div>
  );
}

export default function FundEducation() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={e => setOpen(e.currentTarget.open)}
      style={{ marginBottom: 20 }}
    >
      <summary style={{
        fontSize: 13, fontWeight: 500, color: "var(--accent)", cursor: "pointer",
        userSelect: "none", padding: "8px 0",
      }}>
        {t("fundEducation.summary")}
      </summary>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Passive vs Active */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{t("fundEducation.passive.title")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ color: "var(--text)" }}>{t("fundEducation.passive.indexLabel")}</strong>{t("fundEducation.passive.indexDesc")}
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ color: "var(--text)" }}>{t("fundEducation.passive.activeLabel")}</strong>{t("fundEducation.passive.activeDesc")}
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>{t("fundEducation.passive.researchLabel")}</strong>{t("fundEducation.passive.researchDesc")}
            </p>
          </div>
        </div>

        {/* Fee impact */}
        <FeeCalculator />

        {/* Star rating */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{t("fundEducation.morningstar.title")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              {t("fundEducation.morningstar.desc1")}
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>{t("fundEducation.morningstar.importantLabel")}</strong>{t("fundEducation.morningstar.importantDesc")}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "rgba(8,153,129,0.06)", border: "1px solid rgba(8,153,129,0.2)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 8 }}>{t("fundEducation.tips.title")}</div>
          <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>{t("fundEducation.tips.tip1")}</li>
            <li>{t("fundEducation.tips.tip2")}</li>
            <li>{t("fundEducation.tips.tip3")}</li>
            <li>{t("fundEducation.tips.tip4")}</li>
            <li>{t("fundEducation.tips.tip5")}</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
