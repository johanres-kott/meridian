import {
  Home, Car, Landmark, LifeBuoy, Package, FileText, TrendingUp, Hexagon,
  Egg, Wallet, Plane, GraduationCap, Gem, Ship, Gift, Vault,
} from "lucide-react";

// Ikon-mappningar enligt designsystemet (Lucide, stroke 1.5 — inga emoji).
// Komponenterna (KindIcon, IconBadge) bor i icons.jsx.

export const KIND_ICON = {
  bostad: Home, fordon: Car, sparkonto: Landmark, buffert: LifeBuoy, ovrigt: Package, vinstandel: Vault,
  bolan: Home, skuld: FileText, stock: TrendingUp, stocks: TrendingUp, fund: Hexagon,
  funds: Hexagon, pension: Egg, cash: Wallet, portfolio: TrendingUp,
};

// Färg per tillgångstyp — används av IconBadge i tabell, Min ekonomi och tillgångssidan
export const KIND_COLORS = {
  stock: "var(--brand)", stocks: "var(--brand)", portfolio: "var(--brand)",
  fund: "var(--green-400)", funds: "var(--green-400)",
  pension: "var(--pos)",
  bostad: "#7c4dff", fordon: "var(--warn)",
  sparkonto: "#26a69a", buffert: "#26a69a", cash: "#26a69a",
  vinstandel: "var(--gold-500)", ovrigt: "#8d6e63",
  bolan: "var(--neg)", skuld: "#ef6c00",
};

export const GOAL_ICONS = [
  { id: "buffert", Icon: LifeBuoy, label: "Buffert" },
  { id: "bostad", Icon: Home, label: "Bostad" },
  { id: "resa", Icon: Plane, label: "Resa" },
  { id: "bil", Icon: Car, label: "Bil" },
  { id: "studier", Icon: GraduationCap, label: "Studier" },
  { id: "brollop", Icon: Gem, label: "Bröllop" },
  { id: "bat", Icon: Ship, label: "Båt" },
  { id: "present", Icon: Gift, label: "Present" },
];
