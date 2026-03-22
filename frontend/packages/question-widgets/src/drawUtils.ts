// ─── Types ───────────────────────────────────────────────────────────────────

export type ToolType = "select" | "pen" | "rect" | "circle" | "diamond" | "arrow" | "eraser";

export interface Shape {
  id: string;
  type: "rect" | "circle" | "diamond" | "arrow" | "pen";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string;
  points?: { x: number; y: number }[];
}

let _shapeId = 0;
export const genId = () => `s${++_shapeId}`;

export const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: "select", label: "Select", icon: "↖" },
  { id: "pen", label: "Pen", icon: "✏" },
  { id: "rect", label: "Rect", icon: "▭" },
  { id: "circle", label: "Circle", icon: "○" },
  { id: "diamond", label: "Diamond", icon: "◇" },
  { id: "arrow", label: "Arrow", icon: "→" },
  { id: "eraser", label: "Erase", icon: "⌫" },
];

export const COLORS = ["#1a202c", "#7C3AED", "#E53E3E", "#3182CE", "#38A169", "#D69E2E"];

// ─── Canvas helpers ──────────────────────────────────────────────────────────

export function getCanvasPos(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width, sy = canvas.height / r.height;
  if ("touches" in e) {
    const t = e.touches[0];
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
  }
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
}

// ─── Hit testing ─────────────────────────────────────────────────────────────

export function hitTest(s: Shape, px: number, py: number): boolean {
  const pad = 6;
  if (s.type === "pen" && s.points) {
    return s.points.some(p => Math.abs(p.x - px) < 8 && Math.abs(p.y - py) < 8);
  }
  if (s.type === "arrow") {
    const minX = Math.min(s.x, s.x + s.w) - pad;
    const minY = Math.min(s.y, s.y + s.h) - pad;
    const maxX = Math.max(s.x, s.x + s.w) + pad;
    const maxY = Math.max(s.y, s.y + s.h) + pad;
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }
  return px >= s.x - pad && px <= s.x + s.w + pad && py >= s.y - pad && py <= s.y + s.h + pad;
}

/** Get the center point of a shape (for placing text labels) */
export function shapeCenter(s: Shape): { x: number; y: number } {
  if (s.type === "arrow") return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// ─── Shape rendering ────────────────────────────────────────────────────────

function drawShapeBody(ctx: CanvasRenderingContext2D, s: Shape) {
  switch (s.type) {
    case "rect":
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      break;
    case "circle": {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(s.w) / 2, Math.abs(s.h) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "diamond": {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const hw = Math.abs(s.w) / 2, hh = Math.abs(s.h) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx - hw, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "arrow": {
      const ex = s.x + s.w, ey = s.y + s.h;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const a = Math.atan2(s.h, s.w), hl = 12;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hl * Math.cos(a - 0.4), ey - hl * Math.sin(a - 0.4));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hl * Math.cos(a + 0.4), ey - hl * Math.sin(a + 0.4));
      ctx.stroke();
      break;
    }
    case "pen": {
      if (!s.points || s.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
      break;
    }
  }
}

function drawLabel(ctx: CanvasRenderingContext2D, s: Shape) {
  if (!s.text) return;
  const c = shapeCenter(s);
  ctx.save();
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (s.type === "arrow") {
    // White background pill behind text on arrows
    const m = ctx.measureText(s.text);
    const pw = m.width + 10, ph = 16;
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(c.x - pw / 2, c.y - ph / 2, pw, ph, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = s.color;
    ctx.fillText(s.text, c.x, c.y);
  } else {
    // Text inside shape
    ctx.fillStyle = s.color;
    ctx.fillText(s.text, c.x, c.y);
  }
  ctx.restore();
}

function drawSelection(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#7C3AED";
  ctx.lineWidth = 1.5;
  const pad = 4;
  if (s.type === "pen" && s.points) {
    const xs = s.points.map(p => p.x), ys = s.points.map(p => p.y);
    ctx.strokeRect(Math.min(...xs) - pad, Math.min(...ys) - pad,
      Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2);
  } else if (s.type === "arrow") {
    const minX = Math.min(s.x, s.x + s.w), minY = Math.min(s.y, s.y + s.h);
    ctx.strokeRect(minX - pad, minY - pad, Math.abs(s.w) + pad * 2, Math.abs(s.h) + pad * 2);
  } else {
    ctx.strokeRect(s.x - pad, s.y - pad, s.w + pad * 2, s.h + pad * 2);
  }
}

export function drawShape(ctx: CanvasRenderingContext2D, s: Shape, selected: boolean) {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawShapeBody(ctx, s);
  drawLabel(ctx, s);
  if (selected) drawSelection(ctx, s);
  ctx.restore();
}

export function renderCanvas(canvas: HTMLCanvasElement, shapes: Shape[], selectedId: string | null) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  shapes.forEach(s => drawShape(ctx, s, s.id === selectedId));
}

export function drawPenSegment(canvas: HTMLCanvasElement, pts: { x: number; y: number }[], color: string) {
  if (pts.length < 2) return;
  const ctx = canvas.getContext("2d")!;
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
}
