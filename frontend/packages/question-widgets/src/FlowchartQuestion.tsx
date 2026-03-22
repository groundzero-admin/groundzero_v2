import { useState, useMemo, useEffect } from "react";
import dagre from "@dagrejs/dagre";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeType = "start" | "end" | "process" | "decision";
type NodeState = "preset" | "empty" | "filled" | "active" | "correct" | "wrong";

interface FlowNode {
  id: string;
  type: NodeType;
  label?: string;
  blank?: boolean;
  correct?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

// ─── Node dimensions ─────────────────────────────────────────────────────────

const NW: Record<NodeType, number> = { start: 100, end: 100, process: 120, decision: 110 };
const NH: Record<NodeType, number> = { start: 34,  end: 34,  process: 38,  decision: 54  };

// ─── Dagre layout ────────────────────────────────────────────────────────────

interface LayoutResult {
  nodes: Map<string, { x: number; y: number; w: number; h: number }>;
  edges: Map<string, { points: { x: number; y: number }[] }>;
  width: number;
  height: number;
}

function computeLayout(nodes: FlowNode[], edges: FlowEdge[]): LayoutResult {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: "TB",
    nodesep: 40,
    ranksep: 50,
    marginx: 30,
    marginy: 30,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NW[n.type], height: NH[n.type] });
  });
  edges.forEach((e, i) => {
    g.setEdge(e.from, e.to, { label: e.label || "", labelpos: "c", width: e.label ? 24 : 0, height: e.label ? 14 : 0 }, `e${i}`);
  });

  dagre.layout(g);

  const nodeMap = new Map<string, { x: number; y: number; w: number; h: number }>();
  g.nodes().forEach((id) => {
    const n = g.node(id);
    if (n) nodeMap.set(id, { x: n.x, y: n.y, w: n.width, h: n.height });
  });

  const edgeMap = new Map<string, { points: { x: number; y: number }[] }>();
  g.edges().forEach((e) => {
    const edge = g.edge(e);
    if (edge) edgeMap.set(e.name ?? `${e.v}->${e.w}`, { points: edge.points || [] });
  });

  const graphLabel = g.graph();
  return {
    nodes: nodeMap,
    edges: edgeMap,
    width: graphLabel?.width ?? 400,
    height: graphLabel?.height ?? 300,
  };
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const C: Record<NodeState, { fill: string; stroke: string; text: string; dash?: string }> = {
  preset:  { fill: "#F8FAFC", stroke: "#94A3B8", text: "#475569" },
  empty:   { fill: "#FAFAFA", stroke: "#CBD5E1", text: "#94A3B8", dash: "6,4" },
  filled:  { fill: "#F5F3FF", stroke: "#8B5CF6", text: "#6D28D9" },
  active:  { fill: "#EDE9FE", stroke: "#7C3AED", text: "#5B21B6" },
  correct: { fill: "#F0FDF4", stroke: "#22C55E", text: "#166534" },
  wrong:   { fill: "#FEF2F2", stroke: "#EF4444", text: "#DC2626" },
};

// ─── SVG: one node ────────────────────────────────────────────────────────────

function FlowNodeSVG({ node, label, state, onClick, isTarget, pos }: {
  node: FlowNode; label: string; state: NodeState;
  onClick: () => void; isTarget: boolean;
  pos: { x: number; y: number; w: number; h: number };
}) {
  const { x, y, w, h } = pos;
  const c = C[state];
  const sw = state === "active" || state === "correct" || state === "wrong" ? 2 : 1.5;

  const rawLabel = label || (node.blank ? "?" : "");
  const fontSize = node.type === "decision" ? 10 : 11;
  const maxChars = node.type === "decision" ? 14 : 16;

  function wrapText(text: string, max: number): string[] {
    if (text.length <= max) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      if (!current) { current = word; continue; }
      if ((current + " " + word).length <= max) { current += " " + word; }
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2);
  }
  const lines = wrapText(rawLabel, maxChars);
  const lineH = fontSize + 2;

  const textEl = (
    <text x={x} y={y} textAnchor="middle" fontWeight={600}
      fontSize={fontSize} fill={c.text}
      style={{ pointerEvents: "none", userSelect: "none" as const, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {lines.map((line, i) => (
        <tspan key={i} x={x}
          dy={i === 0 ? -(lineH * (lines.length - 1)) / 2 : lineH}
          dominantBaseline="central">
          {line}
        </tspan>
      ))}
    </text>
  );

  const sharedStyle = {
    cursor: node.blank ? "pointer" : "default" as const,
    transition: "all 0.2s ease",
    ...(isTarget ? { filter: "drop-shadow(0 0 6px rgba(124,58,237,0.4))" } : {}),
  };

  const sharedRect = {
    fill: c.fill, stroke: c.stroke, strokeWidth: sw,
    strokeDasharray: c.dash,
    style: sharedStyle,
    onClick: node.blank ? onClick : undefined,
  };

  const hw = w / 2, hh = h / 2;

  return (
    <g>
      {(node.type === "start" || node.type === "end") && (
        <rect x={x - hw} y={y - hh} width={w} height={h}
          rx={h / 2} {...sharedRect}
          strokeWidth={node.type === "end" ? sw + 0.5 : sw} />
      )}
      {node.type === "process" && (
        <rect x={x - hw} y={y - hh} width={w} height={h}
          rx={8} {...sharedRect} />
      )}
      {node.type === "decision" && (() => {
        const dw = hw + 4, dh = hh;
        return (
          <polygon points={`${x},${y - dh} ${x + dw},${y} ${x},${y + dh} ${x - dw},${y}`}
            {...sharedRect} />
        );
      })()}
      {textEl}
    </g>
  );
}

// ─── SVG: one edge ────────────────────────────────────────────────────────────

function FlowEdgeSVG({ edge, points }: {
  edge: FlowEdge; points: { x: number; y: number }[];
}) {
  if (points.length < 2) return null;

  // Build a smooth path through dagre's waypoints
  const [first, ...rest] = points;
  let d = `M${first.x},${first.y}`;
  if (rest.length === 1) {
    d += ` L${rest[0].x},${rest[0].y}`;
  } else {
    // Use the waypoints as-is with line segments (dagre already routes them well)
    for (const p of rest) {
      d += ` L${p.x},${p.y}`;
    }
  }

  // Edge label near the middle waypoint
  const midIdx = Math.floor(points.length / 2);
  const mp = points[midIdx];

  return (
    <g>
      <path d={d} fill="none" stroke="#94A3B8" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        markerEnd="url(#gz-arrow)" />
      {edge.label && (
        <g>
          <rect x={mp.x - 14} y={mp.y - 8} width={28} height={16} rx={4}
            fill="#fff" fillOpacity={0.92} stroke="#E2E8F0" strokeWidth={0.5} />
          <text x={mp.x} y={mp.y} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontWeight="600" fill="#64748B"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Data parsing ─────────────────────────────────────────────────────────────

function parseData(data: Record<string, unknown>): { nodes: FlowNode[]; edges: FlowEdge[]; items: string[]; instruction: string } | null {
  try {
    const nodes = typeof data.nodes === "string" ? JSON.parse(data.nodes) : data.nodes;
    const edges = typeof data.edges === "string" ? JSON.parse(data.edges) : data.edges;
    if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
    return {
      nodes: nodes as FlowNode[],
      edges: edges as FlowEdge[],
      items: arr(data.items),
      instruction: str(data.instruction),
    };
  } catch { return null; }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowchartQuestion({ data, onAnswer, resetKey }: QuestionProps) {
  const flow = useMemo(() => parseData(data), [data]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placed, setPlaced]             = useState<Record<string, string>>({});
  const [checked, setChecked]           = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setSelectedItem(null);
    setPlaced({});
    setChecked(false);
  }, [resetKey]);

  const nodes = flow?.nodes ?? [];
  const edges = flow?.edges ?? [];

  // Dagre computes all positions
  const layout = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);

  if (!flow) {
    return (
      <div style={{ ...CARD, textAlign: "center" as const, color: "#94A3B8", padding: 40 }}>
        Define nodes + edges JSON to preview flowchart
      </div>
    );
  }

  const { items, instruction } = flow;

  const blankNodes = nodes.filter(n => n.blank);
  const placedSet  = new Set(Object.values(placed));
  const allFilled  = blankNodes.every(n => placed[n.id]);
  const allCorrect = checked && blankNodes.every(n => placed[n.id] === n.correct);

  function nodeState(n: FlowNode): NodeState {
    if (!n.blank) return "preset";
    if (checked) return placed[n.id] === n.correct ? "correct" : "wrong";
    if (placed[n.id]) return "filled";
    return selectedItem ? "active" : "empty";
  }

  function handleNodeClick(n: FlowNode) {
    if (!n.blank || checked) return;
    if (placed[n.id]) {
      setPlaced(p => { const c = { ...p }; delete c[n.id]; return c; });
      setChecked(false);
    } else if (selectedItem) {
      setPlaced(p => ({ ...p, [n.id]: selectedItem }));
      setSelectedItem(null);
    }
  }

  function handleReset() { setPlaced({}); setChecked(false); setSelectedItem(null); }

  const displayLabel = (n: FlowNode) =>
    n.blank ? (placed[n.id] ?? "") : (n.label ?? "");

  const vw = Math.max(layout.width, 200);
  const vh = Math.max(layout.height, 200);

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction || "Complete the flowchart"}</div>

      {/* ── Flowchart canvas ── */}
      <div style={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        marginBottom: 16,
        overflow: "hidden",
      }}>
        <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: "100%", display: "block" }}>
          <defs>
            <marker id="gz-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#94A3B8" />
            </marker>
            <pattern id="gz-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="#CBD5E1" opacity="0.4" />
            </pattern>
          </defs>
          <rect width={vw} height={vh} fill="url(#gz-dots)" />

          {/* Edges (behind nodes) */}
          {edges.map((e, i) => {
            const edgeLayout = layout.edges.get(`e${i}`);
            if (!edgeLayout) return null;
            return <FlowEdgeSVG key={i} edge={e} points={edgeLayout.points} />;
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const pos = layout.nodes.get(n.id);
            if (!pos) return null;
            return (
              <FlowNodeSVG
                key={n.id}
                node={n}
                label={displayLabel(n)}
                state={nodeState(n)}
                isTarget={!!selectedItem && !!n.blank && !placed[n.id] && !checked}
                onClick={() => handleNodeClick(n)}
                pos={pos}
              />
            );
          })}
        </svg>
      </div>

      {/* ── Item bank ── */}
      {!checked && items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 8,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            {selectedItem
              ? `"${selectedItem}" selected — tap an empty node to place it`
              : "Tap an item, then tap an empty node to place it"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.filter(item => !placedSet.has(item)).map((item, i) => (
              <div
                key={i}
                onClick={() => setSelectedItem(selectedItem === item ? null : item)}
                style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  background: selectedItem === item ? "#7C3AED" : "#fff",
                  color:      selectedItem === item ? "#fff"    : "#475569",
                  border:     selectedItem === item ? "2px solid #6D28D9" : "1.5px solid #E2E8F0",
                  transform:  selectedItem === item ? "scale(1.04)" : "scale(1)",
                  boxShadow:  selectedItem === item
                    ? "0 4px 12px rgba(124,58,237,0.25)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      {allFilled && !checked && (
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <button style={BTN} onClick={() => {
            setChecked(true);
            onAnswer?.({ placed, correct: blankNodes.every(n => placed[n.id] === n.correct) });
          }}>
            Submit
          </button>
        </div>
      )}

      {checked && (
        <>
          <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
            {allCorrect
              ? "Correct! The flowchart is complete."
              : "Some nodes are wrong — check the red ones and try again."}
          </div>
          {!allCorrect && (
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <button style={BTN_SECONDARY} onClick={handleReset}>Reset</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
