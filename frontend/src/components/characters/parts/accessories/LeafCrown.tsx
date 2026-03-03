import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function LeafCrown({ action }: Props) {
  const isTalking = action === "talking";
  const bob = isTalking ? [0, -2, 0] : [0];

  return (
    <motion.g animate={{ y: bob }} transition={{ repeat: Infinity, duration: 0.6 }}>
      {/* Crown ring */}
      <ellipse cx="60" cy="16" rx="28" ry="5" fill="#166534" opacity="0.5" />
      {/* Leaves around head */}
      <path d="M34,16 Q30,6 36,2 Q42,6 38,16" fill="#22C55E" stroke="#16A34A" strokeWidth="0.5" />
      <path d="M42,12 Q40,0 48,-2 Q52,2 46,12" fill="#4ADE80" stroke="#22C55E" strokeWidth="0.5" />
      <path d="M54,10 Q54,-2 62,-4 Q66,0 58,10" fill="#22C55E" stroke="#16A34A" strokeWidth="0.5" />
      <path d="M66,10 Q68,-2 76,-2 Q78,2 70,12" fill="#4ADE80" stroke="#22C55E" strokeWidth="0.5" />
      <path d="M78,14 Q82,4 88,2 Q90,8 82,16" fill="#22C55E" stroke="#16A34A" strokeWidth="0.5" />
      {/* Leaf veins */}
      <line x1="36" y1="10" x2="36" y2="4" stroke="#16A34A" strokeWidth="0.5" opacity="0.5" />
      <line x1="48" y1="6" x2="47" y2="0" stroke="#16A34A" strokeWidth="0.5" opacity="0.5" />
      <line x1="60" y1="4" x2="60" y2="-2" stroke="#16A34A" strokeWidth="0.5" opacity="0.5" />
      <line x1="72" y1="6" x2="73" y2="0" stroke="#16A34A" strokeWidth="0.5" opacity="0.5" />
      <line x1="84" y1="10" x2="86" y2="4" stroke="#16A34A" strokeWidth="0.5" opacity="0.5" />
      {/* Small flowers */}
      <circle cx="44" cy="4" r="2" fill="#FCD34D" />
      <circle cx="44" cy="4" r="1" fill="#F59E0B" />
      <circle cx="72" cy="2" r="2" fill="#FB923C" />
      <circle cx="72" cy="2" r="1" fill="#EA580C" />
    </motion.g>
  );
}
