import { useMemo } from "react";
import { Sankey, ResponsiveContainer, Tooltip } from "recharts";
import { buildSankeyData } from "./cashflowSankey.js";

// Flödesgraf "Vart tar lönen vägen?" — copy with pride från Finarys
// budgetkalkylator: lön → Budget → kategorier → poster, med Amortering och
// Sparutrymme som gröna utlopp. Recharts Sankey (inget nytt beroende).

const fmtKr = v => `${Math.round(v).toLocaleString("sv-SE")} kr`;
const STRIPES = "url(#cfSankeyStripes)";

function Node({ x, y, width, height, payload }) {
  const col = payload.col ?? 0;
  const label = `${payload.name} · ${fmtKr(payload.value)}`;
  const approxW = label.length * 6.3 + 14;
  // Som Finary: inkomster får etiketten till höger (inne i flödet), alla
  // andra noder till vänster om noden — ovanpå det inkommande flödet.
  const rightSide = col === 0;
  const textX = rightSide ? x + width + 8 : x - 8;
  const pillX = rightSide ? textX - 6 : textX - approxW + 6;
  const fill = payload.striped ? STRIPES : payload.color;
  const cy = y + Math.max(height, 2) / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height, 2)} rx={3} fill={fill} />
      <rect x={pillX} y={cy - 10} width={approxW} height={20} rx={6}
        fill="var(--bg-card)" stroke="var(--border)" />
      <text x={textX} y={cy} dy={4} textAnchor={rightSide ? "start" : "end"}
        fontSize={11} fontFamily="var(--font-sans)" fill="var(--text)">{label}</text>
    </g>
  );
}

function Link({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }) {
  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none" strokeWidth={linkWidth} strokeOpacity={0.28}
      stroke={(payload.target?.kind === "budget" ? payload.source?.color : payload.target?.color) || "var(--border)"}
    />
  );
}

function TooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const name = p.name ?? (p.source && p.target ? `${p.source.name} → ${p.target.name}` : "");
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "var(--text)" }}>
      {name}: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmtKr(p.value)}/mån</span>
    </div>
  );
}

export default function CashflowSankey({ incomes, expenses, loans }) {
  const data = useMemo(() => buildSankeyData({ incomes, expenses, loans }), [incomes, expenses, loans]);
  if (data.empty) return null;
  const perCol = {};
  for (const n of data.nodes) perCol[n.col] = (perCol[n.col] || 0) + 1;
  const rows = Math.max(...Object.values(perCol));
  const height = Math.max(240, Math.min(640, rows * 44 + 32)); // plats för en etikett per nod

  return (
    <div style={{ width: "100%", height }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <pattern id="cfSankeyStripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--green-200)" />
            <rect width="3" height="6" fill="var(--pos)" />
          </pattern>
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes: data.nodes, links: data.links }}
          node={Node}
          link={Link}
          nodeWidth={8}
          nodePadding={24}
          linkCurvature={0.5}
          iterations={32}
          sort={false}
          margin={{ top: 10, right: 16, bottom: 10, left: 8 }}
        >
          <Tooltip content={<TooltipContent />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
