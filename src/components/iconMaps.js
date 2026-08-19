import {
  Home, Car, Landmark, LifeBuoy, Package, FileText, TrendingUp, Hexagon,
  Egg, Wallet, Plane, GraduationCap, Gem, Ship, Gift,
} from "lucide-react";

// Ikon-mappningar enligt designsystemet (Lucide, stroke 1.5 — inga emoji).
// Komponenterna (KindIcon, IconBadge) bor i icons.jsx.

export const KIND_ICON = {
  bostad: Home, fordon: Car, sparkonto: Landmark, buffert: LifeBuoy, ovrigt: Package,
  bolan: Home, skuld: FileText, stock: TrendingUp, stocks: TrendingUp, fund: Hexagon,
  funds: Hexagon, pension: Egg, cash: Wallet, portfolio: TrendingUp,
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
