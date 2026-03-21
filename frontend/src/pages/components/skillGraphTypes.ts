/* ── Shared types, layout constants, and helpers for SkillGraphPage ── */

export interface GraphNode {
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

export interface GraphLink {
  sourceId: string;
  targetId: string;
  type: "prerequisite" | "codevelopment";
}

export interface PillarBox {
  pillarId: string;
  color: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ── Layout constants ── */

export const NODE_W = 150;
export const NODE_H = 52;
export const COL_GAP = 40;
export const ROW_GAP = 24;
export const CAP_GAP = 40;
export const PILLAR_PAD_X = 24;
export const PILLAR_PAD_Y = 50;
export const PILLAR_GAP = 36;
export const HEADER_H = 32;
export const ARROW_SIZE = 6;

/* ── Helpers ── */

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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

export function boxEdgePoint(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  targetX: number,
  targetY: number,
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
