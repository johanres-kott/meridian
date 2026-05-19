const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 16 };
const h2Style = { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 };
const h3Style = { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, marginTop: 16 };
const pStyle = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 };

export default function OwnershipDocs() {
  return (
    <div id="ownership" style={sectionStyle}>
      <div style={h2Style}>Ägarstruktur och aktieklasser</div>
      <p style={pStyle}>
        I Analys → Ägarstruktur visas free float, största ägare, röst/kapital-gap och spin-off-flagga
        för bolagen i din bevakningslista. Datan kommer från en kurerad svensk databas för .ST-tickers
        och från Yahoo Finance för utländska. Det här avsnittet förklarar de underliggande begreppen.
      </p>

      <div id="share-class" style={h3Style}>Svenska A- och B-aktier</div>
      <p style={pStyle}>
        De flesta större svenska börsnoterade bolag har två (ibland fler) aktieklasser med
        <strong style={{ color: "var(--text)" }}> samma rätt till utdelning och kapital</strong>,
        men olika röststyrka på bolagsstämman. A-aktien har typiskt <strong style={{ color: "var(--text)" }}>10 röster</strong>,
        B-aktien <strong style={{ color: "var(--text)" }}>1 röst</strong>. Vissa bolag har även C- eller
        D-aktier, oftast utan rösträtt eller med särskild utdelning (preferensaktier).
      </p>
      <p style={pStyle}>
        Strukturen tillåter grundarfamiljer och stiftelser att behålla röstmajoriteten utan att
        äga majoriteten av kapitalet — en svensk tradition som går tillbaka till sekelskiftet
        1900 och som har konsekvent stöd från lagstiftaren.
      </p>

      <div id="dual-class-consequences" style={h3Style}>Konsekvens för bolagsstyrning</div>
      <p style={pStyle}>
        Långsiktigt ägande möjliggörs. Sfärerna som äger merparten av Stockholmsbörsens stora bolag
        bygger i regel sina maktpositioner via A-aktier:
      </p>
      <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
        <li><strong style={{ color: "var(--text)" }}>Wallenbergsstiftelserna</strong> via Investor AB: Atlas Copco, SEB, Ericsson, AstraZeneca, ABB, Epiroc, Saab, Husqvarna, Electrolux, EQT, Sobi</li>
        <li><strong style={{ color: "var(--text)" }}>Lundbergs</strong>: Hufvudstaden, Industrivärden (vidare till Handelsbanken, Sandvik, Volvo, SCA)</li>
        <li><strong style={{ color: "var(--text)" }}>Stenbeckssfären</strong>: Kinnevik (Tele2, Millicom)</li>
        <li><strong style={{ color: "var(--text)" }}>Douglas/Latour-sfären</strong>: Securitas, Assa Abloy, Loomis, Sweco</li>
      </ul>
      <p style={pStyle}>
        Fördelen: strategier kan drivas över decennier utan att tvingas till kortsiktiga vinster
        av aktivistägare eller fientliga uppköp. Nackdelen: minoritetsägare har mindre att säga
        till om, och bolagsledningen är mindre disciplinerad av marknaden vid sämre prestation —
        det går inte att rösta bort en kontrollägare.
      </p>

      <div id="share-class-practical" style={h3Style}>Praktiskt för dig som investerare</div>
      <p style={pStyle}>
        Eftersom A- och B-aktier är samma bolag är utdelning, vinst per aktie, fundamenta och
        långsiktig avkastning identiska. Det som skiljer är:
      </p>
      <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
        <li><strong style={{ color: "var(--text)" }}>Likviditet:</strong> B-aktien har nästan alltid mer omsättning och tightare spread. Förstahandsval för retail.</li>
        <li><strong style={{ color: "var(--text)" }}>Pris:</strong> A-aktien handlas ibland med en liten premie för rösträtten, ibland med rabatt på grund av sämre likviditet. Gapet är typiskt 0–5%.</li>
        <li><strong style={{ color: "var(--text)" }}>Rösträtt:</strong> Spelar i praktiken roll bara för storägare. Som retailinvesterare med någon hundratusenkronors position påverkar du inte stämman oavsett klass.</li>
      </ul>

      <div id="share-class-international" style={h3Style}>Andra länder</div>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>USA:</strong> Förekommer framför allt hos techbolag och
        familjekontrollerade konglomerat — Meta (Mark Zuckerberg), Alphabet (Sergey Brin / Larry Page),
        Snap (Evan Spiegel), Berkshire Hathaway (Buffett-arvet). Tickerkonventionen varierar: GOOGL har
        rösträtt, GOOG inte; META erbjuder bara icke-röstberättigad klass A på börsen. Resten av
        amerikansk large-cap är mestadels singel-klass.
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>UK och Tyskland:</strong> Mestadels singel-klass enligt
        principen "one share, one vote". Brittiska Premium-segmentet förbjuder dubbel-klass
        helt sedan flera år.
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>Finland:</strong> Liknande system som Sverige men annan
        teckenkodning på Helsingforsbörsen. Wärtsilä handlas t.ex. som WRT1V.HE där "1V" markerar
        klass — inte som svenskt "-A"/"-B"-suffix. Vår dedup-logik fångar bara svenska .ST-tickers.
      </p>
      <p style={pStyle}>
        <strong style={{ color: "var(--text)" }}>Hong Kong och Kina:</strong> Förbjöd länge dubbel-klass
        helt men lättade på reglerna 2018 för att locka tillbaka kinesiska techbolag som flytt till
        amerikanska börser. Alibaba, JD.com och Xiaomi har idag dubbel-klass-strukturer i Hong Kong.
      </p>
    </div>
  );
}
