// Familjeläge etapp 1 (FAMILY.md): familjemedlemmar som DATA under användarens
// eget konto — inga extra logins, ingen RLS-förändring. Finary-modellen:
// Ownership-steget i deras Add Asset-flöde är exakt det här ("fler medlemmar
// = familjeläge", PIVOT.md).
//
// Dual-write-principen: metadata.owners ({ me: 50, "<personId>": 50 },
// procent, summa ≤ 100) är den rika sanningen om ägande per rad. Vid varje
// spara speglas metadata.ownershipShare = owners.me — så att allt befintligt
// (effectiveValueSek, loanSharePct i kassaflödet, cron-snapshoten,
// NetWorthCard-badges) fortsätter fungera helt orört. "me" är alltid
// kontoägaren; rader utan owners-karta beter sig exakt som förut
// (ownershipShare eller 100 %).

export const ME_ID = "me";

// Ekonomityper — defaults för nya rader, aldrig tvingande lägen.
export const ECONOMY_TYPES = [
  { value: "gemensam", label: "Gemensam", desc: "Allt nytt delas lika" },
  { value: "blandad", label: "Blandad", desc: "Delat väljs per tillgång" },
  { value: "enskild", label: "Enskild", desc: "Allt nytt är ditt" },
];

export function newMemberId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Hushållets medlemmar med kontoägaren ("me") först. preferences.household
// .members exkluderar kontoägaren — me är implicit, visningsnamn =
// preferences.display_name eller "Du".
export function getMembers(preferences) {
  const name = preferences?.display_name || "Du";
  const others = Array.isArray(preferences?.household?.members) ? preferences.household.members : [];
  return [{ id: ME_ID, name }, ...others.filter(m => m && m.id && m.id !== ME_ID)];
}

export function memberName(members, id) {
  return members?.find(m => m.id === id)?.name || "Okänd person";
}

const clampPct = v => Math.min(100, Math.max(0, v));

// En medlems andel av en rad, i procent. owners-kartan gäller när den har
// en siffra för medlemmen; annars faller "me" tillbaka på det gamla
// metadata.ownershipShare ?? 100 (samma tolkning som effectiveValueSek)
// och övriga medlemmar på 0.
export function ownerShare(row, ownerId) {
  const owners = row?.metadata?.owners;
  if (owners && typeof owners === "object") {
    const raw = Number(owners[ownerId]);
    if (Number.isFinite(raw)) return clampPct(raw);
  }
  if (ownerId === ME_ID) {
    const raw = Number(row?.metadata?.ownershipShare);
    return Number.isFinite(raw) ? clampPct(raw) : 100;
  }
  return 0;
}

// Klampa varje andel till 0–100 och håll summan ≤ 100 — ett överskott
// skalas ner proportionellt så en felinmatning aldrig blåser upp totalen.
export function normalizeOwners(owners) {
  const out = {};
  for (const [id, v] of Object.entries(owners || {})) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    out[id] = clampPct(n);
  }
  const sum = Object.values(out).reduce((s, v) => s + v, 0);
  if (sum > 100) {
    const factor = 100 / sum;
    for (const id of Object.keys(out)) out[id] = Math.round(out[id] * factor * 100) / 100;
  }
  return out;
}

// Dual-write-hjälparen: sätter owners (normaliserad) OCH speglar
// ownershipShare = owners.me ?? 100 i samma metadata-objekt. Enda vägen
// att skriva owners — så kan spegeln aldrig glida isär från kartan.
export function withOwners(metadata, owners) {
  const normalized = normalizeOwners(owners);
  return { ...(metadata || {}), owners: normalized, ownershipShare: normalized[ME_ID] ?? 100 };
}

// Default-ägande för en NY rad utifrån hushållets ekonomityp.
// gemensam → jämnt fördelat över me + alla medlemmar (heltal, resten till de
// första); enskild/blandad → me: 100 (blandad väljs sedan per tillgång).
export function defaultOwnersFor(economyType, members) {
  const ids = (members || []).map(m => m.id);
  if (economyType === "gemensam" && ids.length > 1) {
    const n = ids.length;
    const base = Math.floor(100 / n);
    let rest = 100 - base * n;
    const out = {};
    for (const id of ids) {
      out[id] = base + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
    }
    return out;
  }
  return { [ME_ID]: 100 };
}

// Är radens ägande delat? (kontoägarens andel < 100 %) — styr när
// Min del/Hushållet-växeln alls är meningsfull.
export function isSharedRow(row) {
  return ownerShare(row, ME_ID) < 100;
}
