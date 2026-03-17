import { useState, useMemo, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeType = "start" | "end" | "process" | "decision";
type NodeState = "preset" | "empty" | "filled" | "active" | "correct" | "wrong";

interface FlowNode {
  id: string;
  type: NodeType;
  label?: string;   // pre-filled label (not editable)
  blank?: boolean;  // student must fill this
  correct?: string; // correct answer for blank nodes
  x: number;        // 0–100 % of viewBox width
  y: number;        // 0–100 % of viewBox height
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string; // "Yes" / "No" / ""
}

// ─── Geometry ────────────────────────────────────────────────────────────────

const VW = 400;

const NW: Record<NodeType, number> = { start: 106, end: 106, process: 126, decision: 116 };
const NH: Record<NodeType, number> = { start: 36,  end: 36,  process: 40,  decision: 58  };

const cx = (n: FlowNode) => (n.x / 100) * VW;
const cy = (n: FlowNode, vh: number) => (n.y / 100) * vh;
const hw = (t: NodeType) => NW[t] / 2;
const hh = (t: NodeType) => NH[t] / 2;

function exitPt(n: FlowNode, idx: number, total: number, vh: number) {
  const x = cx(n), y = cy(n, vh);
  if (n.type === "decision" && total >= 2) {
    const dw = hw("decision") + 8;
    return idx === 0 ? { x: x - dw, y } : { x: x + dw, y };
  }
  return { x, y: y + hh(n.type) };
}

function entryPt(n: FlowNode, vh: number) {
  return { x: cx(n), y: cy(n, vh) - hh(n.type) };
}

function edgePath(from: FlowNode, to: FlowNode, idx: number, total: number, vh: number): string {
  const s = exitPt(from, idx, total, vh);
  const e = entryPt(to, vh);
  if (Math.abs(s.x - e.x) < 4) {
    return `M${s.x},${s.y} L${e.x},${e.y}`;
  }
  // Orthogonal elbow: down → across → down
  const midY = s.y + Math.max(18, (e.y - s.y) * 0.45);
  return `M${s.x},${s.y} L${s.x},${midY} L${e.x},${midY} L${e.x},${e.y}`;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const C: Record<NodeState, { fill: string; stroke: string; text: string; dash?: string }> = {
  preset:  { fill: "#EDF2F7", stroke: "#A0AEC0", text: "#4A5568" },
  empty:   { fill: "#fff",    stroke: "#CBD5E0", text: "#a0aec0", dash: "5,4" },
  filled:  { fill: "#FAF5FF", stroke: "#805AD5", text: "#553C9A" },
  active:  { fill: "#EDE9FE", stroke: "#6D28D9", text: "#4C1D95" },
  correct: { fill: "#F0FFF4", stroke: "#38A169", text: "#276749" },
  wrong:   { fill: "#FFF5F5", stroke: "#E53E3E", text: "#C53030" },
};

// ─── SVG: one node ────────────────────────────────────────────────────────────

function FlowNodeSVG({ node, label, state, onClick, isTarget, vh }: {
  node: FlowNode; label: string; state: NodeState;
  onClick: () => void; isTarget: boolean; vh: number;
}) {
  const x = cx(node), y = cy(node, vh);
  const c = C[state];
  const sw = state === "active" || state === "correct" || state === "wrong" ? 2.5 : 1.5;
  const pulse = isTarget ? { filter: "drop-shadow(0 0 4px #805AD5)" } : {};

  const textEl = (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
      fontSize={node.type === "decision" ? 10 : 11} fontWeight={700}
      fill={c.text} style={{ pointerEvents: "none", userSelect: "none" as const }}>
      {label || (node.blank ? "?" : "")}
    </text>
  );

  const sharedRect = {
    fill: c.fill, stroke: c.stroke, strokeWidth: sw,
    strokeDasharray: c.dash,
    style: { cursor: node.blank ? "pointer" : "default" as const, ...pulse },
    onClick: node.blank ? onClick : undefined,
  };

  return (
    <g>
      {(node.type === "start" || node.type === "end") && (
        <rect x={x - hw("start")} y={y - hh("start")} width={NW.start} height={NH.start}
          rx={NH.start / 2} {...sharedRect}
          strokeWidth={node.type === "end" ? sw + 1 : sw} />
      )}
      {node.type === "process" && (
        <rect x={x - hw("process")} y={y - hh("process")} width={NW.process} height={NH.process}
          rx={5} {...sharedRect} />
      )}
      {node.type === "decision" && (() => {
        const dw = hw("decision") + 8, dh = hh("decision");
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

function FlowEdgeSVG({ edge, nodes, idx, total, vh }: {
  edge: FlowEdge; nodes: FlowNode[]; idx: number; total: number; vh: number;
}) {
  const from = nodes.find(n => n.id === edge.from);
  const to   = nodes.find(n => n.id === edge.to);
  if (!from || !to) return null;

  const s = exitPt(from, idx, total, vh);
  const d = edgePath(from, to, idx, total, vh);

  // Label near exit point
  const lx = s.x + (idx === 0 && from.type === "decision" ? -14 : from.type === "decision" ? 14 : 0);
  const ly = s.y + 14;

  return (
    <g>
      <path d={d} fill="none" stroke="#CBD5E0" strokeWidth="1.5" markerEnd="url(#gz-arrow)" />
      {edge.label && (
        <text x={lx} y={ly} textAnchor="middle" fontSize="10" fontWeight="700" fill="#718096">{edge.label}</text>
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

  // Dynamic viewBox height: max node bottom + padding
  const VH = useMemo(() => {
    if (!nodes.length) return 280;
    const maxBottom = Math.max(...nodes.map(n => (n.y / 100) * 500 + NH[n.type] / 2));
    return Math.max(280, maxBottom + 48);
  }, [nodes]);

  // Outgoing edge count per node (for decision exit point routing)
  const outgoing = useMemo(() => {
    const m: Record<string, number> = {};
    edges.forEach(e => { m[e.from] = (m[e.from] ?? 0) + 1; });
    return m;
  }, [edges]);

  // Per-edge index within its source node's outgoing edges
  const edgeIdx = useMemo(() => {
    const ctr: Record<string, number> = {};
    return edges.map(e => { const i = ctr[e.from] ?? 0; ctr[e.from] = i + 1; return i; });
  }, [edges]);

  if (!flow) {
    return (
      <div style={{ ...CARD, textAlign: "center" as const, color: "#a0aec0", padding: 40 }}>
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
    if (placed[n.id]) return selectedItem ? "filled" : "filled";
    return selectedItem ? "active" : "empty";
  }

  function handleNodeClick(n: FlowNode) {
    if (!n.blank || checked) return;
    if (placed[n.id]) {
      // Return to bank
      setPlaced(p => { const c = { ...p }; delete c[n.id]; return c; });
      setChecked(false);
    } else if (selectedItem) {
      setPlaced(p => ({ ...p, [n.id]: selectedItem }));
      setSelectedItem(null);
    }
  }

  function handleReset() { setPlaced({}); setChecked(false); setSelectedItem(null); }

  // Display label per node
  const displayLabel = (n: FlowNode) =>
    n.blank ? (placed[n.id] ?? "") : (n.label ?? "");

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction || "Complete the flowchart"}</div>

      {/* ── Flowchart canvas ── */}
      <div style={{ background: "#FAFBFC", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", display: "block" }}>
          <defs>
            <marker id="gz-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0,0 7,3.5 0,7" fill="#A0AEC0" />
            </marker>
          </defs>

          {/* Edges (behind nodes) */}
          {edges.map((e, i) => (
            <FlowEdgeSVG key={i} edge={e} nodes={nodes} idx={edgeIdx[i]} total={outgoing[e.from] ?? 1} vh={VH} />
          ))}

          {/* Nodes */}
          {nodes.map(n => (
            <FlowNodeSVG
              key={n.id}
              node={n}
              label={displayLabel(n)}
              state={nodeState(n)}
              isTarget={!!selectedItem && !!n.blank && !placed[n.id] && !checked}
              onClick={() => handleNodeClick(n)}
              vh={VH}
            />
          ))}
        </svg>
      </div>

      {/* ── Item bank ── */}
      {!checked && items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#718096", fontWeight: 600, marginBottom: 8 }}>
            {selectedItem
              ? `"${selectedItem}" selected — tap an empty node to place it`
              : "Tap an item to select it, then tap an empty node"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.filter(item => !placedSet.has(item)).map((item, i) => (
              <div
                key={i}
                onClick={() => setSelectedItem(selectedItem === item ? null : item)}
                style={{
                  padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  background: selectedItem === item ? "#805AD5" : "#fff",
                  color:      selectedItem === item ? "#fff"    : "#4A5568",
                  border:     selectedItem === item ? "2px solid #6D28D9" : "1.5px dashed #a0aec0",
                  transform:  selectedItem === item ? "scale(1.06)" : "scale(1)",
                  boxShadow:  selectedItem === item ? "0 2px 8px rgba(128,90,213,0.3)" : "none",
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
