import { motion } from "framer-motion";
import type { Action } from "../types";

interface ArmsProps {
  action: Action;
  outfitColor: string;
  skinColor: string;
}

export function Arms({ action, outfitColor, skinColor }: ArmsProps) {
  const dark = darken(outfitColor, 0.1);

  const getLeftArm = () => {
    switch (action) {
      case "waving":
        return {
          d: ["M28,92 Q16,86 10,74", "M28,92 Q12,80 8,66", "M28,92 Q16,86 10,74"],
          transition: { repeat: Infinity, duration: 0.6 },
        };
      case "celebrating":
        return {
          d: ["M28,92 Q16,78 12,62", "M28,92 Q10,72 6,56", "M28,92 Q16,78 12,62"],
          transition: { repeat: Infinity, duration: 0.5 },
        };
      case "pointing":
        return {
          d: ["M28,92 Q16,90 6,88"],
          transition: { duration: 0.3 },
        };
      case "talking":
        return {
          d: ["M28,92 Q18,96 14,108", "M28,92 Q16,92 12,104", "M28,92 Q18,96 14,108"],
          transition: { repeat: Infinity, duration: 0.8 },
        };
      default:
        return {
          d: ["M28,92 Q20,98 16,112"],
          transition: { duration: 0.3 },
        };
    }
  };

  const getRightArm = () => {
    switch (action) {
      case "waving":
        return {
          d: ["M92,92 Q104,96 108,108", "M92,92 Q106,92 110,104", "M92,92 Q104,96 108,108"],
          transition: { repeat: Infinity, duration: 0.8 },
        };
      case "celebrating":
        return {
          d: ["M92,92 Q104,78 108,62", "M92,92 Q110,72 114,56", "M92,92 Q104,78 108,62"],
          transition: { repeat: Infinity, duration: 0.5, delay: 0.1 },
        };
      case "pointing":
        return {
          d: ["M92,92 Q104,88 118,84"],
          transition: { duration: 0.3 },
        };
      case "talking":
        return {
          d: ["M92,92 Q104,96 108,108", "M92,92 Q106,92 110,104", "M92,92 Q104,96 108,108"],
          transition: { repeat: Infinity, duration: 0.8 },
        };
      default:
        return {
          d: ["M92,92 Q102,98 106,112"],
          transition: { duration: 0.3 },
        };
    }
  };

  const left = getLeftArm();
  const right = getRightArm();

  const getHandPos = (side: "left" | "right") => {
    if (side === "left") {
      switch (action) {
        case "waving": return { cx: [10, 8, 10], cy: [74, 66, 74] };
        case "celebrating": return { cx: [12, 6, 12], cy: [62, 56, 62] };
        case "pointing": return { cx: [6], cy: [88] };
        case "talking": return { cx: [14, 12, 14], cy: [108, 104, 108] };
        default: return { cx: [16], cy: [112] };
      }
    }
    switch (action) {
      case "waving": return { cx: [108, 110, 108], cy: [108, 104, 108] };
      case "celebrating": return { cx: [108, 114, 108], cy: [62, 56, 62] };
      case "pointing": return { cx: [118], cy: [84] };
      case "talking": return { cx: [108, 110, 108], cy: [108, 104, 108] };
      default: return { cx: [106], cy: [112] };
    }
  };

  const leftHand = getHandPos("left");
  const rightHand = getHandPos("right");

  return (
    <g>
      {/* Left arm — sleeve + outline */}
      <motion.path
        d={left.d[0]}
        fill="none"
        stroke={dark}
        strokeWidth={11}
        strokeLinecap="round"
        animate={{ d: left.d }}
        transition={left.transition}
      />
      <motion.path
        d={left.d[0]}
        fill="none"
        stroke={outfitColor}
        strokeWidth={9}
        strokeLinecap="round"
        animate={{ d: left.d }}
        transition={left.transition}
      />
      {/* Left hand — rounded with finger hint */}
      <motion.circle
        cx={leftHand.cx[0]}
        cy={leftHand.cy[0]}
        r={6}
        fill={skinColor}
        stroke={darken(skinColor, 0.15)}
        strokeWidth="1"
        animate={leftHand}
        transition={left.transition}
      />

      {/* Right arm — sleeve + outline */}
      <motion.path
        d={right.d[0]}
        fill="none"
        stroke={dark}
        strokeWidth={11}
        strokeLinecap="round"
        animate={{ d: right.d }}
        transition={right.transition}
      />
      <motion.path
        d={right.d[0]}
        fill="none"
        stroke={outfitColor}
        strokeWidth={9}
        strokeLinecap="round"
        animate={{ d: right.d }}
        transition={right.transition}
      />
      {/* Right hand */}
      <motion.circle
        cx={rightHand.cx[0]}
        cy={rightHand.cy[0]}
        r={6}
        fill={skinColor}
        stroke={darken(skinColor, 0.15)}
        strokeWidth="1"
        animate={rightHand}
        transition={right.transition}
      />

      {/* Finger lines on hands — pointing action only */}
      {action === "pointing" && (
        <g>
          <motion.line
            x1="118" y1="84" x2="124" y2="82"
            stroke={darken(skinColor, 0.15)}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
        </g>
      )}
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
