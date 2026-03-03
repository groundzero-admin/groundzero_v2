import { motion } from "framer-motion";
import type { Expression } from "../types";

interface EyesProps {
  color: string;
  expression: Expression;
}

export function Eyes({ color, expression }: EyesProps) {
  const leftX = 48;
  const rightX = 72;
  const baseY = 44;

  const eyeW = 10;
  const eyeH = 11;
  const irisR = 5.5;
  const pupilR = 4;

  // Happy/celebrating — curved line "happy eyes" (^_^)
  if (expression === "happy" || expression === "celebrating") {
    return (
      <g>
        {/* Left happy eye */}
        <motion.path
          d={`M${leftX - 7},${baseY + 2} Q${leftX},${baseY - 8} ${leftX + 7},${baseY + 2}`}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
        {/* Right happy eye */}
        <motion.path
          d={`M${rightX - 7},${baseY + 2} Q${rightX},${baseY - 8} ${rightX + 7},${baseY + 2}`}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
        {/* Sparkles */}
        {expression === "celebrating" && (
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <path d={`M${leftX + 10},${baseY - 8} l2,-4 l2,4 l-4,0 Z`} fill="#FFD700" />
            <path d={`M${rightX - 12},${baseY - 10} l1.5,-3 l1.5,3 l-3,0 Z`} fill="#FFD700" />
          </motion.g>
        )}
        {/* Eyebrows — happy arc */}
        <path
          d={`M${leftX - 8},${baseY - 12} Q${leftX},${baseY - 16} ${leftX + 8},${baseY - 12}`}
          fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity="0.7"
        />
        <path
          d={`M${rightX - 8},${baseY - 12} Q${rightX},${baseY - 16} ${rightX + 8},${baseY - 12}`}
          fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity="0.7"
        />
      </g>
    );
  }

  // Sad — droopy eyes
  if (expression === "sad") {
    return (
      <g>
        {renderFullEye(leftX, baseY + 2, eyeW, eyeH - 2, irisR, pupilR, color, 0, 1)}
        {renderFullEye(rightX, baseY + 2, eyeW, eyeH - 2, irisR, pupilR, color, 0, 1)}
        {/* Sad eyebrows — angled down toward center */}
        <motion.line
          x1={leftX - 8} y1={baseY - 8} x2={leftX + 6} y2={baseY - 14}
          stroke={color} strokeWidth={2.2} strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.line
          x1={rightX - 6} y1={baseY - 14} x2={rightX + 8} y2={baseY - 8}
          stroke={color} strokeWidth={2.2} strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </g>
    );
  }

  // Surprised — very wide eyes
  if (expression === "surprised") {
    return (
      <g>
        {renderFullEye(leftX, baseY, eyeW + 2, eyeH + 3, irisR + 1, pupilR - 0.5, color, 0, 0)}
        {renderFullEye(rightX, baseY, eyeW + 2, eyeH + 3, irisR + 1, pupilR - 0.5, color, 0, 0)}
        {/* Surprised eyebrows — raised high */}
        <motion.path
          d={`M${leftX - 8},${baseY - 14} Q${leftX},${baseY - 22} ${leftX + 8},${baseY - 14}`}
          fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        <motion.path
          d={`M${rightX - 8},${baseY - 14} Q${rightX},${baseY - 22} ${rightX + 8},${baseY - 14}`}
          fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </g>
    );
  }

  // Thinking — eyes look to the upper-right
  if (expression === "thinking") {
    return (
      <g>
        {renderFullEye(leftX, baseY, eyeW, eyeH, irisR, pupilR, color, 3, -1)}
        {renderFullEye(rightX, baseY, eyeW, eyeH, irisR, pupilR, color, 3, -1)}
        {/* Thinking eyebrows — one raised */}
        <line
          x1={leftX - 8} y1={baseY - 12} x2={leftX + 6} y2={baseY - 12}
          stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity="0.7"
        />
        <line
          x1={rightX - 6} y1={baseY - 16} x2={rightX + 8} y2={baseY - 12}
          stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity="0.7"
        />
      </g>
    );
  }

  // Default idle — with blink via ry animation on the eye white
  return (
    <g>
      {/* Left eye */}
      <g>
        {/* Eye white — blinks via ry squash */}
        <motion.ellipse
          cx={leftX} cy={baseY} rx={eyeW} ry={eyeH}
          fill="white" stroke={darken(color, 0.1)} strokeWidth="0.8"
          animate={{ ry: [eyeH, eyeH, 1, eyeH, eyeH] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        {/* Iris */}
        <motion.ellipse
          cx={leftX} cy={baseY + 1} rx={irisR} ry={irisR}
          fill={color}
          animate={{ ry: [irisR, irisR, 0.5, irisR, irisR] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        {/* Pupil */}
        <motion.circle
          cx={leftX} cy={baseY + 1} r={pupilR}
          fill="#1A1A2E"
          animate={{ r: [pupilR, pupilR, 0.2, pupilR, pupilR] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        {/* Shine */}
        <circle cx={leftX + 2.5} cy={baseY - 2.5} r={2.2} fill="white" />
        <circle cx={leftX - 1.5} cy={baseY + 2} r={1} fill="white" opacity="0.6" />
      </g>

      {/* Right eye */}
      <g>
        <motion.ellipse
          cx={rightX} cy={baseY} rx={eyeW} ry={eyeH}
          fill="white" stroke={darken(color, 0.1)} strokeWidth="0.8"
          animate={{ ry: [eyeH, eyeH, 1, eyeH, eyeH] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        <motion.ellipse
          cx={rightX} cy={baseY + 1} rx={irisR} ry={irisR}
          fill={color}
          animate={{ ry: [irisR, irisR, 0.5, irisR, irisR] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        <motion.circle
          cx={rightX} cy={baseY + 1} r={pupilR}
          fill="#1A1A2E"
          animate={{ r: [pupilR, pupilR, 0.2, pupilR, pupilR] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.88, 0.91, 0.94, 1] }}
        />
        <circle cx={rightX + 2.5} cy={baseY - 2.5} r={2.2} fill="white" />
        <circle cx={rightX - 1.5} cy={baseY + 2} r={1} fill="white" opacity="0.6" />
      </g>

      {/* Eyebrows — relaxed */}
      <path
        d={`M${leftX - 8},${baseY - 13} Q${leftX},${baseY - 16} ${leftX + 7},${baseY - 13}`}
        fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity="0.6"
      />
      <path
        d={`M${rightX - 7},${baseY - 13} Q${rightX},${baseY - 16} ${rightX + 8},${baseY - 13}`}
        fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity="0.6"
      />
    </g>
  );
}

function renderFullEye(
  cx: number, cy: number, w: number, h: number,
  irisR: number, pupilR: number, color: string,
  lookX: number, lookY: number,
) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={w} ry={h} fill="white" stroke={darken(color, 0.1)} strokeWidth="0.8" />
      <ellipse cx={cx + lookX} cy={cy + lookY} rx={irisR} ry={irisR} fill={color} />
      <circle cx={cx + lookX} cy={cy + lookY} r={pupilR} fill="#1A1A2E" />
      <circle cx={cx + lookX + 2} cy={cy + lookY - 2.5} r={2} fill="white" />
      <circle cx={cx + lookX - 1.5} cy={cy + lookY + 1.5} r={0.8} fill="white" opacity="0.6" />
    </g>
  );
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
