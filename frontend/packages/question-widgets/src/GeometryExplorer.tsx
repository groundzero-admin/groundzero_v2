import { useState, useRef, useEffect, useCallback } from "react";
import type { QuestionProps } from "./shared";
import {
  CARD, HEADING, OPT, OPT_SEL, OPT_CORRECT as OPT_OK, OPT_WRONG as OPT_BAD,
  RADIO, RADIO_SEL, RADIO_OK, RADIO_BAD, BTN, FEEDBACK_OK, FEEDBACK_ERR,
  str, arr,
} from "./shared";

type Mode = "angle_drag" | "angle_slider" | "shape_explorer";

const SHAPE_NAMES: Record<number, string> = {
  3: "Triangle", 4: "Quadrilateral", 5: "Pentagon", 6: "Hexagon",
  7: "Heptagon", 8: "Octagon", 9: "Nonagon", 10: "Decagon",
  11: "Hendecagon", 12: "Dodecagon",
};

function getAngleType(a: number): { label: string; color: string } {
  if (a === 0)   return { label: "Zero",           color: "#718096" };
  if (a === 90)  return { label: "Right angle ✓",  color: "#38A169" };
  if (a === 180) return { label: "Straight",        color: "#718096" };
  if (a < 90)   return { label: "Acute",            color: "#3182CE" };
  if (a < 180)  return { label: "Obtuse",           color: "#D69E2E" };
  return               { label: "Reflex",            color: "#E53E3E" };
}

function arcPath(vx: number, vy: number, r: number, angleDeg: number): string {
  if (angleDeg <= 0) return "";
  const a = Math.min(angleDeg, 359.9);
  const endX = vx + r * Math.cos((a * Math.PI) / 180);
  const endY = vy - r * Math.sin((a * Math.PI) / 180);
  return `M ${vx + r},${vy} A ${r},${r} 0 ${a > 180 ? 1 : 0},0 ${endX.toFixed(2)},${endY.toFixed(2)}`;
}

function polyPoints(n: number, cx: number, cy: number, r: number): string {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

const VX = 70, VY = 140, RAY_LEN = 175, ARC_R = 46;

function AngleSVG({ angle, color, showHandle, onHandleMouseDown, onHandleTouchStart }: {
  angle: number; color: string; showHandle: boolean;
  onHandleMouseDown?: (e: React.MouseEvent) => void;
  onHandleTouchStart?: (e: React.TouchEvent) => void;
}) {
  const rad = (angle * Math.PI) / 180;
  const hx = VX + RAY_LEN * Math.cos(rad);
  const hy = VY - RAY_LEN * Math.sin(rad);
  const tx = Math.cos(rad), ty = -Math.sin(rad);
  const nx = -ty, ny = tx;
  const ax = hx - tx * 10, ay = hy - ty * 10;
  const isRight = Math.abs(angle - 90) < 1.5;

  return (
    <svg viewBox="0 0 320 185" style={{ width: "100%", height: 170, display: "block" }}>
      <line x1={VX} y1={VY} x2={VX + RAY_LEN} y2={VY} stroke="#CBD5E0" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points={`${VX + RAY_LEN},${VY} ${VX + RAY_LEN - 8},${VY - 4} ${VX + RAY_LEN - 8},${VY + 4}`} fill="#CBD5E0" />
      {!isRight && angle > 0 && <path d={arcPath(VX, VY, ARC_R, angle)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />}
      {isRight && <polyline points={`${VX + 22},${VY} ${VX + 22},${VY - 22} ${VX},${VY - 22}`} fill="none" stroke="#38A169" strokeWidth="2" />}
      {angle > 8 && angle < 352 && (() => {
        const mid = (angle / 2) * (Math.PI / 180);
        const lr = ARC_R + (angle < 30 ? 20 : 16);
        return <text x={(VX + lr * Math.cos(mid)).toFixed(2)} y={(VY - lr * Math.sin(mid)).toFixed(2)} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="800" fill={color}>{angle}°</text>;
      })()}
      <line x1={VX} y1={VY} x2={hx} y2={hy} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polygon points={`${hx},${hy} ${ax + nx * 4},${ay + ny * 4} ${ax - nx * 4},${ay - ny * 4}`} fill={color} />
      <circle cx={VX} cy={VY} r="5" fill="#2D3748" />
      {showHandle && <>
        <circle cx={hx} cy={hy} r="14" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5" style={{ cursor: "grab" }} onMouseDown={onHandleMouseDown} onTouchStart={onHandleTouchStart} />
        <circle cx={hx} cy={hy} r="5" fill={color} style={{ pointerEvents: "none" }} />
      </>}
    </svg>
  );
}

function StatBadge({ angle, label, color }: { angle: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
      <div style={{ textAlign: "center", padding: "8px 28px", borderRadius: 10, background: "#fff", border: `2px solid ${color}`, transition: "border-color 0.2s" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, transition: "color 0.2s" }}>{angle}°</div>
        <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2, transition: "color 0.2s" }}>{label}</div>
      </div>
    </div>
  );
}

function AngleDragMode() {
  const [angle, setAngle] = useState(45);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { label, color } = getAngleType(angle);

  const angleFromClient = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const renderedH = containerRef.current.querySelector("svg")?.clientHeight ?? 170;
    const svgX = (clientX - rect.left) * (320 / rect.width);
    const svgY = (clientY - rect.top) * (185 / renderedH);
    const dx = svgX - VX, dy = svgY - VY;
    if (Math.hypot(dx, dy) < 8) return null;
    const raw = Math.atan2(-dy, dx) * (180 / Math.PI);
    return Math.round(((raw % 360) + 360) % 360);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => { const a = angleFromClient(e.clientX, e.clientY); if (a !== null) setAngle(a); };
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; const a = angleFromClient(t.clientX, t.clientY); if (a !== null) setAngle(a); };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, angleFromClient]);

  return (
    <div>
      <div ref={containerRef} style={{ cursor: dragging ? "grabbing" : "default" }}>
        <AngleSVG angle={angle} color={color} showHandle
          onHandleMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
          onHandleTouchStart={(e) => { e.preventDefault(); setDragging(true); }}
        />
      </div>
      <StatBadge angle={angle} label={label} color={color} />
      <div style={{ textAlign: "center", fontSize: 11, color: "#a0aec0", marginTop: 4 }}>Drag the handle ● to change the angle</div>
    </div>
  );
}

function AngleSliderMode() {
  const [angle, setAngle] = useState(60);
  const { label, color } = getAngleType(angle);
  return (
    <div>
      <AngleSVG angle={angle} color={color} showHandle={false} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" }}>
        <span style={{ fontSize: 11, color: "#718096", minWidth: 20 }}>0°</span>
        <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ flex: 1, accentColor: color, cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "#718096", minWidth: 30 }}>360°</span>
      </div>
      <StatBadge angle={angle} label={label} color={color} />
    </div>
  );
}

const CX = 158, CY = 100, POLY_R = 72;

function ShapeExplorerMode() {
  const [sides, setSides] = useState(5);
  const interior = Math.round(((sides - 2) * 180) / sides);
  const sum = (sides - 2) * 180;
  const name = SHAPE_NAMES[sides] ?? `${sides}-gon`;
  const color = "#805AD5";

  const arcEl = (() => {
    const startA = -Math.PI / 2;
    const vx = CX + POLY_R * Math.cos(startA), vy = CY + POLY_R * Math.sin(startA);
    const prevA = startA - (2 * Math.PI) / sides;
    const nextA = startA + (2 * Math.PI) / sides;
    const px = CX + POLY_R * Math.cos(prevA), py = CY + POLY_R * Math.sin(prevA);
    const nx2 = CX + POLY_R * Math.cos(nextA), ny2 = CY + POLY_R * Math.sin(nextA);
    const d1 = { x: px - vx, y: py - vy }, d2 = { x: nx2 - vx, y: ny2 - vy };
    const u1 = { x: d1.x / Math.hypot(d1.x, d1.y), y: d1.y / Math.hypot(d1.x, d1.y) };
    const u2 = { x: d2.x / Math.hypot(d2.x, d2.y), y: d2.y / Math.hypot(d2.x, d2.y) };
    const ar = 18;
    const p1 = { x: vx + u1.x * ar, y: vy + u1.y * ar };
    const p2 = { x: vx + u2.x * ar, y: vy + u2.y * ar };
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const fromV = { x: mid.x - vx, y: mid.y - vy };
    const fLen = Math.hypot(fromV.x, fromV.y);
    const lx = vx + (fromV.x / fLen) * (ar + 14);
    const ly = vy + (fromV.y / fLen) * (ar + 14);
    return (
      <g>
        <path d={`M ${p1.x.toFixed(2)},${p1.y.toFixed(2)} A ${ar},${ar} 0 0,1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`} fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" />
        <text x={lx.toFixed(2)} y={ly.toFixed(2)} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#E53E3E">{interior}°</text>
      </g>
    );
  })();

  return (
    <div>
      <svg viewBox="0 0 320 185" style={{ width: "100%", height: 170, display: "block" }}>
        <polygon points={polyPoints(sides, CX, CY, POLY_R)} fill={`${color}18`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {arcEl}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={color} opacity="0.55">{name}</text>
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" }}>
        <span style={{ fontSize: 11, color: "#718096" }}>3</span>
        <input type="range" min={3} max={12} value={sides} onChange={(e) => setSides(Number(e.target.value))} style={{ flex: 1, accentColor: color, cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "#718096" }}>12</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
        {[{ label: "Sides", value: String(sides) }, { label: "Each angle", value: `${interior}°` }, { label: "Sum", value: `${sum}°` }].map(({ label, value }) => (
          <div key={label} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function McqSection({
  question,
  options,
  correctAnswer,
  hint,
  onAnswer,
  resetKey,
  multiStepMode = false,
}: {
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  onAnswer?: ((a: unknown) => void) | null;
  resetKey?: number;
  multiStepMode?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setSelected(null);
    setSubmitted(false);
  }, [resetKey]);
  const correct = (opt: string) => opt.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  const optStyle = (i: number, opt: string) => {
    if (!submitted) return selected === i ? OPT_SEL : OPT;
    if (selected === i) return correct(opt) ? OPT_OK : OPT_BAD;
    return correct(opt) ? OPT_OK : OPT;
  };
  const radioStyle = (i: number, opt: string) => {
    if (!submitted) return selected === i ? RADIO_SEL : RADIO;
    if (selected === i) return correct(opt) ? RADIO_OK : RADIO_BAD;
    return correct(opt) ? RADIO_OK : RADIO;
  };
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
      <div style={HEADING}>{question}</div>
      {options.map((opt, i) => (
        <div
          key={i}
          style={optStyle(i, opt)}
          onClick={() => {
            if (submitted) return;
            setSelected(i);
            if (multiStepMode) {
              onAnswer?.({ selected: options[i], correct: correct(options[i] ?? "") });
            }
          }}
        >
          <span style={radioStyle(i, opt)} />{opt}
        </div>
      ))}
      {selected !== null && !submitted && !multiStepMode && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button style={BTN} onClick={() => { setSubmitted(true); onAnswer?.({ selected: options[selected!], correct: correct(options[selected!] ?? "") }); }}>Submit</button>
        </div>
      )}
      {submitted && (
        <div style={correct(options[selected!] ?? "") ? FEEDBACK_OK : FEEDBACK_ERR}>
          {correct(options[selected!] ?? "") ? "Correct! Great exploration." : hint ? `Hint: ${hint}` : "Not quite — keep exploring and try again!"}
        </div>
      )}
    </div>
  );
}

export default function GeometryExplorer({ data, onAnswer, resetKey }: QuestionProps) {
  const mode = (str(data.mode) || "angle_drag") as Mode;
  const question = str(data.question);
  const options = arr(data.options);
  const correctAnswer = str(data.correct_answer);
  const hint = str(data.hint);
  const multiStepMode = data.__multi_step_mode === true;

  return (
    <div style={CARD}>
      {mode === "angle_drag"     && <AngleDragMode />}
      {mode === "angle_slider"   && <AngleSliderMode />}
      {mode === "shape_explorer" && <ShapeExplorerMode />}
      {question && options.length > 0 && (
        <McqSection
          question={question}
          options={options}
          correctAnswer={correctAnswer}
          hint={hint}
          onAnswer={onAnswer}
          resetKey={resetKey}
          multiStepMode={multiStepMode}
        />
      )}
    </div>
  );
}
