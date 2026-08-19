// Fältdefinitioner per manuell tillgångstyp — används av tillgångssidan
// (ManualAssetView) för att visa och redigera metadata med svenska etiketter.
// type: text | number | date | select | money | percent | kr-per-month

const PROPERTY_TYPES = [
  { value: "lagenhet", label: "Lägenhet" },
  { value: "villa", label: "Villa" },
  { value: "radhus", label: "Radhus" },
  { value: "fritidshus", label: "Fritidshus" },
];
const VEHICLE_TYPES = [
  { value: "bil", label: "Bil" },
  { value: "mc", label: "MC" },
  { value: "husbil", label: "Husbil" },
  { value: "husvagn", label: "Husvagn" },
  { value: "bat", label: "Båt" },
];
const FINANCING = [
  { value: "kontant", label: "Kontant" },
  { value: "lan", label: "Lån" },
  { value: "leasing", label: "Leasing" },
];

export const KIND_LABELS = {
  bostad: "Bostad", fordon: "Fordon", sparkonto: "Sparkonto", buffert: "Buffert",
  vinstandel: "Vinstandelsstiftelse", ovrigt: "Övrig tillgång", bolan: "Bolån", skuld: "Skuld",
};

export const VALUE_LABELS = {
  bostad: "Bostadens värde", fordon: "Fordonets värde", sparkonto: "Saldo", buffert: "Saldo",
  vinstandel: "Totalt värde", ovrigt: "Uppskattat värde", bolan: "Kvarvarande skuld", skuld: "Kvarvarande skuld",
};

export const FIELDS_BY_KIND = {
  bostad: [
    { key: "ownershipShare", label: "Din ägarandel", type: "percent", placeholder: "100" },
    { key: "propertyType", label: "Typ", type: "select", options: PROPERTY_TYPES },
    { key: "address", label: "Adress", type: "text" },
    { key: "livingArea", label: "Boyta", type: "number", unit: "m²" },
    { key: "buildYear", label: "Byggår", type: "text" },
    { key: "purchasePrice", label: "Köpeskilling", type: "money" },
    { key: "purchaseDate", label: "Köpdatum", type: "date" },
    { key: "downPayment", label: "Kontantinsats", type: "money" },
    { key: "pantbrev", label: "Pantbrev", type: "money" },
  ],
  fordon: [
    { key: "ownershipShare", label: "Din ägarandel", type: "percent", placeholder: "100" },
    { key: "vehicleType", label: "Typ", type: "select", options: VEHICLE_TYPES },
    { key: "financing", label: "Finansiering", type: "select", options: FINANCING },
    { key: "regNumber", label: "Regnummer", type: "text" },
    { key: "modelYear", label: "Årsmodell", type: "text" },
    { key: "mileage", label: "Miltal", type: "number", unit: "mil" },
    { key: "purchasePrice", label: "Inköpspris", type: "money" },
    { key: "purchaseDate", label: "Köpdatum", type: "date" },
    { key: "monthlyCost", label: "Månadskostnad (leasing)", type: "kr-per-month" },
  ],
  bolan: [
    { key: "ownershipShare", label: "Din andel av lånet", type: "percent", placeholder: "100" },
    { key: "lender", label: "Långivare", type: "text" },
    { key: "interestRate", label: "Ränta", type: "percent" },
    { key: "startDate", label: "Lånet togs", type: "date" },
  ],
  skuld: [
    { key: "ownershipShare", label: "Din andel av lånet", type: "percent", placeholder: "100" },
    { key: "lender", label: "Långivare", type: "text" },
    { key: "interestRate", label: "Ränta", type: "percent" },
    { key: "startDate", label: "Lånet togs", type: "date" },
  ],
  vinstandel: [
    { key: "provider", label: "Stiftelse / förvaltare", type: "text" },
    { key: "lockYears", label: "Låstid per årgång", type: "number", unit: "år" },
  ],
  sparkonto: [
    { key: "ownershipShare", label: "Din andel", type: "percent", placeholder: "100" },
    { key: "bank", label: "Bank", type: "text" },
    { key: "interestRate", label: "Sparränta", type: "percent" },
  ],
  buffert: [
    { key: "bank", label: "Bank", type: "text" },
    { key: "interestRate", label: "Sparränta", type: "percent" },
  ],
  ovrigt: [
    { key: "ownershipShare", label: "Din ägarandel", type: "percent", placeholder: "100" },
    { key: "note", label: "Anteckning", type: "text" },
    { key: "startDate", label: "Ägt sedan", type: "date" },
  ],
};

const fmtNum = (v) => Number(v).toLocaleString("sv-SE", { maximumFractionDigits: 2 });

export function formatFieldValue(field, value) {
  if (value == null || value === "") return null;
  switch (field.type) {
    case "select": return field.options.find(o => o.value === value)?.label ?? String(value);
    case "money": return `${Math.round(Number(value)).toLocaleString("sv-SE")} kr`;
    case "kr-per-month": return `${Math.round(Number(value)).toLocaleString("sv-SE")} kr/mån`;
    case "percent": return `${String(value).replace(".", ",")} %`;
    case "number": return `${fmtNum(value)}${field.unit ? ` ${field.unit}` : ""}`;
    case "date": return String(value);
    default: return String(value);
  }
}

// Inmatad sträng → lagrat värde (null om tomt). Tal parsas med svensk decimal.
export function parseFieldInput(field, raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (["money", "kr-per-month", "percent", "number"].includes(field.type)) {
    const n = parseFloat(s.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return s;
}

// Lagrat värde → inmatad sträng
export function fieldToInput(field, value) {
  if (value == null) return "";
  if (["money", "kr-per-month", "number"].includes(field.type)) return String(value);
  if (field.type === "percent") return String(value).replace(".", ",");
  return String(value);
}
