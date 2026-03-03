import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function Trident({ action }: Props) {
  const isTalking = action === "talking";
  const isCelebrating = action === "celebrating";

  return (
    <motion.g
      animate={
        isCelebrating ? { rotate: [0, 8, -8, 0] }
          : isTalking ? { rotate: [0, 3, -3, 0] }
            : {}
      }
      transition={{ repeat: Infinity, duration: isCelebrating ? 0.5 : 1.2 }}
      style={{ transformOrigin: "108px 110px" }}
    >
      {/* Staff */}
      <line x1="108" y1="110" x2="108" y2="60" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
      <line x1="108" y1="110" x2="108" y2="60" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center prong */}
      <line x1="108" y1="60" x2="108" y2="44" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left prong */}
      <path d="M108,60 Q100,54 98,46" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right prong */}
      <path d="M108,60 Q116,54 118,46" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Prong tips */}
      <circle cx="108" cy="43" r="2" fill="#FCD34D" />
      <circle cx="97" cy="45" r="2" fill="#FCD34D" />
      <circle cx="119" cy="45" r="2" fill="#FCD34D" />
      {/* Glow */}
      <motion.circle
        cx="108" cy="52" r="6" fill="#F59E0B" opacity="0.1"
        animate={{ opacity: [0.05, 0.15, 0.05], r: [6, 10, 6] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.g>
  );
}
