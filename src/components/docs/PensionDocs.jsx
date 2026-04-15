import { useState } from "react";

const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 16, marginBottom: 6 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };
const listStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 20, marginBottom: 8 };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const calloutStyle = (color) => ({
  background: `rgba(${color},0.06)`, border: `1px solid rgba(${color},0.15)`,
  borderRadius: 6, padding: 16, marginTop: 12, marginBottom: 12,
});

function PensionPillar({ icon, title, share, desc, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 160, background: `rgba(${color},0.06)`,
      border: `1px solid rgba(${color},0.15)`, borderRadius: 6, padding: 16,
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: `rgb(${color})`, fontWeight: 600, marginBottom: 6, ...mono }}>{share}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function AgeAllocationTable() {
  const rows = [
    { age: "25–35", stocks: "90–100%", bonds: "0–10%", note: "Lång tid kvar — maximera tillväxt" },
    { age: "35–45", stocks: "80–90%", bonds: "10–20%", note: "Fortfarande lång horisont" },
    { age: "45–55", stocks: "60–80%", bonds: "20–40%", note: "Börja trappa ner risk gradvis" },
    { age: "55–65", stocks: "40–60%", bonds: "40–60%", note: "Skydda kapitalet inför uttag" },
    { age: "65+", stocks: "20–40%", bonds: "60–80%", note: "Fokus på stabilitet och utdelning" },
  ];
  const thStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)" };
  const tdStyle = { fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", borderBottom: "1px solid var(--border)" };

  return (
    <div style={{ overflowX: "auto", marginTop: 8, marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          <th style={thStyle}>Ålder</th>
          <th style={thStyle}>Aktier</th>
          <th style={thStyle}>Räntor</th>
          <th style={thStyle}>Kommentar</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.age}>
              <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)", ...mono }}>{r.age}</td>
              <td style={{ ...tdStyle, color: "#089981", ...mono }}>{r.stocks}</td>
              <td style={{ ...tdStyle, color: "#5b9bd5", ...mono }}>{r.bonds}</td>
              <td style={tdStyle}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PensionFeeImpact() {
  const years = 35;
  const monthly = 2500;
  const returnPct = 7;
  const fees = [0, 0.2, 0.5, 1.0, 1.5];

  const calc = (fee) => {
    const r = (returnPct - fee) / 100 / 12;
    const n = years * 12;
    return r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
  };

  const maxVal = calc(0);

  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      <div style={{ ...pStyle, marginBottom: 12 }}>
        Simulering: <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {monthly.toLocaleString("sv-SE")} kr/mån</span> i <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {years} år</span> med <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
          {returnPct}% avkastning</span>
      </div>
      {fees.map(fee => {
        const val = calc(fee);
        const lost = calc(0) - val;
        const pct = (val / maxVal) * 100;
        const color = fee <= 0.2 ? "#089981" : fee <= 0.5 ? "#2196f3" : fee <= 1.0 ? "#ff9800" : "#f23645";
        return (
          <div key={fee} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Avgift <span style={{ ...mono, fontWeight: 500, color }}>{fee.toFixed(1)}%</span>
              </span>
              <span style={{ ...mono, fontWeight: 500, color: "var(--text)" }}>
                {Math.round(val).toLocaleString("sv-SE")} kr
                {lost > 0 && <span style={{ color: "#f23645", fontSize: 10, marginLeft: 6 }}>
                  −{Math.round(lost).toLocaleString("sv-SE")} kr
                </span>}
              </span>
            </div>
            <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Avgiften äter {Math.round(calc(0) - calc(1.0)).toLocaleString("sv-SE")} kr vid 1.0% avgift — pengar du aldrig ser.
      </div>
    </div>
  );
}

export default function PensionDocs() {
  const [openSection, setOpenSection] = useState(null);
  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  return (
    <>
      {/* Pensionens tre pelare */}
      <div id="pension" style={sectionStyle}>
        <div style={h2Style}>Pensionssparande i Sverige</div>
        <p style={pStyle}>
          Det svenska pensionssystemet har tre delar. Ju mer du förstår dem, desto bättre beslut kan du fatta
          om ditt framtida sparande.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, marginBottom: 16 }}>
          <PensionPillar
            icon="🏛️"
            title="Allmän pension"
            share="~55% av pensionen"
            desc="Inkomstpension (16%) + premiepension (2.5%). Staten sköter inkomstpensionen, du väljer fonder för premiepensionen."
            color="8,153,129"
          />
          <PensionPillar
            icon="🏢"
            title="Tjänstepension"
            share="~30% av pensionen"
            desc="Arbetsgivaren betalar in. ITP1 eller ITP2 för privatanställda. Du kan ofta välja hur den placeras."
            color="91,155,213"
          />
          <PensionPillar
            icon="🏦"
            title="Privat sparande"
            share="~15% av pensionen"
            desc="ISK, kapitalförsäkring, aktier, fonder. Det du sparar själv utöver pension."
            color="156,39,176"
          />
        </div>

        <div style={calloutStyle("8,153,129")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>💡 Viktigt att förstå</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Allmän pension + tjänstepension ger ofta bara 50–60% av slutlönen. Privat sparande behövs
            för att behålla sin levnadsstandard.
          </div>
        </div>
      </div>

      {/* Premiepensionen */}
      <div id="premiepension" style={sectionStyle}>
        <div style={h2Style}>Premiepensionen</div>
        <p style={pStyle}>
          2.5% av din pensionsgrundande inkomst går till premiepensionen. Du väljer själv hur pengarna
          placeras bland de fonder som finns på Pensionsmyndighetens fondtorg.
        </p>

        <div id="ap7" style={h3Style}>AP7 Såfa — statens defaultval</div>
        <p style={pStyle}>
          Om du inte gör ett aktivt val placeras pengarna i AP7 Såfa (Statens årskullsförvaltningsalternativ).
          Det är en generationsfond som automatiskt anpassar risken efter din ålder:
        </p>
        <ul style={listStyle}>
          <li><strong>AP7 Aktiefond</strong> — 100% aktier, hög risk, används för yngre sparare. Avgift: 0.05%.</li>
          <li><strong>AP7 Räntefond</strong> — räntor och obligationer, låg risk. Avgift: 0.05%.</li>
          <li>Såfa-modellen börjar trappa ner aktieandelen från 55 års ålder (från 100% till ~33% aktier vid 75).</li>
        </ul>

        <div style={calloutStyle("91,155,213")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>📊 Historisk avkastning AP7</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            AP7 Aktiefond har gett ca 10–12% per år i snitt sedan start (2010). Med en avgift på bara 0.05%
            är den svårslagen. Majoriteten av aktivt förvaltade fonder underpresterar AP7 på lång sikt.
          </div>
        </div>

        <div id="premie-strategy" style={h3Style}>Strategier för premiepensionen</div>
        <ol style={listStyle}>
          <li><strong>Behåll AP7 Såfa</strong> — fungerar utmärkt för de flesta. Extremt låg avgift, automatisk risktrappning.</li>
          <li><strong>Välj egna indexfonder</strong> — om du vill ha annan fördelning, t.ex. mer global exponering. Välj fonder med avgift under 0.4%.</li>
          <li><strong>Undvik aktivt förvaltade fonder</strong> — högre avgifter och sämre avkastning i snitt. SPIVA-studier visar att 80–90% av aktiva fonder underpresterar sitt index på 10+ år.</li>
        </ol>

        <div id="premie-how" style={h3Style}>Så byter du fonder</div>
        <ol style={listStyle}>
          <li>Logga in på <strong>minpension.se</strong> eller <strong>pensionsmyndigheten.se</strong> med BankID.</li>
          <li>Gå till "Premiepension" → "Byt fond".</li>
          <li>Sök efter fonder — prioritera låg avgift och brett index.</li>
          <li>Fondbytet genomförs inom 2–3 bankdagar.</li>
        </ol>
      </div>

      {/* Tjänstepension — ITP */}
      <div id="itp" style={sectionStyle}>
        <div style={h2Style}>Tjänstepension — ITP</div>
        <p style={pStyle}>
          ITP (Industrins och Handelns Tilläggspension) är den vanligaste tjänstepensionen för privatanställda
          tjänstemän. Det finns två varianter:
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200, background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>ITP1 — premiebestämd</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Födda 1979 eller senare</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              <li>Arbetsgivaren betalar in en procent av lönen</li>
              <li>4.5% på lön upp till 7.5 inkomstbasbelopp</li>
              <li>30% på lön över 7.5 inkomstbasbelopp</li>
              <li>Du väljer själv hur pengarna placeras</li>
              <li>Slutsumman beror på avkastning + avgifter</li>
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 200, background: "var(--bg-secondary)", borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>ITP2 — förmånsbestämd</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Födda 1978 eller tidigare</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              <li>Garanterad pension som andel av slutlönen</li>
              <li>10% av lön upp till 7.5 inkomstbasbelopp</li>
              <li>65% av lön mellan 7.5 och 20 basbelopp</li>
              <li>32.5% av lön mellan 20 och 30 basbelopp</li>
              <li>ITPK-delen (2%) kan du välja placering för</li>
            </ul>
          </div>
        </div>

        <div id="itp-collectum" style={h3Style}>Collectum — valcentralen</div>
        <p style={pStyle}>
          ITP-pensionen administreras av Collectum. Där gör du ditt val mellan försäkringsbolag
          och placeringsform. Du har två huvudval:
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, minWidth: 200, padding: 16, borderRadius: 6,
            border: "1px solid rgba(8,153,129,0.2)", background: "rgba(8,153,129,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#089981", marginBottom: 6 }}>Fondförsäkring</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              <li>Du väljer fonder själv</li>
              <li>Högre potentiell avkastning</li>
              <li>Ingen garanti — du bär risken</li>
              <li>Bra för yngre med lång horisont</li>
              <li>Välj globala indexfonder med låg avgift</li>
            </ul>
          </div>
          <div style={{
            flex: 1, minWidth: 200, padding: 16, borderRadius: 6,
            border: "1px solid rgba(91,155,213,0.2)", background: "rgba(91,155,213,0.04)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5b9bd5", marginBottom: 6 }}>Traditionell försäkring</div>
            <ul style={{ ...listStyle, fontSize: 11, marginBottom: 0 }}>
              <li>Försäkringsbolaget sköter placeringen</li>
              <li>Garanterad miniminivå</li>
              <li>Lägre men säkrare avkastning</li>
              <li>Bra nära pensionen</li>
              <li>Alecta är det vanligaste valet</li>
            </ul>
          </div>
        </div>

        <div id="itp-tips" style={h3Style}>Så väljer du ITP-placering</div>
        <ol style={listStyle}>
          <li>Logga in på <strong>collectum.se</strong> med BankID.</li>
          <li>Välj försäkringsbolag (t.ex. Avanza Pension, Nordnet, SEB, Länsförsäkringar).</li>
          <li>Välj fondförsäkring om du är under ~55 år och har lång tid kvar.</li>
          <li>Välj globala indexfonder med avgifter under 0.3% om möjligt.</li>
          <li>Diversifiera: t.ex. 70% global aktieindex, 20% Sverige-index, 10% räntefond.</li>
        </ol>

        <div style={calloutStyle("255,152,0")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>⚠️ Gör ett aktivt val!</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Om du inte gör ett val hamnar din ITP1-pension i en traditionell försäkring hos Alecta.
            Det är inte nödvändigtvis dåligt, men som ung med 30+ års horisont kan fondförsäkring ge
            betydligt mer i slutändan.
          </div>
        </div>
      </div>

      {/* Avgiftens påverkan */}
      <div id="pension-fees" style={sectionStyle}>
        <div style={h2Style}>Avgiftens påverkan på pensionen</div>
        <p style={pStyle}>
          I pensionssparande multipliceras avgiftens effekt kraftigt eftersom tidshorisonten är så lång.
          En till synes liten skillnad i avgift kan kosta hundratusentals kronor.
        </p>
        <PensionFeeImpact />
      </div>

      {/* Åldersanpassad allokering */}
      <div id="pension-allocation" style={sectionStyle}>
        <div style={h2Style}>Åldersanpassad placering</div>
        <p style={pStyle}>
          En vanlig tumregel är att din andel räntor/obligationer bör motsvara ungefär din ålder i procent.
          Här är en mer nyanserad riktlinje:
        </p>
        <AgeAllocationTable />
        <p style={pStyle}>
          AP7 Såfa följer en liknande modell automatiskt. Om du väljer egna fonder behöver du
          själv justera fördelningen över tid.
        </p>

        <div id="pension-rules" style={h3Style}>Tumregler för pensionssparande</div>
        <ul style={listStyle}>
          <li><strong>Börja tidigt</strong> — ränta-på-ränta-effekten är enorm över 30+ år.</li>
          <li><strong>Håll avgifterna nere</strong> — 0.2% vs 1.5% kan skilja miljoner över ett yrkesliv.</li>
          <li><strong>Välj breda indexfonder</strong> — global diversifiering minskar risk utan att sänka förväntad avkastning.</li>
          <li><strong>Gör ditt val</strong> — defaultval (Alecta trad) är ok men sällan optimalt för unga.</li>
          <li><strong>Kolla varje år</strong> — justera allokering och se till att avgifterna inte smygit uppåt.</li>
          <li><strong>Samla din pension</strong> — använd minpension.se för att se helheten.</li>
        </ul>

        <div style={calloutStyle("8,153,129")}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>📌 Sammanfattning</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Premiepension:</strong> AP7 Såfa är svårslagen. Gör inget om du inte har en tydlig plan.<br />
            <strong>ITP1:</strong> Välj fondförsäkring med globala indexfonder om du har 15+ år kvar till pension.<br />
            <strong>ITP2/ITPK:</strong> Samma logik — indexfonder med låga avgifter.<br />
            <strong>Privat:</strong> ISK med breda indexfonder. Spara minst 10% av nettolönen.
          </div>
        </div>
      </div>
    </>
  );
}
