import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function DivingMask({ action }: Props) {
  const isTalking = action === "talking";
  const bob = isTalking ? [0, -1, 0] : [0];

  return (
    <motion.g animate={{ y: bob }} transition={{ repeat: Infinity, duration: 0.6 }}>
      {/* Mask frame */}
      <path
        d="M34,36 Q34,30 42,28 L78,28 Q86,30 86,36 L86,50 Q86,56 78,58 L42,58 Q34,56 34,50 Z"
        fill="rgba(6,182,212,0.15)"
        stroke="#0891B2"
        strokeWidth="2"
      />
      {/* Lens divider */}
      <line x1="60" y1="30" x2="60" y2="56" stroke="#0891B2" strokeWidth="2" />
      {/* Strap */}
      <line x1="34" y1="42" x2="26" y2="40" stroke="#0E7490" strokeWidth="3" strokeLinecap="round" />
      <line x1="86" y1="42" x2="94" y2="40" stroke="#0E7490" strokeWidth="3" strokeLinecap="round" />
      {/* Lens reflection */}
      <path d="M40,34 Q44,32 48,34" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M68,34 Q72,32 76,34" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      {/* Snorkel tube */}
      <path d="M86,36 Q96,34 98,20 Q100,10 96,6" fill="none" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" />
      {/* Snorkel top */}
      <ellipse cx="96" cy="4" rx="4" ry="3" fill="#06B6D4" stroke="#0891B2" strokeWidth="1" />
      {/* Bubbles when talking */}
      {isTalking && (
        <motion.g>
          <motion.circle
            cx="98" cy="0" r="2" fill="none" stroke="#67E8F9" strokeWidth="0.8"
            animate={{ cy: [0, -8, -16], opacity: [0.6, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <motion.circle
            cx="94" cy="-2" r="1.5" fill="none" stroke="#67E8F9" strokeWidth="0.6"
            animate={{ cy: [-2, -10, -18], opacity: [0.5, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
          />
        </motion.g>
      )}
    </motion.g>
  );
}
