import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function Binoculars({ action }: Props) {
  const isTalking = action === "talking";

  return (
    <motion.g
      animate={isTalking ? { y: [0, -1, 0] } : {}}
      transition={{ repeat: Infinity, duration: 0.6 }}
    >
      {/* Strap */}
      <path d="M40,70 Q38,76 40,80 L44,80 Q42,76 44,70" fill="#92400E" stroke="#78350F" strokeWidth="0.5" />
      <path d="M76,70 Q78,76 76,80 L80,80 Q82,76 80,70" fill="#92400E" stroke="#78350F" strokeWidth="0.5" />
      {/* Strap across neck */}
      <path d="M40,70 Q50,72 60,72 Q70,72 80,70" fill="none" stroke="#92400E" strokeWidth="2.5" />
      {/* Left barrel */}
      <rect x="44" y="76" width="10" height="14" rx="3" fill="#1C1917" stroke="#44403C" strokeWidth="0.8" />
      {/* Right barrel */}
      <rect x="66" y="76" width="10" height="14" rx="3" fill="#1C1917" stroke="#44403C" strokeWidth="0.8" />
      {/* Bridge */}
      <rect x="54" y="80" width="12" height="6" rx="2" fill="#292524" />
      {/* Lens glint */}
      <motion.circle
        cx="49" cy="78" r="1.5" fill="#67E8F9" opacity="0.5"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <motion.circle
        cx="71" cy="78" r="1.5" fill="#67E8F9" opacity="0.5"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
      />
    </motion.g>
  );
}
