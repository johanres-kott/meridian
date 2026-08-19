import { Package } from "lucide-react";
import { KIND_ICON } from "./iconMaps.js";

// Ikonkomponenter enligt designsystemet: Lucide, stroke 1.5. Mappningar i
// iconMaps.js. Re-exporterar vanliga ikoner så vyer slipper importera
// lucide-react direkt.
export { Home, Car, Landmark, LifeBuoy, Package, FileText, TrendingUp, Hexagon, Egg, Wallet, PiggyBank, Target, Compass, Layers, Sparkles, Shield, Search, CircleDollarSign } from "lucide-react";
export { KIND_ICON, GOAL_ICONS } from "./iconMaps.js";

// Ikon för ett tillgångsslag, med fallback. size i px, stroke 1.5 enligt DS.
export function KindIcon({ kind, size = 16, color = "currentColor", style }) {
  const Icon = KIND_ICON[kind] || Package;
  return <Icon size={size} strokeWidth={1.5} color={color} style={style} aria-hidden />;
}

// Rund ikonbricka (tonad bakgrund) — används i tabellrader och listor.
export function IconBadge({ kind, Icon, color = "var(--brand)", size = 30, iconSize = 15 }) {
  const Cmp = Icon || KIND_ICON[kind] || Package;
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `color-mix(in srgb, ${color} 14%, transparent)`,
      display: "inline-flex", alignItems: "center", justifyContent: "center", color,
    }}>
      <Cmp size={iconSize} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
