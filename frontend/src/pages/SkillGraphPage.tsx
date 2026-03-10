import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  useSkillGraph,
  type CompetencyInfo,
  type PillarInfo,
  type CapabilityInfo,
} from "@/api/hooks/useCompetencies";
import * as s from "./SkillGraphPage.css";

/* ── Types ── */

interface GraphNode {
  id: string;
  name: string;
  description: string;
  assessment_method: string;
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

/* ── Layout constants ── */

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

/* ── Helpers ── */

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

export default function SkillGraphPage() {
  const { data, isLoading, error } = useSkillGraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cameraRef = useRef({ x: 60, y: 60, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: GraphNode; screenX: number; screenY: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  /* ── Build layout ── */

  const { nodes, links, nodeMap, pillarBoxes, pillars } = useMemo(() => {
    if (!data) return { nodes: [], links: [], nodeMap: new Map<string, GraphNode>(), pillarBoxes: [] as any[], totalW: 0, totalH: 0, pillars: [] as PillarInfo[] };

    const pMap = new Map<string, PillarInfo>();
    for (const p of data.pillars) pMap.set(p.id, p);
    const cMap = new Map<string, CapabilityInfo>();
    for (const c of data.capabilities) cMap.set(c.id, c);

    // Group: pillar → capability → competencies
    const pillarOrder = data.pillars.map((p) => p.id);
    const capsByPillar = new Map<string, CapabilityInfo[]>();
    for (const cap of data.capabilities) {
      const list = capsByPillar.get(cap.pillar_id) ?? [];
      list.push(cap);
      capsByPillar.set(cap.pillar_id, list);
    }
    const compsByCap = new Map<string, CompetencyInfo[]>();
    for (const c of data.competencies) {
      const list = compsByCap.get(c.capability_id) ?? [];
      list.push(c);
      compsByCap.set(c.capability_id, list);
    }

    // Layout each pillar as a column
    const allNodes: GraphNode[] = [];
    const nMap = new Map<string, GraphNode>();
    const boxes: { pillarId: string; color: string; name: string; x: number; y: number; w: number; h: number }[] = [];

    let cursorX = 0;
    let maxH = 0;

    for (const pId of pillarOrder) {
      const pillar = pMap.get(pId)!;
      const caps = capsByPillar.get(pId) ?? [];

      // Determine column count: how many comps in widest capability
      const COLS = 3;
      let cursorY = PILLAR_PAD_Y + HEADER_H;

      let pillarW = COLS * NODE_W + (COLS - 1) * COL_GAP + PILLAR_PAD_X * 2;

      for (const cap of caps) {
        const comps = compsByCap.get(cap.id) ?? [];
        if (!comps.length) continue;

        // Capability header space
        cursorY += 28;

        // Layout comps in rows of COLS
        for (let i = 0; i < comps.length; i++) {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = cursorX + PILLAR_PAD_X + col * (NODE_W + COL_GAP);
          const y = cursorY + row * (NODE_H + ROW_GAP);

          const c = comps[i]!;
          const node: GraphNode = {
            id: c.id,
            name: c.name,
            description: c.description,
            assessment_method: c.assessment_method,
            capability_id: c.capability_id,
            pillarId: pId,
            pillarColor: pillar.color,
            pillarName: pillar.name,
            capabilityName: cap.name,
            x,
            y,
          };
          allNodes.push(node);
          nMap.set(c.id, node);
        }

        const rows = Math.ceil(comps.length / COLS);
        cursorY += rows * (NODE_H + ROW_GAP) + CAP_GAP;
      }

      const pillarH = cursorY + PILLAR_PAD_Y;
      boxes.push({
        pillarId: pId,
        color: pillar.color,
        name: pillar.name,
        x: cursorX,
        y: 0,
        w: pillarW,
        h: pillarH,
      });

      if (pillarH > maxH) maxH = pillarH;
      cursorX += pillarW + PILLAR_GAP;
    }

    // Normalize pillar box heights
    for (const b of boxes) b.h = maxH;

    const allLinks: GraphLink[] = [];
    const nodeIdSet = new Set(allNodes.map((n) => n.id));
    for (const e of data.prerequisite_edges) {
      if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id)) {
        allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "prerequisite" });
      }
    }
    for (const e of data.codevelopment_edges) {
      if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id)) {
        allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "codevelopment" });
      }
    }

    return {
      nodes: allNodes,
      links: allLinks,
      nodeMap: nMap,
      pillarBoxes: boxes,
      totalW: cursorX,
      totalH: maxH,
      pillars: data.pillars,
    };
  }, [data]);

  /* ── Filtered view ── */

  const visibleNodes = useMemo(() => {
    if (!activePillar) return nodes;
    return nodes.filter((n) => n.pillarId === activePillar);
  }, [nodes, activePillar]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleLinks = useMemo(() => {
    if (!activePillar) return links;
    return links.filter((l) => visibleNodeIds.has(l.sourceId) && visibleNodeIds.has(l.targetId));
  }, [links, activePillar, visibleNodeIds]);

  const crossLinks = useMemo(() => {
    if (!activePillar) return [];
    return links.filter((l) => {
      const sIn = visibleNodeIds.has(l.sourceId);
      const tIn = visibleNodeIds.has(l.targetId);
      return (sIn && !tIn) || (!sIn && tIn);
    });
  }, [links, activePillar, visibleNodeIds]);

  /* ── Selected node neighbors ── */

  const { highlightIds, highlightLinks, inboundNodes, outboundNodes } = useMemo(() => {
    if (!selectedNode) return { highlightIds: null, highlightLinks: null, inboundNodes: [] as GraphNode[], outboundNodes: [] as GraphNode[] };

    const id = selectedNode.id;
    const hIds = new Set<string>([id]);
    const hLinks: GraphLink[] = [];
    const inbound: GraphNode[] = [];
    const outbound: GraphNode[] = [];

    for (const l of links) {
      if (l.sourceId === id) {
        hIds.add(l.targetId);
        hLinks.push(l);
        const n = nodeMap.get(l.targetId);
        if (n) outbound.push(n);
      }
      if (l.targetId === id) {
        hIds.add(l.sourceId);
        hLinks.push(l);
        const n = nodeMap.get(l.sourceId);
        if (n) inbound.push(n);
      }
    }

    return { highlightIds: hIds, highlightLinks: hLinks, inboundNodes: inbound, outboundNodes: outbound };
  }, [selectedNode, links, nodeMap]);

  /* ── Hit testing ── */

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const cam = cameraRef.current;
    return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
  }, []);

  const findNodeAt = useCallback(
    (sx: number, sy: number): GraphNode | null => {
      const { x, y } = screenToWorld(sx, sy);
      for (const n of visibleNodes) {
        if (x >= n.x && x <= n.x + NODE_W && y >= n.y && y <= n.y + NODE_H) return n;
      }
      return null;
    },
    [screenToWorld, visibleNodes],
  );

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

    // Draw pillar background boxes
    for (const box of pillarBoxes) {
      if (activePillar && box.pillarId !== activePillar) continue;
      ctx.fillStyle = box.color + "08";
      ctx.strokeStyle = box.color + "25";
      ctx.lineWidth = 1.5;
      const r = 12;
      const bx = box.x;
      const by = box.y;
      const bw = box.w;
      const bh = box.h;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh - r);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      ctx.lineTo(bx + r, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pillar title
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = box.color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(box.name, box.x + PILLAR_PAD_X, box.y + 16);
    }

    // Draw capability labels
    {
      const drawnCaps = new Set<string>();
      for (const node of visibleNodes) {
        if (drawnCaps.has(node.capability_id)) continue;
        drawnCaps.add(node.capability_id);
        // Find first node of this capability to position the label
        ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = node.pillarColor + "90";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(node.capabilityName.toUpperCase(), node.x, node.y - 6);
      }
    }

    // When a node is selected, only draw its connected edges highlighted
    const edgesToDraw = highlightLinks ?? [...crossLinks, ...visibleLinks];
    for (const link of edgesToDraw) {
      const src = nodeMap.get(link.sourceId);
      const tgt = nodeMap.get(link.targetId);
      if (!src || !tgt) continue;
      const isCross = highlightLinks ? false : crossLinks.includes(link);
      const isHighlighted = highlightLinks ? true : false;
      drawEdge(ctx, src, tgt, link.type, isCross && !isHighlighted, isHighlighted ? src.pillarColor : undefined);
    }

    // Draw visible nodes
    for (const node of visibleNodes) {
      const isHovered = hoveredNode?.node.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isDimmed = highlightIds != null && !highlightIds.has(node.id);

      // Rounded rect
      const r = 8;
      const nx = node.x;
      const ny = node.y;
      ctx.globalAlpha = isDimmed ? 0.15 : 1;
      ctx.beginPath();
      ctx.moveTo(nx + r, ny);
      ctx.lineTo(nx + NODE_W - r, ny);
      ctx.quadraticCurveTo(nx + NODE_W, ny, nx + NODE_W, ny + r);
      ctx.lineTo(nx + NODE_W, ny + NODE_H - r);
      ctx.quadraticCurveTo(nx + NODE_W, ny + NODE_H, nx + NODE_W - r, ny + NODE_H);
      ctx.lineTo(nx + r, ny + NODE_H);
      ctx.quadraticCurveTo(nx, ny + NODE_H, nx, ny + NODE_H - r);
      ctx.lineTo(nx, ny + r);
      ctx.quadraticCurveTo(nx, ny, nx + r, ny);
      ctx.closePath();

      // Fill
      ctx.fillStyle = isSelected ? node.pillarColor : isHovered ? node.pillarColor + "18" : "#ffffff";
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? node.pillarColor : isHovered ? node.pillarColor : node.pillarColor + "50";
      ctx.lineWidth = isSelected || isHovered ? 2 : 1;
      ctx.stroke();

      // Color accent bar on left
      ctx.fillStyle = node.pillarColor;
      ctx.beginPath();
      ctx.moveTo(nx + r, ny);
      ctx.lineTo(nx + 5, ny);
      ctx.lineTo(nx + 5, ny + NODE_H);
      ctx.lineTo(nx + r, ny + NODE_H);
      ctx.quadraticCurveTo(nx, ny + NODE_H, nx, ny + NODE_H - r);
      ctx.lineTo(nx, ny + r);
      ctx.quadraticCurveTo(nx, ny, nx + r, ny);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = isSelected ? "#ffffff" : "#1a1a2e";

      const textX = nx + 12;
      const textMaxW = NODE_W - 20;
      const textLines = wrapText(ctx, node.name, textMaxW);
      const lineH = 14;
      const textY = ny + (NODE_H - textLines.length * lineH) / 2;
      for (let i = 0; i < Math.min(textLines.length, 3); i++) {
        ctx.fillText(textLines[i]!, textX, textY + i * lineH);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(draw);
  }, [visibleNodes, visibleLinks, crossLinks, pillarBoxes, nodeMap, activePillar, hoveredNode, selectedNode, highlightIds, highlightLinks]);

  function drawEdge(
    ctx: CanvasRenderingContext2D,
    src: GraphNode,
    tgt: GraphNode,
    type: "prerequisite" | "codevelopment",
    dimmed: boolean,
    accentColor?: string,
  ) {
    const sx = src.x + NODE_W / 2;
    const sy = src.y + NODE_H / 2;
    const tx = tgt.x + NODE_W / 2;
    const ty = tgt.y + NODE_H / 2;

    const [x1, y1] = boxEdgePoint(src.x, src.y, NODE_W, NODE_H, tx, ty);
    const [x2, y2] = boxEdgePoint(tgt.x, tgt.y, NODE_W, NODE_H, sx, sy);

    ctx.beginPath();
    if (Math.abs(src.x - tgt.x) > NODE_W + COL_GAP) {
      const midX = (x1 + x2) / 2;
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
    } else {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }

    if (accentColor) {
      ctx.setLineDash(type === "codevelopment" ? [5, 4] : []);
      ctx.strokeStyle = accentColor + "90";
      ctx.lineWidth = 2.5;
    } else if (type === "codevelopment") {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = dimmed ? "rgba(150,150,150,0.15)" : "rgba(150,150,150,0.3)";
      ctx.lineWidth = 1;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = dimmed ? "rgba(100,100,100,0.15)" : "rgba(100,100,100,0.5)";
      ctx.lineWidth = 1.2;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead for prerequisite
    if (type === "prerequisite") {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const ux = dx / len;
        const uy = dy / len;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * ARROW_SIZE + uy * ARROW_SIZE * 0.4, y2 - uy * ARROW_SIZE - ux * ARROW_SIZE * 0.4);
        ctx.lineTo(x2 - ux * ARROW_SIZE - uy * ARROW_SIZE * 0.4, y2 - uy * ARROW_SIZE + ux * ARROW_SIZE * 0.4);
        ctx.closePath();
        ctx.fillStyle = accentColor ? accentColor + "B0" : dimmed ? "rgba(100,100,100,0.2)" : "rgba(100,100,100,0.55)";
        ctx.fill();
      }
    }
  }

  /* ── Start render loop ── */

  useEffect(() => {
    if (!nodes.length) return;
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, draw]);

  /* ── Mouse handlers ── */

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = findNodeAt(mx, my);
      if (node) {
        setHoveredNode({ node, screenX: e.clientX, screenY: e.clientY });
        if (canvasRef.current) canvasRef.current.style.cursor = "pointer";
      } else {
        setHoveredNode(null);
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }
    },
    [findNodeAt],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        // Check if it was a click (no movement)
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          const rect = canvasRef.current!.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const node = findNodeAt(mx, my);
          if (node) setSelectedNode(node);
          else setSelectedNode(null);
        }
      }
      isPanningRef.current = false;
    },
    [findNodeAt],
  );

  const handleResetZoom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cameraRef.current = { x: 60, y: 60, zoom: 1 };
  }, []);

  /* ── Pillar counts ── */

  const pillarCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of nodes) counts.set(n.pillarId, (counts.get(n.pillarId) ?? 0) + 1);
    return counts;
  }, [nodes]);

  /* ── Render ── */

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.loadingOverlay}>
          <span className={s.loadingText}>Loading skill graph...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={s.page}>
        <div className={s.loadingOverlay}>
          <span className={s.loadingText}>Failed to load skill graph.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {/* Filter bar */}
      <div className={s.filterBar}>
        <div className={s.filterTitle}>MindSpark Skill Graph</div>
        <div className={s.filterTabs}>
          {pillars.map((p) => (
            <button
              key={p.id}
              className={`${s.filterTab} ${activePillar === p.id ? s.filterTabActive : ""}`}
              style={{
                borderColor: activePillar === p.id ? p.color : "transparent",
                color: activePillar === p.id ? p.color : undefined,
              }}
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
        <div className={s.filterLegend}>
          <span style={{ display: "inline-block", width: 20, height: 2, backgroundColor: "rgba(100,100,100,0.5)" }} />
          <span>Prerequisite</span>
          <span style={{ display: "inline-block", width: 20, borderTop: "2px dashed rgba(150,150,150,0.5)" }} />
          <span>Co-development</span>
          <span className={s.filterCount} style={{ marginLeft: 8 }}>
            {visibleNodes.length} nodes &middot; {visibleLinks.length} edges
          </span>
        </div>
      </div>

      {/* Canvas */}
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
        <button className={s.controlBtn} onClick={() => { const cam = cameraRef.current; const c = canvasRef.current!; const cx = c.clientWidth / 2; const cy = c.clientHeight / 2; const nz = Math.min(4, cam.zoom * 1.15); cam.x = cx - ((cx - cam.x) / cam.zoom) * nz; cam.y = cy - ((cy - cam.y) / cam.zoom) * nz; cam.zoom = nz; }} title="Zoom in">+</button>
        <button className={s.controlBtn} onClick={() => { const cam = cameraRef.current; const c = canvasRef.current!; const cx = c.clientWidth / 2; const cy = c.clientHeight / 2; const nz = Math.max(0.15, cam.zoom / 1.15); cam.x = cx - ((cx - cam.x) / cam.zoom) * nz; cam.y = cy - ((cy - cam.y) / cam.zoom) * nz; cam.zoom = nz; }} title="Zoom out">-</button>
        <button className={s.controlBtn} onClick={handleResetZoom} title="Reset" style={{ fontSize: 12 }}>R</button>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div className={s.tooltip} style={{ left: hoveredNode.screenX + 14, top: hoveredNode.screenY - 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{hoveredNode.node.name}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>{hoveredNode.node.description}</div>
        </div>
      )}

      {/* Side panel */}
      {selectedNode && (
        <div className={s.sidePanel}>
          <button className={s.panelClose} onClick={() => setSelectedNode(null)}>&times;</button>
          <h2 className={s.panelTitle}>{selectedNode.name}</h2>
          <span className={s.panelPillarBadge} style={{ backgroundColor: selectedNode.pillarColor + "20", color: selectedNode.pillarColor }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: selectedNode.pillarColor, display: "inline-block" }} />
            {selectedNode.pillarName}
          </span>
          <div className={s.panelSection}>
            <span className={s.panelLabel}>Capability</span>
            <span className={s.panelValue}>{selectedNode.capabilityName}</span>
          </div>
          <div className={s.panelSection}>
            <span className={s.panelLabel}>Description</span>
            <span className={s.panelValue}>{selectedNode.description}</span>
          </div>

          {inboundNodes.length > 0 && (
            <div className={s.panelSection}>
              <span className={s.panelLabel}>Prerequisites (inbound)</span>
              {inboundNodes.map((n) => (
                <button
                  key={n.id}
                  className={s.panelEdgeItem}
                  style={{ borderLeftColor: n.pillarColor }}
                  onClick={() => setSelectedNode(n)}
                >
                  {n.name}
                  <span className={s.panelEdgeSub}>{n.capabilityName}</span>
                </button>
              ))}
            </div>
          )}

          {outboundNodes.length > 0 && (
            <div className={s.panelSection}>
              <span className={s.panelLabel}>Leads to (outbound)</span>
              {outboundNodes.map((n) => (
                <button
                  key={n.id}
                  className={s.panelEdgeItem}
                  style={{ borderLeftColor: n.pillarColor }}
                  onClick={() => setSelectedNode(n)}
                >
                  {n.name}
                  <span className={s.panelEdgeSub}>{n.capabilityName}</span>
                </button>
              ))}
            </div>
          )}

          {inboundNodes.length === 0 && outboundNodes.length === 0 && (
            <div className={s.panelSection}>
              <span className={s.panelValue} style={{ fontStyle: "italic" }}>No connections</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Find the point on a box edge closest to an external target point */
function boxEdgePoint(
  bx: number, by: number, bw: number, bh: number,
  targetX: number, targetY: number,
): [number, number] {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;

  if (dx === 0 && dy === 0) return [cx, cy];

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const scaleX = (bw / 2) / absDx;
  const scaleY = (bh / 2) / absDy;
  const scale = Math.min(scaleX || Infinity, scaleY || Infinity);

  return [cx + dx * scale, cy + dy * scale];
}
