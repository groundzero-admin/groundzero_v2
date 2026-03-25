import type { VisualData } from "../api";

interface Props {
  visual: VisualData;
  color: string;
  accent: string;
}

export default function QuestionVisual({ visual, color, accent }: Props) {
  switch (visual.type) {
    case "sequence":
      return <SequenceVisual data={visual} color={color} accent={accent} />;
    case "fraction_compare":
      return <FractionCompareVisual data={visual} color={color} />;
    case "probability_bag":
      return <ProbabilityBagVisual data={visual} color={color} accent={accent} />;
    case "exponential_tree":
      return <ExponentialTreeVisual data={visual} color={color} accent={accent} />;
    case "robot_rules":
      return <RobotRulesVisual data={visual} color={color} />;
    case "equation_puzzle":
      return <EquationPuzzleVisual data={visual} color={color} accent={accent} />;
    case "scaling":
      return <ScalingVisual data={visual} color={color} accent={accent} />;
    case "venn":
      return <VennVisual data={visual} color={color} accent={accent} />;
    default:
      return null;
  }
}

/* ─── Sequence: [2, 4, 6, 8] → ? ─── */
function SequenceVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const items = (data.items as string[]) || [];
  const label = (data.label as string) || "?";

  return (
    <div className="qv-wrap">
      <div className="qv-seq-strip">
        {items.map((item, i) => (
          <div key={i} className="qv-seq-item" style={{ borderColor: color + "40", background: "#fff" }}>
            <span className="qv-seq-val">{item}</span>
          </div>
        ))}
        <div className="qv-seq-arrow" style={{ color: color }}>→</div>
        <div
          className="qv-seq-item qv-seq-mystery"
          style={{ borderColor: accent, background: accent + "10", borderStyle: "dashed" }}
        >
          <span className="qv-seq-val" style={{ color: accent }}>{label}</span>
        </div>
      </div>
      <style>{seqCSS}</style>
    </div>
  );
}

const seqCSS = `
.qv-seq-strip {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; flex-wrap: wrap; padding: 12px 8px;
}
.qv-seq-item {
  width: 48px; height: 48px; border-radius: 12px; border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Nunito', sans-serif; transition: transform 0.2s;
}
.qv-seq-item:hover { transform: scale(1.08); }
.qv-seq-val { font-size: 18px; font-weight: 800; color: #26221D; }
.qv-seq-mystery { animation: qvPulse 2s ease-in-out infinite; }
.qv-seq-arrow { font-size: 22px; font-weight: 800; margin: 0 2px; }
@keyframes qvPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@media (min-width: 640px) {
  .qv-seq-item { width: 56px; height: 56px; border-radius: 14px; }
  .qv-seq-val { font-size: 20px; }
  .qv-seq-strip { gap: 10px; padding: 16px 12px; }
}
`;

/* ─── Fraction Compare: two pizzas with different slices ─── */
function FractionCompareVisual({ data, color }: { data: VisualData; color: string }) {
  const left = (data.left_slices as number) || 4;
  const right = (data.right_slices as number) || 8;
  const leftLabel = (data.left_label as string) || `${left} slices`;
  const rightLabel = (data.right_label as string) || `${right} slices`;

  return (
    <div className="qv-wrap">
      <div className="qv-frac-row">
        <div className="qv-frac-pizza">
          <PizzaSVG slices={left} color={color} />
          <div className="qv-frac-label">{leftLabel}</div>
        </div>
        <div className="qv-frac-vs">vs</div>
        <div className="qv-frac-pizza">
          <PizzaSVG slices={right} color={color} />
          <div className="qv-frac-label">{rightLabel}</div>
        </div>
      </div>
      <style>{fracCSS}</style>
    </div>
  );
}

function PizzaSVG({ slices, color }: { slices: number; color: string }) {
  const r = 44;
  const cx = 50;
  const cy = 50;

  return (
    <svg viewBox="0 0 100 100" className="qv-pizza-svg">
      <circle cx={cx} cy={cy} r={r} fill="#FFF3E0" stroke="#E8A849" strokeWidth={2.5} />
      {Array.from({ length: slices }).map((_, i) => {
        const angle = (i * 360) / slices - 90;
        const rad = (angle * Math.PI) / 180;
        const x2 = cx + r * Math.cos(rad);
        const y2 = cy + r * Math.sin(rad);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1.5}
            opacity={0.5}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={5} fill="#E8A849" />
    </svg>
  );
}

const fracCSS = `
.qv-frac-row {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 8px;
}
.qv-frac-pizza { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.qv-pizza-svg { width: 80px; height: 80px; }
.qv-frac-label {
  font-size: 12px; font-weight: 700; color: #5A534D;
  font-family: 'Nunito', sans-serif;
}
.qv-frac-vs {
  font-size: 16px; font-weight: 900; color: #B5ADA5;
  font-family: 'Nunito', sans-serif;
}
@media (min-width: 640px) {
  .qv-pizza-svg { width: 100px; height: 100px; }
  .qv-frac-label { font-size: 13px; }
  .qv-frac-row { gap: 24px; }
}
`;

/* ─── Probability Bag: colored items in a bag ─── */
function ProbabilityBagVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const items = (data.items as Array<{ label: string; count: number; color: string }>) || [];
  const total = items.reduce((s, it) => s + it.count, 0);

  return (
    <div className="qv-wrap">
      <div className="qv-bag-container">
        <div className="qv-bag" style={{ borderColor: color + "40" }}>
          <div className="qv-bag-items">
            {items.flatMap((it, gi) =>
              Array.from({ length: it.count }).map((_, i) => (
                <div
                  key={`${gi}-${i}`}
                  className="qv-candy"
                  style={{ background: it.color, animationDelay: `${(gi * it.count + i) * 0.1}s` }}
                  title={it.label}
                />
              )),
            )}
          </div>
          <div className="qv-bag-bottom" style={{ background: color + "12" }} />
        </div>
        <div className="qv-bag-legend">
          {items.map((it, i) => (
            <span key={i} className="qv-bag-tag" style={{ background: it.color + "20", color: it.color, borderColor: it.color + "40" }}>
              <span className="qv-bag-dot" style={{ background: it.color }} />
              {it.count} {it.label}
            </span>
          ))}
          <span className="qv-bag-total" style={{ color: accent }}>Total: {total}</span>
        </div>
      </div>
      <style>{bagCSS}</style>
    </div>
  );
}

const bagCSS = `
.qv-bag-container { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px; }
.qv-bag {
  position: relative; width: 120px; min-height: 80px; padding: 12px 10px 20px;
  border: 2px solid; border-radius: 8px 8px 24px 24px;
  background: #fff; overflow: hidden;
}
.qv-bag-items { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; position: relative; z-index: 1; }
.qv-candy {
  width: 20px; height: 20px; border-radius: 50%;
  animation: qvCandyIn 0.3s ease-out both;
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15);
}
.qv-bag-bottom {
  position: absolute; bottom: 0; left: 0; right: 0; height: 20px;
  border-radius: 0 0 22px 22px;
}
.qv-bag-legend { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; align-items: center; }
.qv-bag-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 10px; border: 1px solid;
  font-size: 11px; font-weight: 700; font-family: 'Nunito', sans-serif;
}
.qv-bag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.qv-bag-total { font-size: 11px; font-weight: 800; font-family: 'Nunito', sans-serif; }
@keyframes qvCandyIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
@media (min-width: 640px) {
  .qv-bag { width: 140px; }
  .qv-candy { width: 22px; height: 22px; }
}
`;

/* ─── Exponential Tree: branching spread ─── */
function ExponentialTreeVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const branchFactor = (data.branch_factor as number) || 2;
  const levels = (data.levels as number) || 4;
  const label = (data.label as string) || "Each tells {n}";

  const rows: number[] = [];
  for (let i = 0; i < levels; i++) rows.push(Math.min(Math.pow(branchFactor, i), 16));

  return (
    <div className="qv-wrap">
      <div className="qv-tree">
        {rows.map((count, level) => (
          <div key={level} className="qv-tree-row">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="qv-tree-node"
                style={{
                  background: level === 0 ? color : accent,
                  animationDelay: `${level * 0.3 + i * 0.05}s`,
                  width: level === 0 ? 28 : Math.max(12, 24 - level * 3),
                  height: level === 0 ? 28 : Math.max(12, 24 - level * 3),
                }}
              >
                {level === 0 ? "🤫" : ""}
              </div>
            ))}
            {level < levels - 1 && (
              <div className="qv-tree-label" style={{ color: color }}>×{branchFactor}</div>
            )}
          </div>
        ))}
        <div className="qv-tree-hint" style={{ color: "#7A7168" }}>
          {label.replace("{n}", String(branchFactor))}
        </div>
      </div>
      <style>{treeCSS}</style>
    </div>
  );
}

const treeCSS = `
.qv-tree { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 8px; }
.qv-tree-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center; }
.qv-tree-node {
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #fff; animation: qvCandyIn 0.3s ease-out both;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.qv-tree-label {
  font-size: 11px; font-weight: 800; margin-left: 6px;
  font-family: 'Nunito', sans-serif;
}
.qv-tree-hint {
  font-size: 11px; font-weight: 600; margin-top: 4px;
  font-family: 'Nunito', sans-serif;
}
`;

/* ─── Robot Rules: colored rule cards ─── */
function RobotRulesVisual({ data, color }: { data: VisualData; color: string }) {
  const rules = (data.rules as Array<{ condition: string; action: string; emoji: string; color: string }>) || [];
  const unknown = (data.unknown as { condition: string; emoji: string }) || { condition: "yellow", emoji: "🟡" };

  return (
    <div className="qv-wrap">
      <div className="qv-robot">
        <div className="qv-robot-icon">🤖</div>
        <div className="qv-robot-rules">
          {rules.map((r, i) => (
            <div key={i} className="qv-rule" style={{ borderColor: r.color + "50", background: r.color + "10" }}>
              <span className="qv-rule-emoji">{r.emoji}</span>
              <span className="qv-rule-text">{r.condition} → {r.action}</span>
            </div>
          ))}
          <div
            className="qv-rule qv-rule-unknown"
            style={{ borderColor: color + "40", background: color + "08" }}
          >
            <span className="qv-rule-emoji">{unknown.emoji}</span>
            <span className="qv-rule-text" style={{ color }}>{unknown.condition} → ???</span>
          </div>
        </div>
      </div>
      <style>{robotCSS}</style>
    </div>
  );
}

const robotCSS = `
.qv-robot { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px; }
.qv-robot-icon { font-size: 32px; }
.qv-robot-rules { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 260px; }
.qv-rule {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 12px; border: 2px solid;
  font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700;
}
.qv-rule-emoji { font-size: 18px; flex-shrink: 0; }
.qv-rule-text { color: #26221D; }
.qv-rule-unknown { border-style: dashed; animation: qvPulse 2s ease-in-out infinite; }
`;

/* ─── Equation Puzzle: 2×? + 3 = 11 ─── */
function EquationPuzzleVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const parts = (data.parts as Array<{ text: string; mystery?: boolean }>) || [];

  return (
    <div className="qv-wrap">
      <div className="qv-eq-strip">
        {parts.map((part, i) => (
          <div
            key={i}
            className={`qv-eq-part ${part.mystery ? "qv-eq-mystery" : ""}`}
            style={
              part.mystery
                ? { borderColor: accent, background: accent + "10", color: accent }
                : { borderColor: color + "30", background: "#fff", color: "#26221D" }
            }
          >
            {part.text}
          </div>
        ))}
      </div>
      <style>{eqCSS}</style>
    </div>
  );
}

const eqCSS = `
.qv-eq-strip {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; flex-wrap: wrap; padding: 12px 8px;
}
.qv-eq-part {
  padding: 8px 14px; border-radius: 12px; border: 2px solid;
  font-family: 'Nunito', sans-serif; font-size: 18px; font-weight: 800;
}
.qv-eq-mystery { border-style: dashed; animation: qvPulse 2s ease-in-out infinite; }
@media (min-width: 640px) {
  .qv-eq-part { padding: 10px 18px; font-size: 20px; }
}
`;

/* ─── Scaling: circle radius comparison ─── */
function ScalingVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const label1 = (data.label1 as string) || "Original";
  const label2 = (data.label2 as string) || "Double radius";

  return (
    <div className="qv-wrap">
      <div className="qv-scale-row">
        <div className="qv-scale-item">
          <svg viewBox="0 0 100 100" className="qv-scale-svg-sm">
            <circle cx={50} cy={50} r={25} fill={color + "20"} stroke={color} strokeWidth={2} />
            <line x1={50} y1={50} x2={75} y2={50} stroke={accent} strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={62} y={46} fontSize="8" fill={accent} fontWeight="700" textAnchor="middle">r</text>
          </svg>
          <div className="qv-scale-label">{label1}</div>
        </div>
        <div className="qv-scale-arrow" style={{ color }}>→</div>
        <div className="qv-scale-item">
          <svg viewBox="0 0 100 100" className="qv-scale-svg-lg">
            <circle cx={50} cy={50} r={45} fill={accent + "15"} stroke={accent} strokeWidth={2} />
            <line x1={50} y1={50} x2={95} y2={50} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={72} y={46} fontSize="8" fill={color} fontWeight="700" textAnchor="middle">2r</text>
          </svg>
          <div className="qv-scale-label">{label2}</div>
        </div>
      </div>
      <style>{scaleCSS}</style>
    </div>
  );
}

const scaleCSS = `
.qv-scale-row {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; padding: 8px;
}
.qv-scale-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.qv-scale-svg-sm { width: 64px; height: 64px; }
.qv-scale-svg-lg { width: 96px; height: 96px; }
.qv-scale-label {
  font-size: 11px; font-weight: 700; color: #5A534D;
  font-family: 'Nunito', sans-serif;
}
.qv-scale-arrow { font-size: 22px; font-weight: 800; }
@media (min-width: 640px) {
  .qv-scale-svg-sm { width: 80px; height: 80px; }
  .qv-scale-svg-lg { width: 120px; height: 120px; }
  .qv-scale-row { gap: 20px; }
}
`;

/* ─── Venn: overlapping sets ─── */
function VennVisual({ data, color, accent }: { data: VisualData; color: string; accent: string }) {
  const leftLabel = (data.left_label as string) || "Set A";
  const rightLabel = (data.right_label as string) || "Set B";
  const overlapLabel = (data.overlap_label as string) || "";

  return (
    <div className="qv-wrap">
      <div className="qv-venn-container">
        <svg viewBox="0 0 200 120" className="qv-venn-svg">
          <circle cx={75} cy={60} r={48} fill={color + "18"} stroke={color} strokeWidth={2} />
          <circle cx={125} cy={60} r={48} fill={accent + "18"} stroke={accent} strokeWidth={2} />
          <text x={55} y={62} fontSize="9" fill={color} fontWeight="700" textAnchor="middle">{leftLabel}</text>
          <text x={145} y={62} fontSize="9" fill={accent} fontWeight="700" textAnchor="middle">{rightLabel}</text>
          {overlapLabel && (
            <text x={100} y={62} fontSize="8" fill="#5A534D" fontWeight="700" textAnchor="middle">{overlapLabel}</text>
          )}
        </svg>
      </div>
      <style>{vennCSS}</style>
    </div>
  );
}

const vennCSS = `
.qv-venn-container { display: flex; justify-content: center; padding: 8px; }
.qv-venn-svg { width: 200px; height: 120px; }
@media (min-width: 640px) { .qv-venn-svg { width: 260px; height: 156px; } }
`;

/* ─── Shared wrapper ─── */
const _wrapCSS = `
.qv-wrap {
  width: 100%; border-radius: 16px; padding: 8px;
  background: rgba(255,255,255,0.85); backdrop-filter: blur(6px);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: qvFadeIn 0.5s ease-out;
}
@keyframes qvFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

const _globalStyle = document.createElement("style");
_globalStyle.textContent = _wrapCSS;
if (!document.head.querySelector("[data-qv-global]")) {
  _globalStyle.setAttribute("data-qv-global", "");
  document.head.appendChild(_globalStyle);
}
