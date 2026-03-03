import { motion } from "framer-motion";
import type { Expression, Action } from "../types";

interface MouthProps {
  expression: Expression;
  action: Action;
}

export function Mouth({ expression, action }: MouthProps) {
  const cx = 60;
  const cy = 60;
  const isTalking = action === "talking";

  // Talking — animated mouth with tongue
  if (isTalking) {
    return (
      <g>
        <motion.ellipse
          cx={cx}
          cy={cy}
          rx={7}
          ry={4}
          fill="#B03A2E"
          animate={{
            ry: [4, 7, 4, 8, 4],
            rx: [7, 6, 7, 5, 7],
          }}
          transition={{ repeat: Infinity, duration: 0.4 }}
        />
        {/* Tongue hint */}
        <motion.ellipse
          cx={cx}
          cy={cy + 2}
          rx={4}
          ry={2}
          fill="#E8836B"
          animate={{
            ry: [2, 4, 2, 5, 2],
            cy: [cy + 2, cy + 4, cy + 2, cy + 5, cy + 2],
          }}
          transition={{ repeat: Infinity, duration: 0.4 }}
        />
        {/* Teeth hint */}
        <motion.rect
          x={cx - 4}
          y={cy - 4}
          width={8}
          height={3}
          rx={1}
          fill="white"
          opacity="0.8"
          animate={{
            height: [3, 2, 3, 1.5, 3],
          }}
          transition={{ repeat: Infinity, duration: 0.4 }}
        />
      </g>
    );
  }

  switch (expression) {
    case "happy":
    case "celebrating":
      return (
        <g>
          {/* Big smile with teeth */}
          <motion.path
            d={`M${cx - 12},${cy - 2} Q${cx},${cy + 14} ${cx + 12},${cy - 2}`}
            fill="#B03A2E"
            stroke="#8B2F24"
            strokeWidth="1"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
          />
          {/* Teeth */}
          <path
            d={`M${cx - 8},${cy - 1} L${cx + 8},${cy - 1} Q${cx},${cy + 4} ${cx - 8},${cy - 1}`}
            fill="white"
            opacity="0.9"
          />
          {/* Tongue */}
          <ellipse cx={cx} cy={cy + 6} rx={4} ry={3} fill="#E8836B" opacity="0.7" />
        </g>
      );

    case "sad":
      return (
        <motion.path
          d={`M${cx - 8},${cy + 4} Q${cx},${cy - 6} ${cx + 8},${cy + 4}`}
          fill="none"
          stroke="#B03A2E"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      );

    case "surprised":
      return (
        <g>
          <motion.ellipse
            cx={cx}
            cy={cy + 2}
            rx={6}
            ry={8}
            fill="#B03A2E"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
          {/* Teeth top */}
          <rect x={cx - 4} y={cy - 4} width={8} height={3} rx={1} fill="white" opacity="0.8" />
        </g>
      );

    case "thinking":
      return (
        <g>
          {/* Wavy thinking line */}
          <motion.path
            d={`M${cx - 8},${cy + 2} Q${cx - 4},${cy - 2} ${cx},${cy + 2} Q${cx + 4},${cy + 6} ${cx + 8},${cy + 2}`}
            fill="none"
            stroke="#B03A2E"
            strokeWidth={2.5}
            strokeLinecap="round"
            animate={{
              d: [
                `M${cx - 8},${cy + 2} Q${cx - 4},${cy - 2} ${cx},${cy + 2} Q${cx + 4},${cy + 6} ${cx + 8},${cy + 2}`,
                `M${cx - 8},${cy + 2} Q${cx - 4},${cy + 4} ${cx},${cy} Q${cx + 4},${cy - 2} ${cx + 8},${cy + 2}`,
                `M${cx - 8},${cy + 2} Q${cx - 4},${cy - 2} ${cx},${cy + 2} Q${cx + 4},${cy + 6} ${cx + 8},${cy + 2}`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        </g>
      );

    default:
      // idle — gentle friendly smile
      return (
        <g>
          <path
            d={`M${cx - 8},${cy} Q${cx},${cy + 8} ${cx + 8},${cy}`}
            fill="none"
            stroke="#B03A2E"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Lip highlight */}
          <path
            d={`M${cx - 4},${cy + 2} Q${cx},${cy + 5} ${cx + 4},${cy + 2}`}
            fill="none"
            stroke="#C0503E"
            strokeWidth={1}
            strokeLinecap="round"
            opacity="0.3"
          />
        </g>
      );
  }
}
