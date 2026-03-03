import { motion } from "framer-motion";
import type { HeadShape, Action } from "../../types";

interface Props { headShape: HeadShape; action: Action }

export function Jetpack({ action }: Props) {
  const isCelebrating = action === "celebrating";

  return (
    <g>
      {/* Left cylinder */}
      <rect x="20" y="88" width="10" height="24" rx="4" fill="#475569" stroke="#64748B" strokeWidth="1" />
      <rect x="22" y="90" width="6" height="4" rx="2" fill="#64748B" />
      {/* Right cylinder */}
      <rect x="90" y="88" width="10" height="24" rx="4" fill="#475569" stroke="#64748B" strokeWidth="1" />
      <rect x="92" y="90" width="6" height="4" rx="2" fill="#64748B" />
      {/* Straps */}
      <line x1="25" y1="88" x2="40" y2="86" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="95" y1="88" x2="80" y2="86" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      {/* Flames when celebrating */}
      {isCelebrating && (
        <>
          <motion.path
            d="M22,114 Q25,126 28,114" fill="#F97316"
            animate={{ d: ["M22,114 Q25,126 28,114", "M22,114 Q25,130 28,114", "M22,114 Q25,126 28,114"] }}
            transition={{ repeat: Infinity, duration: 0.2 }}
          />
          <motion.path
            d="M92,114 Q95,126 98,114" fill="#F97316"
            animate={{ d: ["M92,114 Q95,126 98,114", "M92,114 Q95,130 98,114", "M92,114 Q95,126 98,114"] }}
            transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
          />
          {/* Inner flame */}
          <motion.path
            d="M23,114 Q25,122 27,114" fill="#FCD34D"
            animate={{ d: ["M23,114 Q25,122 27,114", "M23,114 Q25,126 27,114", "M23,114 Q25,122 27,114"] }}
            transition={{ repeat: Infinity, duration: 0.15 }}
          />
          <motion.path
            d="M93,114 Q95,122 97,114" fill="#FCD34D"
            animate={{ d: ["M93,114 Q95,122 97,114", "M93,114 Q95,126 97,114", "M93,114 Q95,122 97,114"] }}
            transition={{ repeat: Infinity, duration: 0.15, delay: 0.05 }}
          />
        </>
      )}
    </g>
  );
}
