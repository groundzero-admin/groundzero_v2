import { motion } from "framer-motion";
import type { HeadShape, Action } from "../types";

interface BodyProps {
  shape: HeadShape;
  color: string;
  action: Action;
}

export function Body({ shape, color, action }: BodyProps) {
  const isCelebrating = action === "celebrating";
  const gradId = `outfit-${color.replace("#", "")}`;

  if (shape === "square") {
    // Robot-style body — boxy with panel details
    return (
      <g>
        {/* Body shadow */}
        <rect x="30" y="84" width="60" height="42" rx="8" fill={darken(color, 0.2)} opacity="0.15" />
        {/* Main body */}
        <motion.rect
          x="30" y="82" width="60" height="42" rx="8"
          fill={`url(#${gradId})`}
          stroke={darken(color, 0.2)}
          strokeWidth="1.5"
          animate={isCelebrating ? { y: [82, 78, 82] } : {}}
          transition={{ repeat: Infinity, duration: 0.4 }}
        />
        {/* Panel line */}
        <line x1="60" y1="82" x2="60" y2="124" stroke={darken(color, 0.12)} strokeWidth="0.8" opacity="0.4" />
        {/* Chest plate */}
        <rect x="42" y="88" width="36" height="18" rx="4" fill={lighten(color, 0.08)} stroke={darken(color, 0.1)} strokeWidth="0.8" />
        {/* Power indicator */}
        <circle cx="60" cy="97" r="4" fill={isCelebrating ? "#38A169" : lighten(color, 0.25)} opacity="0.8" />
        <circle cx="60" cy="97" r="2" fill="white" opacity="0.5" />
        {/* Belt */}
        <rect x="30" y="110" width="60" height="5" rx="2" fill={darken(color, 0.25)} />
        <rect x="54" y="109" width="12" height="7" rx="2" fill={darken(color, 0.3)} />
      </g>
    );
  }

  // Human-style body
  return (
    <g>
      {/* Neck */}
      <rect x="53" y="74" width="14" height="10" rx="3" fill={lighten(color, 0.5)} opacity="0.6" />
      {/* Body shadow */}
      <path
        d="M28,90 Q28,84 38,84 L82,84 Q92,84 92,90 L92,130 Q92,136 86,136 L34,136 Q28,136 28,130 Z"
        fill={darken(color, 0.2)}
        opacity="0.12"
        transform="translate(0, 2)"
      />
      {/* Main torso */}
      <motion.path
        d="M28,90 Q28,84 38,84 L82,84 Q92,84 92,90 L92,130 Q92,136 86,136 L34,136 Q28,136 28,130 Z"
        fill={`url(#${gradId})`}
        stroke={darken(color, 0.15)}
        strokeWidth="1.5"
        animate={isCelebrating ? { y: [0, -4, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.4 }}
      />
      {/* Collar V-neck */}
      <path d="M46,84 L60,98 L74,84" fill="none" stroke={darken(color, 0.15)} strokeWidth="1.5" />
      {/* Inner shirt visible through collar */}
      <path d="M48,84 L60,96 L72,84" fill={lighten(color, 0.3)} opacity="0.4" />
      {/* Subtle shirt folds */}
      <path d="M44,100 Q48,104 44,110" fill="none" stroke={darken(color, 0.08)} strokeWidth="0.8" opacity="0.4" />
      <path d="M76,100 Q72,104 76,110" fill="none" stroke={darken(color, 0.08)} strokeWidth="0.8" opacity="0.4" />
      {/* Button */}
      <circle cx="60" cy="108" r="2" fill={darken(color, 0.2)} opacity="0.5" />
      <circle cx="60" cy="118" r="2" fill={darken(color, 0.2)} opacity="0.5" />
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

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 255 * amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + 255 * amount);
  const b = Math.min(255, (num & 0xff) + 255 * amount);
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
