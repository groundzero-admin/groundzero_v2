import { useMemo, useState, useCallback } from "react";
import type { SkillGraph as SkillGraphData } from "@/api/hooks/useCompetencies";
import * as s from "./SkillGraph.css";

/* ── colour helpers ── */

const STAGE_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Beginner",
  3: "Developing",
  4: "Proficient",
  5: "Adept",
  6: "Advanced",
  7: "Expert",
  8: "Mastered",
};

function masteryFill(p: number): string {
  if (p >= 0.85) return "#276749"; // dark green
  if (p >= 0.65) return "#38A169"; // green
  if (p >= 0.50) return "#68D391"; // light green
  if (p >= 0.30) return "#ECC94B"; // yellow
  if (p >= 0.15) return "#ED8936"; // orange
  return "#E53E3E";                 // red
}

function masteryTextColor(p: number): string {
  if (p >= 0.50) return "#fff";
  if (p >= 0.30) return "#1A202C";
  return "#fff";
}

/* ── layout constants ── */

const NODE_W = 140;
const NODE_H = 52;
const NODE_PAD_X = 20;
const NODE_PAD_Y = 16;
const PILLAR_PAD = 30;
const PILLAR_HEADER = 40;
const CAP_HEADER = 26;
const CAP_GAP = 14;
const TOP_PAD = 20;
const COLS_PER_CAP = 2;

/* ── types ── */

interface NodePos {
  id: string;
  name: string;
  x: number;
  y: number;
  pillarColor: string;
  capName: string;
}

interface CompState {
  p_learned: number;
  stage: number;
  is_stuck: boolean;
  total_evidence: number;
  consecutive_failures: number;
}

interface Props {
  graph: SkillGraphData;
  studentStates: Record<string, CompState>;
  studentName: string;
}

interface TooltipData {
  x: number;
  y: number;
  node: NodePos;
  state: CompState | undefined;
}

export default function SkillGraph({ graph, studentStates }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  /* Build capability→pillar and competency→capability lookups */
  const { pillarMap, capMap } = useMemo(() => {
    const pm: Record<string, { name: string; color: string }> = {};
    for (const p of graph.pillars) pm[p.id] = { name: p.name, color: p.color };
    const cm: Record<string, { name: string; pillar_id: string }> = {};
    for (const c of graph.capabilities) {
      cm[c.id] = { name: c.name, pillar_id: c.pillar_id };
    }
    return { pillarMap: pm, capMap: cm };
  }, [graph]);

  /* Compute positions for every node, grouped by pillar→capability */
  const { nodes, pillarZones, svgW, svgH } = useMemo(() => {
    // Group competencies: pillar → capability → competencies
    const pillarOrder = ["communication", "creativity", "ai_systems", "math_logic"];
    type CapGroup = { capId: string; comps: typeof graph.competencies };
    type PillarGroup = { pillarId: string; caps: CapGroup[] };

    const groups: PillarGroup[] = [];
    const compByCap: Record<string, typeof graph.competencies> = {};
    for (const c of graph.competencies) {
      if (!compByCap[c.capability_id]) compByCap[c.capability_id] = [];
      compByCap[c.capability_id].push(c);
    }

    const capsByPillar: Record<string, string[]> = {};
    for (const cap of graph.capabilities) {
      if (!capsByPillar[cap.pillar_id]) capsByPillar[cap.pillar_id] = [];
      capsByPillar[cap.pillar_id].push(cap.id);
    }

    for (const pid of pillarOrder) {
      const capIds = capsByPillar[pid] ?? [];
      const caps: CapGroup[] = capIds.map((cid) => ({
        capId: cid,
        comps: compByCap[cid] ?? [],
      }));
      groups.push({ pillarId: pid, caps });
    }

    // Layout: pillars side by side, capabilities stacked vertically
    const nodeMap: NodePos[] = [];
    const zones: { x: number; y: number; w: number; h: number; color: string; name: string }[] = [];
    let curX = PILLAR_PAD;

    for (const pg of groups) {
      const pillar = pillarMap[pg.pillarId];
      const pillarX = curX;
      let pillarH = PILLAR_HEADER + TOP_PAD;
      let maxCapW = 0;

      for (const cg of pg.caps) {
        const cap = capMap[cg.capId];
        const nComps = cg.comps.length;
        const rows = Math.ceil(nComps / COLS_PER_CAP);
        const cols = Math.min(nComps, COLS_PER_CAP);
        const capW = cols * (NODE_W + NODE_PAD_X);
        if (capW > maxCapW) maxCapW = capW;

        for (let i = 0; i < nComps; i++) {
          const row = Math.floor(i / COLS_PER_CAP);
          const col = i % COLS_PER_CAP;
          nodeMap.push({
            id: cg.comps[i].id,
            name: cg.comps[i].name,
            x: pillarX + col * (NODE_W + NODE_PAD_X),
            y: pillarH + CAP_HEADER + row * (NODE_H + NODE_PAD_Y),
            pillarColor: pillar?.color ?? "#718096",
            capName: cap?.name ?? "",
          });
        }

        pillarH += CAP_HEADER + rows * (NODE_H + NODE_PAD_Y) + CAP_GAP;
      }

      const pillarW = Math.max(maxCapW, 180);
      zones.push({
        x: pillarX - 10,
        y: TOP_PAD,
        w: pillarW + 20,
        h: pillarH,
        color: pillar?.color ?? "#718096",
        name: pillar?.name ?? pg.pillarId,
      });

      curX += pillarW + PILLAR_PAD + 20;
    }

    const totalW = curX + PILLAR_PAD;
    const maxH = Math.max(...zones.map((z) => z.y + z.h)) + PILLAR_PAD;

    return { nodes: nodeMap, pillarZones: zones, svgW: totalW, svgH: maxH };
  }, [graph, pillarMap, capMap]);

  /* Node position lookup for edges */
  const nodePosMap = useMemo(() => {
    const m: Record<string, NodePos> = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }, [nodes]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, node: NodePos) => {
      setTooltip({
        x: e.clientX + 12,
        y: e.clientY - 10,
        node,
        state: studentStates[node.id],
      });
    },
    [studentStates],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className={s.root}>
      {/* Legend */}
      <div className={s.toolbar}>
        <div className={s.legend}>
          {[
            { label: "< 15%", color: "#E53E3E" },
            { label: "15-30%", color: "#ED8936" },
            { label: "30-50%", color: "#ECC94B" },
            { label: "50-65%", color: "#68D391" },
            { label: "65-85%", color: "#38A169" },
            { label: "> 85%", color: "#276749" },
          ].map((l) => (
            <span key={l.label} className={s.legendItem}>
              <span className={s.legendDot} style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
          <span className={s.legendItem}>
            <span
              className={s.legendDot}
              style={{ backgroundColor: "#CBD5E0", border: "1px dashed #A0AEC0" }}
            />
            No data
          </span>
        </div>
      </div>

      {/* Graph */}
      <div className={s.graphContainer} style={{ maxHeight: "70vh" }}>
        <svg
          width={svgW}
          height={svgH}
          style={{ display: "block", minWidth: svgW, minHeight: svgH }}
        >
          {/* Pillar zone backgrounds */}
          {pillarZones.map((z) => (
            <g key={z.name}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={12}
                fill={z.color}
                opacity={0.06}
                stroke={z.color}
                strokeWidth={1}
                strokeOpacity={0.2}
              />
              <text
                x={z.x + 12}
                y={z.y + 22}
                fontSize={14}
                fontWeight={700}
                fill={z.color}
                fontFamily="Nunito, sans-serif"
              >
                {z.name}
              </text>
            </g>
          ))}

          {/* Prerequisite edges */}
          {graph.prerequisite_edges.map((edge) => {
            const src = nodePosMap[edge.source_id];
            const tgt = nodePosMap[edge.target_id];
            if (!src || !tgt) return null;
            const sx = src.x + NODE_W / 2;
            const sy = src.y + NODE_H / 2;
            const tx = tgt.x + NODE_W / 2;
            const ty = tgt.y + NODE_H / 2;
            // Curved path
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;
            const dx = tx - sx;
            const dy = ty - sy;
            const cx = mx - dy * 0.15;
            const cy = my + dx * 0.15;
            return (
              <path
                key={`p-${edge.source_id}-${edge.target_id}`}
                d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                fill="none"
                stroke="#A0AEC0"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Codevelopment edges (dashed) */}
          {graph.codevelopment_edges.map((edge) => {
            const src = nodePosMap[edge.source_id];
            const tgt = nodePosMap[edge.target_id];
            if (!src || !tgt) return null;
            const sx = src.x + NODE_W / 2;
            const sy = src.y + NODE_H / 2;
            const tx = tgt.x + NODE_W / 2;
            const ty = tgt.y + NODE_H / 2;
            return (
              <line
                key={`c-${edge.source_id}-${edge.target_id}`}
                x1={sx}
                y1={sy}
                x2={tx}
                y2={ty}
                stroke="#805AD5"
                strokeWidth={1}
                strokeOpacity={0.3}
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX={10}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#A0AEC0" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => {
            const state = studentStates[node.id];
            const p = state?.p_learned ?? -1;
            const hasData = p >= 0;
            const fill = hasData ? masteryFill(p) : "#EDF2F7";
            const textColor = hasData ? masteryTextColor(p) : "#A0AEC0";
            const pctLabel = hasData ? `${Math.round(p * 100)}%` : "—";
            const isStuck = state?.is_stuck;

            return (
              <g
                key={node.id}
                onMouseEnter={(e) => handleMouseEnter(e, node)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={fill}
                  stroke={isStuck ? "#E53E3E" : node.pillarColor}
                  strokeWidth={isStuck ? 2.5 : 1.5}
                  strokeOpacity={isStuck ? 1 : 0.4}
                />
                {/* Node name — truncated */}
                <text
                  x={node.x + 8}
                  y={node.y + 20}
                  fontSize={11}
                  fontWeight={600}
                  fill={textColor}
                  fontFamily="Inter, sans-serif"
                >
                  {node.name.length > 18 ? node.name.slice(0, 17) + "..." : node.name}
                </text>
                {/* Score */}
                <text
                  x={node.x + 8}
                  y={node.y + 38}
                  fontSize={13}
                  fontWeight={700}
                  fill={textColor}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pctLabel}
                </text>
                {/* Stage label on right */}
                {hasData && state && (
                  <text
                    x={node.x + NODE_W - 8}
                    y={node.y + 38}
                    fontSize={9}
                    fontWeight={600}
                    fill={textColor}
                    textAnchor="end"
                    fontFamily="Inter, sans-serif"
                    opacity={0.8}
                  >
                    {STAGE_LABELS[state.stage] ?? `S${state.stage}`}
                  </text>
                )}
                {/* Stuck indicator */}
                {isStuck && (
                  <circle
                    cx={node.x + NODE_W - 6}
                    cy={node.y + 6}
                    r={5}
                    fill="#E53E3E"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className={s.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <div className={s.tooltipName}>{tooltip.node.name}</div>
          <div className={s.tooltipMeta}>
            {tooltip.node.capName}
            {tooltip.state ? (
              <>
                <br />
                P(Learned): {Math.round(tooltip.state.p_learned * 100)}%
                <br />
                Stage: {STAGE_LABELS[tooltip.state.stage] ?? tooltip.state.stage}
                <br />
                Evidence: {tooltip.state.total_evidence}
                {tooltip.state.is_stuck && (
                  <>
                    <br />
                    <span style={{ color: "#E53E3E", fontWeight: 700 }}>STUCK</span>
                    {" "}({tooltip.state.consecutive_failures} failures)
                  </>
                )}
              </>
            ) : (
              <>
                <br />
                No data yet
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
