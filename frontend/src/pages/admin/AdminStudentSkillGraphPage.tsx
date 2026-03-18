import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useSkillGraph, type CompetencyInfo, type PillarInfo, type CapabilityInfo } from "@/api/hooks/useCompetencies";
import { api } from "@/api/client";
import * as s from "../SkillGraphPage.css";

/* ── Types ── */

interface CompetencyState {
  competency_id: string;
  p_learned: number;
  stage: number;
  total_evidence: number;
  is_stuck: boolean;
}

interface EvidenceDetail {
  id: string;
  outcome: number;
  response_time_ms: number | null;
  misconception: {
    type: "conceptual" | "procedural" | "careless" | "guessing";
    misconception: string;
    confidence: number;
    intervention: string;
  } | null;
  created_at: string;
}

interface CompetencyDrilldown {
  competency_id: string;
  student_id: string;
  p_learned: number;
  stage: number;
  total_evidence: number;
  is_stuck: boolean;
  evidence: EvidenceDetail[];
}

const MISC_COLORS: Record<string, string> = {
  conceptual: "#e53e3e",
  procedural: "#ed8936",
  careless: "#d69e2e",
  guessing: "#718096",
};

interface GraphNode {
  id: string;
  name: string;
  description: string;
  capability_id: string;
  pillarId: string;
  pillarColor: string;
  pillarName: string;
  capabilityName: string;
  x: number;
  y: number;
}

interface GraphLink {
  sourceId: string;
  targetId: string;
  type: "prerequisite" | "codevelopment";
}

const NODE_W = 150;
const NODE_H = 52;
const COL_GAP = 40;
const ROW_GAP = 24;
const CAP_GAP = 40;
const PILLAR_PAD_X = 24;
const PILLAR_PAD_Y = 50;
const PILLAR_GAP = 36;
const HEADER_H = 32;
const ARROW_SIZE = 6;

function masteryColor(p: number, pillarColor: string): string {
  if (p >= 0.8) return "#38a169";   // mastered — green
  if (p >= 0.6) return "#68d391";   // proficient — light green
  if (p >= 0.3) return "#ed8936";   // developing — orange
  if (p > 0)    return "#e53e3e";   // emerging — red
  return pillarColor + "18";        // not started — faint pillar tint
}

function masteryLabel(p: number, evidence: number): string {
  if (evidence === 0) return "Not started";
  if (p >= 0.8) return `Mastered · ${Math.round(p * 100)}%`;
  if (p >= 0.6) return `Proficient · ${Math.round(p * 100)}%`;
  if (p >= 0.3) return `Developing · ${Math.round(p * 100)}%`;
  return `Emerging · ${Math.round(p * 100)}%`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function AdminStudentSkillGraphPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data: graphData, isLoading: graphLoading } = useSkillGraph();

  const { data: stateData, isLoading: stateLoading } = useQuery<{ student: { name: string }; states: CompetencyState[] }>({
    queryKey: ["student-state", studentId],
    queryFn: () => api.get(`/students/${studentId}/state`).then(r => r.data),
    enabled: !!studentId,
  });

  const stateMap = useMemo(() => {
    const m = new Map<string, CompetencyState>();
    for (const st of stateData?.states ?? []) m.set(st.competency_id, st);
    return m;
  }, [stateData]);

  /* ── Canvas refs ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cameraRef = useRef({ x: 60, y: 60, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; screenX: number; screenY: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showDrilldown, setShowDrilldown] = useState(false);

  const { data: drilldown, isLoading: drilldownLoading } = useQuery<CompetencyDrilldown>({
    queryKey: ["competency-drilldown", studentId, selectedNode?.id],
    queryFn: () => api.get(`/admin/diagnostics/students/${studentId}/competency/${selectedNode!.id}`).then(r => r.data),
    enabled: !!studentId && !!selectedNode && showDrilldown,
  });

  /* ── Build layout (same as SkillGraphPage) ── */
  const { nodes, links, nodeMap, pillarBoxes, pillars } = useMemo(() => {
    const empty = { nodes: [], links: [], nodeMap: new Map<string, GraphNode>(), pillarBoxes: [] as any[], pillars: [] as PillarInfo[] };
    if (!graphData) return empty;

    const pMap = new Map<string, PillarInfo>();
    for (const p of graphData.pillars) pMap.set(p.id, p);
    const cMap = new Map<string, CapabilityInfo>();
    for (const c of graphData.capabilities) cMap.set(c.id, c);

    const pillarOrder = graphData.pillars.map(p => p.id);
    const capsByPillar = new Map<string, CapabilityInfo[]>();
    for (const cap of graphData.capabilities) {
      const list = capsByPillar.get(cap.pillar_id) ?? [];
      list.push(cap);
      capsByPillar.set(cap.pillar_id, list);
    }
    const compsByCap = new Map<string, CompetencyInfo[]>();
    for (const c of graphData.competencies) {
      const list = compsByCap.get(c.capability_id) ?? [];
      list.push(c);
      compsByCap.set(c.capability_id, list);
    }

    const allNodes: GraphNode[] = [];
    const nMap = new Map<string, GraphNode>();
    const boxes: { pillarId: string; color: string; name: string; x: number; y: number; w: number; h: number }[] = [];

    let cursorX = 0;
    let maxH = 0;
    const COLS = 3;

    for (const pId of pillarOrder) {
      const pillar = pMap.get(pId)!;
      const caps = capsByPillar.get(pId) ?? [];
      let cursorY = PILLAR_PAD_Y + HEADER_H;
      const pillarW = COLS * NODE_W + (COLS - 1) * COL_GAP + PILLAR_PAD_X * 2;

      for (const cap of caps) {
        const comps = compsByCap.get(cap.id) ?? [];
        if (!comps.length) continue;
        cursorY += 28;
        for (let i = 0; i < comps.length; i++) {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = cursorX + PILLAR_PAD_X + col * (NODE_W + COL_GAP);
          const y = cursorY + row * (NODE_H + ROW_GAP);
          const c = comps[i]!;
          const node: GraphNode = {
            id: c.id, name: c.name, description: c.description,
            capability_id: c.capability_id, pillarId: pId,
            pillarColor: pillar.color, pillarName: pillar.name,
            capabilityName: cap.name, x, y,
          };
          allNodes.push(node);
          nMap.set(c.id, node);
        }
        const rows = Math.ceil(comps.length / COLS);
        cursorY += rows * (NODE_H + ROW_GAP) + CAP_GAP;
      }

      const pillarH = cursorY + PILLAR_PAD_Y;
      boxes.push({ pillarId: pId, color: pillar.color, name: pillar.name, x: cursorX, y: 0, w: pillarW, h: pillarH });
      if (pillarH > maxH) maxH = pillarH;
      cursorX += pillarW + PILLAR_GAP;
    }

    for (const b of boxes) b.h = maxH;

    const allLinks: GraphLink[] = [];
    const nodeIdSet = new Set(allNodes.map(n => n.id));
    for (const e of graphData.prerequisite_edges)
      if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
        allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "prerequisite" });
    for (const e of graphData.codevelopment_edges)
      if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
        allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "codevelopment" });

    return { nodes: allNodes, links: allLinks, nodeMap: nMap, pillarBoxes: boxes, pillars: graphData.pillars };
  }, [graphData]);

  const visibleNodes = useMemo(() => activePillar ? nodes.filter(n => n.pillarId === activePillar) : nodes, [nodes, activePillar]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleLinks = useMemo(() => activePillar ? links.filter(l => visibleNodeIds.has(l.sourceId) && visibleNodeIds.has(l.targetId)) : links, [links, activePillar, visibleNodeIds]);

  /* ── Hit testing ── */
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const cam = cameraRef.current;
    return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
  }, []);

  const findNodeAt = useCallback((sx: number, sy: number): GraphNode | null => {
    const { x, y } = screenToWorld(sx, sy);
    for (const n of visibleNodes)
      if (x >= n.x && x <= n.x + NODE_W && y >= n.y && y <= n.y + NODE_H) return n;
    return null;
  }, [screenToWorld, visibleNodes]);

  /* ── Drawing ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cam = cameraRef.current;
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.zoom, cam.zoom);

    // Pillar boxes
    for (const box of pillarBoxes) {
      if (activePillar && box.pillarId !== activePillar) continue;
      ctx.fillStyle = box.color + "08";
      ctx.strokeStyle = box.color + "25";
      ctx.lineWidth = 1.5;
      const r = 12;
      const { x: bx, y: by, w: bw, h: bh } = box;
      ctx.beginPath();
      ctx.moveTo(bx + r, by); ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh - r);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      ctx.lineTo(bx + r, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = box.color;
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(box.name, box.x + PILLAR_PAD_X, box.y + 16);
    }

    // Capability labels
    const drawnCaps = new Set<string>();
    for (const node of visibleNodes) {
      if (drawnCaps.has(node.capability_id)) continue;
      drawnCaps.add(node.capability_id);
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = node.pillarColor + "90";
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(node.capabilityName.toUpperCase(), node.x, node.y - 6);
    }

    // Edges
    for (const link of visibleLinks) {
      const src = nodeMap.get(link.sourceId);
      const tgt = nodeMap.get(link.targetId);
      if (!src || !tgt) continue;
      drawEdge(ctx, src, tgt, link.type);
    }

    // Nodes with mastery overlay
    for (const node of visibleNodes) {
      const state = stateMap.get(node.id);
      const p = state?.p_learned ?? 0;
      const evidence = state?.total_evidence ?? 0;
      const isHovered = hoveredNode?.node.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const fillColor = evidence > 0 ? masteryColor(p, node.pillarColor) : (isHovered ? node.pillarColor + "18" : "#ffffff");

      const r = 8;
      const nx = node.x; const ny = node.y;
      ctx.beginPath();
      ctx.moveTo(nx + r, ny); ctx.lineTo(nx + NODE_W - r, ny);
      ctx.quadraticCurveTo(nx + NODE_W, ny, nx + NODE_W, ny + r);
      ctx.lineTo(nx + NODE_W, ny + NODE_H - r);
      ctx.quadraticCurveTo(nx + NODE_W, ny + NODE_H, nx + NODE_W - r, ny + NODE_H);
      ctx.lineTo(nx + r, ny + NODE_H);
      ctx.quadraticCurveTo(nx, ny + NODE_H, nx, ny + NODE_H - r);
      ctx.lineTo(nx, ny + r);
      ctx.quadraticCurveTo(nx, ny, nx + r, ny);
      ctx.closePath();
      ctx.fillStyle = isSelected ? node.pillarColor : evidence > 0 ? fillColor + "30" : fillColor;
      ctx.fill();
      ctx.strokeStyle = isSelected ? node.pillarColor : evidence > 0 ? fillColor : node.pillarColor + "50";
      ctx.lineWidth = isSelected || isHovered ? 2 : evidence > 0 ? 2 : 1;
      ctx.stroke();

      // Left accent bar
      ctx.fillStyle = evidence > 0 ? fillColor : node.pillarColor;
      ctx.beginPath();
      ctx.moveTo(nx + r, ny); ctx.lineTo(nx + 5, ny);
      ctx.lineTo(nx + 5, ny + NODE_H); ctx.lineTo(nx + r, ny + NODE_H);
      ctx.quadraticCurveTo(nx, ny + NODE_H, nx, ny + NODE_H - r);
      ctx.lineTo(nx, ny + r);
      ctx.quadraticCurveTo(nx, ny, nx + r, ny);
      ctx.closePath(); ctx.fill();

      // Node text
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillStyle = isSelected ? "#ffffff" : evidence > 0 ? "#1a1a2e" : "#1a1a2e";
      const textX = nx + 12;
      const textMaxW = NODE_W - 20;
      const textLines = wrapText(ctx, node.name, textMaxW);
      const lineH = 14;
      const textY = ny + (NODE_H - Math.min(textLines.length, 2) * lineH) / 2;
      for (let i = 0; i < Math.min(textLines.length, 2); i++)
        ctx.fillText(textLines[i]!, textX, textY + i * lineH);

      // P(L) badge bottom-right
      if (evidence > 0) {
        const pct = Math.round(p * 100) + "%";
        ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = fillColor;
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(pct, nx + NODE_W - 6, ny + NODE_H - 4);
      }
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(draw);
  }, [visibleNodes, visibleLinks, pillarBoxes, nodeMap, activePillar, hoveredNode, selectedNode, stateMap]);

  function drawEdge(ctx: CanvasRenderingContext2D, src: GraphNode, tgt: GraphNode, type: "prerequisite" | "codevelopment") {
    const [x1, y1] = boxEdgePoint(src.x, src.y, NODE_W, NODE_H, tgt.x + NODE_W / 2, tgt.y + NODE_H / 2);
    const [x2, y2] = boxEdgePoint(tgt.x, tgt.y, NODE_W, NODE_H, src.x + NODE_W / 2, src.y + NODE_H / 2);
    ctx.beginPath();
    if (Math.abs(src.x - tgt.x) > NODE_W + COL_GAP) {
      const midX = (x1 + x2) / 2;
      ctx.moveTo(x1, y1); ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
    } else {
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
    if (type === "codevelopment") {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(150,150,150,0.3)";
      ctx.lineWidth = 1;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(100,100,100,0.4)";
      ctx.lineWidth = 1.2;
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (type === "prerequisite") {
      const dx = x2 - x1; const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const ux = dx / len; const uy = dy / len;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * ARROW_SIZE + uy * ARROW_SIZE * 0.4, y2 - uy * ARROW_SIZE - ux * ARROW_SIZE * 0.4);
        ctx.lineTo(x2 - ux * ARROW_SIZE - uy * ARROW_SIZE * 0.4, y2 - uy * ARROW_SIZE + ux * ARROW_SIZE * 0.4);
        ctx.closePath();
        ctx.fillStyle = "rgba(100,100,100,0.5)";
        ctx.fill();
      }
    }
  }

  useEffect(() => {
    if (!nodes.length) return;
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, draw]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const newZoom = Math.max(0.15, Math.min(4, cam.zoom * factor));
    cam.x = mx - ((mx - cam.x) / cam.zoom) * newZoom;
    cam.y = my - ((my - cam.y) / cam.zoom) * newZoom;
    cam.zoom = newZoom;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isPanningRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      cameraRef.current.x += dx; cameraRef.current.y += dy;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    const node = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (node) { setHoveredNode({ node, screenX: e.clientX, screenY: e.clientY }); canvasRef.current!.style.cursor = "pointer"; }
    else { setHoveredNode(null); canvasRef.current!.style.cursor = "grab"; }
  }, [findNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const node = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        setSelectedNode(node ?? null);
        setShowDrilldown(false);
      }
    }
    isPanningRef.current = false;
  }, [findNodeAt]);

  const pillarCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) m.set(n.pillarId, (m.get(n.pillarId) ?? 0) + 1);
    return m;
  }, [nodes]);

  const studentName = stateData?.student?.name ?? "Student";

  if (graphLoading || stateLoading) {
    return (
      <div className={s.page}>
        <div className={s.loadingOverlay}><span className={s.loadingText}>Loading skill graph...</span></div>
      </div>
    );
  }

  const selectedState = selectedNode ? stateMap.get(selectedNode.id) : null;

  return (
    <div className={s.page}>
      {/* Filter bar */}
      <div className={s.filterBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/admin/students")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#718096", fontSize: 13 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className={s.filterTitle}>{studentName} — Skill Graph</div>
        </div>

        <div className={s.filterTabs}>
          {pillars.map(p => (
            <button
              key={p.id}
              className={`${s.filterTab} ${activePillar === p.id ? s.filterTabActive : ""}`}
              style={{ borderColor: activePillar === p.id ? p.color : "transparent", color: activePillar === p.id ? p.color : undefined }}
              onClick={() => { setActivePillar(activePillar === p.id ? null : p.id); setSelectedNode(null); }}
            >
              <span className={s.filterDot} style={{ backgroundColor: p.color }} />
              {p.name}
              <span className={s.filterCount}>{pillarCounts.get(p.id) ?? 0}</span>
            </button>
          ))}
          {activePillar && (
            <button className={s.filterTab} onClick={() => { setActivePillar(null); setSelectedNode(null); }} style={{ color: "#888" }}>
              Show All
            </button>
          )}
        </div>

        {/* Mastery legend */}
        <div className={s.filterLegend}>
          {[["#38a169", "Mastered"], ["#68d391", "Proficient"], ["#ed8936", "Developing"], ["#e53e3e", "Emerging"], ["#e2e8f0", "Not started"]].map(([color, label]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, display: "inline-block" }} />
              <span style={{ fontSize: 11 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={s.canvas}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isPanningRef.current = false; setHoveredNode(null); }}
      />

      {/* Zoom controls */}
      <div className={s.controls}>
        <button className={s.controlBtn} onClick={() => { const cam = cameraRef.current; const c = canvasRef.current!; const cx = c.clientWidth / 2; const cy = c.clientHeight / 2; const nz = Math.min(4, cam.zoom * 1.15); cam.x = cx - ((cx - cam.x) / cam.zoom) * nz; cam.y = cy - ((cy - cam.y) / cam.zoom) * nz; cam.zoom = nz; }}>+</button>
        <button className={s.controlBtn} onClick={() => { const cam = cameraRef.current; const c = canvasRef.current!; const cx = c.clientWidth / 2; const cy = c.clientHeight / 2; const nz = Math.max(0.15, cam.zoom / 1.15); cam.x = cx - ((cx - cam.x) / cam.zoom) * nz; cam.y = cy - ((cy - cam.y) / cam.zoom) * nz; cam.zoom = nz; }}>-</button>
        <button className={s.controlBtn} onClick={() => { cameraRef.current = { x: 60, y: 60, zoom: 1 }; }} style={{ fontSize: 12 }}>R</button>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div className={s.tooltip} style={{ left: hoveredNode.screenX + 14, top: hoveredNode.screenY - 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{hoveredNode.node.name}</div>
          {(() => {
            const st = stateMap.get(hoveredNode.node.id);
            return st && st.total_evidence > 0
              ? <div style={{ fontSize: 11, opacity: 0.7 }}>{masteryLabel(st.p_learned, st.total_evidence)} · {st.total_evidence} attempts</div>
              : <div style={{ fontSize: 11, opacity: 0.5 }}>Not started</div>;
          })()}
        </div>
      )}

      {/* Side panel */}
      {selectedNode && (
        <div className={s.sidePanel} style={{ overflowY: "auto" }}>
          <button className={s.panelClose} onClick={() => { setSelectedNode(null); setShowDrilldown(false); }}>&times;</button>
          <h2 className={s.panelTitle}>{selectedNode.name}</h2>
          <span className={s.panelPillarBadge} style={{ backgroundColor: selectedNode.pillarColor + "20", color: selectedNode.pillarColor }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: selectedNode.pillarColor, display: "inline-block" }} />
            {selectedNode.pillarName}
          </span>

          {selectedState && selectedState.total_evidence > 0 ? (
            <>
              <div className={s.panelSection}>
                <span className={s.panelLabel}>Mastery (P(L))</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(selectedState.p_learned * 100)}%`, height: "100%", background: masteryColor(selectedState.p_learned, selectedNode.pillarColor), borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: masteryColor(selectedState.p_learned, selectedNode.pillarColor) }}>
                    {Math.round(selectedState.p_learned * 100)}%
                  </span>
                </div>
                <span className={s.panelValue}>{masteryLabel(selectedState.p_learned, selectedState.total_evidence)}</span>
              </div>
              <div className={s.panelSection}>
                <span className={s.panelLabel}>Evidence</span>
                <span className={s.panelValue}>{selectedState.total_evidence} attempts · Stage {selectedState.stage}</span>
              </div>
              {selectedState.is_stuck && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(237,137,54,0.1)", color: "#c05621", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  ⚠ Stuck — consecutive failures
                </div>
              )}

              {/* Drill-down toggle */}
              {!showDrilldown ? (
                <button
                  onClick={() => setShowDrilldown(true)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4a5568", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}
                >
                  View evidence & misconceptions <ChevronRight size={14} />
                </button>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#718096", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Recent Evidence
                  </div>
                  {drilldownLoading ? (
                    <div style={{ fontSize: 12, color: "#a0aec0", padding: "8px 0" }}>Loading...</div>
                  ) : drilldown?.evidence.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>No evidence yet</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {drilldown?.evidence.map((ev) => (
                        <div key={ev.id} style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${ev.outcome >= 0.5 ? "rgba(72,187,120,0.3)" : "rgba(229,62,62,0.2)"}`,
                          background: ev.outcome >= 0.5 ? "rgba(72,187,120,0.06)" : "rgba(229,62,62,0.04)",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ev.misconception ? 4 : 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: ev.outcome >= 0.5 ? "#38a169" : "#e53e3e" }}>
                              {ev.outcome >= 0.5 ? "✓ Correct" : "✗ Wrong"}
                            </span>
                            <span style={{ fontSize: 10, color: "#a0aec0" }}>
                              {ev.response_time_ms ? `${(ev.response_time_ms / 1000).toFixed(1)}s` : ""}
                              {" · "}
                              {new Date(ev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {ev.misconception && (
                            <div style={{ marginTop: 4 }}>
                              <span style={{
                                display: "inline-block",
                                padding: "1px 7px",
                                borderRadius: 10,
                                fontSize: 10,
                                fontWeight: 700,
                                backgroundColor: (MISC_COLORS[ev.misconception.type] ?? "#718096") + "20",
                                color: MISC_COLORS[ev.misconception.type] ?? "#718096",
                                marginBottom: 3,
                              }}>
                                {ev.misconception.type}
                              </span>
                              <div style={{ fontSize: 11, color: "#4a5568", lineHeight: 1.4 }}>{ev.misconception.misconception}</div>
                              <div style={{ fontSize: 10, color: "#718096", marginTop: 3, fontStyle: "italic" }}>
                                → {ev.misconception.intervention}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={s.panelSection}>
              <span className={s.panelValue} style={{ fontStyle: "italic", color: "#a0aec0" }}>No attempts yet</span>
            </div>
          )}

          <div className={s.panelSection}>
            <span className={s.panelLabel}>Description</span>
            <span className={s.panelValue}>{selectedNode.description}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function boxEdgePoint(bx: number, by: number, bw: number, bh: number, targetX: number, targetY: number): [number, number] {
  const cx = bx + bw / 2; const cy = by + bh / 2;
  const dx = targetX - cx; const dy = targetY - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const scale = Math.min((bw / 2) / (Math.abs(dx) || Infinity), (bh / 2) / (Math.abs(dy) || Infinity));
  return [cx + dx * scale, cy + dy * scale];
}
