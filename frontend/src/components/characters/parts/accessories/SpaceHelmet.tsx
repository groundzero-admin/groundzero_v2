import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function SpaceHelmet({ action }: Props) {
  const isTalking = action === "talking";
  const bob = isTalking ? [0, -1, 0] : [0];

  return (
    <motion.g animate={{ y: bob }} transition={{ repeat: Infinity, duration: 0.6 }}>
      {/* Helmet dome — transparent bubble */}
      <ellipse cx="60" cy="38" rx="36" ry="36" fill="rgba(200,230,255,0.12)" stroke="#94A3B8" strokeWidth="2" />
      {/* Helmet frame/border */}
      <ellipse cx="60" cy="38" rx="36" ry="36" fill="none" stroke="#CBD5E1" strokeWidth="1" />
      {/* Visor reflection arc */}
      <path d="M38,22 Q48,14 64,18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M42,28 Q48,24 56,26" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
      {/* Helmet base seal */}
      <path d="M28,58 Q28,68 40,70 L80,70 Q92,68 92,58" fill="none" stroke="#94A3B8" strokeWidth="2.5" />
      {/* Antenna nub on top */}
      <circle cx="60" cy="2" r="3" fill="#64748B" />
      <circle cx="60" cy="2" r="1.5" fill="#94A3B8" />
      <line x1="60" y1="5" x2="60" y2="8" stroke="#64748B" strokeWidth="2" />
      {/* Comm light */}
      <motion.circle
        cx="60" cy="1" r="1" fill="#22D3EE"
        animate={isTalking ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.4 }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
    </motion.g>
  );
}
