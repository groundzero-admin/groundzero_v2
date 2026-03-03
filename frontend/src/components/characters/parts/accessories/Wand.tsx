import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function Wand({ action }: Props) {
  const isTalking = action === "talking";
  const isCelebrating = action === "celebrating";
  const showSparkles = isTalking || isCelebrating;

  return (
    <motion.g
      animate={isTalking ? { rotate: [0, 5, -5, 0] } : isCelebrating ? { rotate: [0, 10, -10, 0] } : {}}
      transition={{ repeat: Infinity, duration: isCelebrating ? 0.4 : 0.8 }}
      style={{ transformOrigin: "106px 90px" }}
    >
      {/* Wand stick */}
      <line x1="106" y1="90" x2="120" y2="64" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" />
      <line x1="106" y1="90" x2="120" y2="64" stroke="#6B4F3A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Wand tip */}
      <circle cx="120" cy="63" r="2.5" fill="#F59E0B" />
      <circle cx="120" cy="63" r="1.5" fill="#FCD34D" />
      {/* Sparkles */}
      {showSparkles && (
        <>
          <motion.circle
            cx="122" cy="58" r="1.5" fill="#FCD34D"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], y: [0, -4, -8] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          <motion.circle
            cx="118" cy="56" r="1" fill="#A78BFA"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [-2, -6, -10] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          />
          <motion.path
            d="M124,60 l1,-2 l1,2 l-2,0 Z" fill="#FCD34D"
            animate={{ opacity: [0, 1, 0], y: [0, -6, -12] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: 0.4 }}
          />
        </>
      )}
    </motion.g>
  );
}
