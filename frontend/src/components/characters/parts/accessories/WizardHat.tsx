import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function WizardHat({ action }: Props) {
  const isTalking = action === "talking";
  const bob = isTalking ? [0, -2, 0] : [0];

  return (
    <motion.g animate={{ y: bob }} transition={{ repeat: Infinity, duration: 0.6 }}>
      {/* Hat brim */}
      <ellipse cx="60" cy="18" rx="32" ry="6" fill="#3B0764" stroke="#5B21B6" strokeWidth="1" />
      {/* Hat cone */}
      <path d="M36,18 L60,-26 L84,18" fill="#4C1D95" stroke="#5B21B6" strokeWidth="1" />
      {/* Hat band */}
      <rect x="38" y="12" width="44" height="6" rx="2" fill="#7C3AED" />
      {/* Gold buckle */}
      <rect x="54" y="11" width="12" height="8" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
      <rect x="57" y="13" width="6" height="4" rx="1" fill="#4C1D95" />
      {/* Stars on hat */}
      <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
        <path d="M50,-4 l1.5,-3 l1.5,3 l-3,0 Z" fill="#FCD34D" />
        <path d="M68,-10 l1,-2 l1,2 l-2,0 Z" fill="#FCD34D" />
        <circle cx="56" cy="-14" r="1.5" fill="#FCD34D" />
      </motion.g>
      {/* Curled tip */}
      <path d="M60,-26 Q66,-30 70,-24" fill="none" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" />
      {/* Hat highlight */}
      <path d="M44,14 Q52,0 60,-20" fill="none" stroke="#7C3AED" strokeWidth="1.5" opacity="0.3" />
    </motion.g>
  );
}
