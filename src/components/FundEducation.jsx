import { useState } from "react";

function FeeCalculator() {
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
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Avgiftens påverkan</div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Startbelopp</label>
          <select value={amount} onChange={e => setAmount(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
            <option value={50000}>50 000 kr</option>
            <option value={100000}>100 000 kr</option>
            <option value={500000}>500 000 kr</option>
            <option value={1000000}>1 000 000 kr</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Sparhorisont</label>
          <select value={years} onChange={e => setYears(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text)", fontFamily: "inherit" }}>
            <option value={5}>5 år</option>
            <option value={10}>10 år</option>
            <option value={20}>20 år</option>
            <option value={30}>30 år</option>
            <option value={40}>40 år</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Årlig avkastning (före avgift)</label>
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
                <span style={{ color: "var(--text-secondary)", width: 80 }}>{fee.toFixed(1)}% avgift</span>
                <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
                  {Math.round(value).toLocaleString("sv-SE")} kr
                </span>
                <span style={{ ...mono, fontSize: 11, color: "#f23645", width: 120, textAlign: "right" }}>
                  {lost > 0 ? `−${Math.round(lost).toLocaleString("sv-SE")} kr` : ""}
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
        Röd siffra = så mycket kostar avgiften dig jämfört med 0.2%. Ränta-på-ränta gör att små skillnader blir stora över tid.
      </div>
    </div>
  );
}

export default function FundEducation() {
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
        Förstå fonder — passiv vs aktiv, avgifter & betyg
      </summary>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Passive vs Active */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Passiv (index) vs aktiv förvaltning</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ color: "var(--text)" }}>Indexfonder (passiva)</strong> följer ett index, t.ex. OMXS30 eller MSCI World. De försöker inte slå marknaden — de <em>är</em> marknaden. Avgiften är låg (ofta 0.1–0.4%) eftersom ingen förvaltare behöver fatta aktiva beslut.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ color: "var(--text)" }}>Aktiva fonder</strong> har en förvaltare som väljer vilka bolag som ska ingå. Målet är att slå index. Avgiften är högre (ofta 0.8–1.5%) för att betala förvaltarens arbete.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Vad säger forskningen?</strong> Enligt William Sharpes lag (1991) måste det genomsnittliga resultatet för aktiva fonder vara sämre än index — med exakt avgiftsskillnaden. S&P:s SPIVA-mätningar bekräftar detta: ca 85–90% av aktiva fonder underpresterar sitt index över 10 år. Det betyder inte att alla aktiva fonder är dåliga, men oddsen är emot dig.
            </p>
          </div>
        </div>

        {/* Fee impact */}
        <FeeCalculator />

        {/* Star rating */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Morningstar-betyg</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              Betyget (1–5 stjärnor) baseras på <em>riskjusterad historisk avkastning</em> jämfört med fonder i samma kategori. 5 stjärnor = topp 10%, 1 stjärna = botten 10%.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Viktigt:</strong> Betyget tittar bakåt, inte framåt. En fond med 5 stjärnor har presterat bra historiskt, men det garanterar inte framtida avkastning. Avgiften är ofta en bättre prediktor för framtida resultat.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "rgba(8,153,129,0.06)", border: "1px solid rgba(8,153,129,0.2)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 8 }}>Tumregler</div>
          <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Jämför alltid avgiften — det är det enda du kan kontrollera</li>
            <li>En indexfond med 0.2% avgift behöver ingen förvaltare som "slår marknaden"</li>
            <li>Väljer du aktivt förvaltad fond — kräv att den historiskt slagit index <em>efter</em> avgifter</li>
            <li>Sprid riskerna: blanda geografi (Sverige + Global) och tillgångsslag (aktier + räntor)</li>
            <li>Lång sparhorisont? Mer aktier. Kort? Mer räntor.</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
