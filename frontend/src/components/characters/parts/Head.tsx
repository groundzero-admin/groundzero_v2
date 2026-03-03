import { motion } from "framer-motion";
import type { HeadShape, Action } from "../types";

interface HeadProps {
  shape: HeadShape;
  skinColor: string;
  action: Action;
}

export function Head({ shape, skinColor, action }: HeadProps) {
  const isTalking = action === "talking";
  const bobY = isTalking ? [0, -2, 0] : [0];
  const gradId = `skin-${skinColor.replace("#", "")}`;
  const shadow = darken(skinColor, 0.12);

  if (shape === "square") {
    // Robot-style head — rounded rectangle with panel lines
    return (
      <g>
        {/* Head shadow */}
        <motion.rect
          x="28" y="22" width="64" height="52" rx="14"
          fill={shadow}
          opacity="0.2"
          animate={{ y: bobY.map((v) => 22 + v + 2) }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
        {/* Main head */}
        <motion.rect
          x="28" y="20" width="64" height="52" rx="14"
          fill={`url(#${gradId})`}
          stroke={darken(skinColor, 0.18)}
          strokeWidth="1.5"
          animate={{ y: bobY.map((v) => 20 + v) }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
        {/* Panel lines for robot feel */}
        <motion.line
          x1="28" y1="34" x2="92" y2="34"
          stroke={darken(skinColor, 0.08)}
          strokeWidth="0.8"
          opacity="0.4"
          animate={{ y1: bobY.map((v) => 34 + v), y2: bobY.map((v) => 34 + v) }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
        {/* Chin light */}
        <motion.rect
          x="42" y="60" width="36" height="4" rx="2"
          fill={lighten(skinColor, 0.12)}
          opacity="0.5"
          animate={{ y: bobY.map((v) => 60 + v) }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
      </g>
    );
  }

  if (shape === "oval") {
    return (
      <g>
        {/* Head shadow */}
        <motion.ellipse
          cx="60" cy="50" rx="30" ry="28"
          fill={shadow}
          opacity="0.15"
          animate={{ cy: bobY.map((v) => 50 + v) }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
        {/* Main head */}
        <motion.ellipse
          cx="60" cy="48" rx="30" ry="28"
          fill={`url(#${gradId})`}
          stroke={darken(skinColor, 0.12)}
          strokeWidth="1.5"
          animate={{ cy: bobY.map((v) => 48 + v) }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
        {/* Highlight */}
        <motion.ellipse
          cx="52" cy="36" rx="14" ry="8"
          fill="white"
          opacity="0.12"
          animate={{ cy: bobY.map((v) => 36 + v) }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
      </g>
    );
  }

  // round (default) — slightly bigger for cute proportions
  return (
    <g>
      {/* Head shadow */}
      <motion.ellipse
        cx="60" cy="48" rx="30" ry="32"
        fill={shadow}
        opacity="0.15"
        animate={{ cy: bobY.map((v) => 48 + v) }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
      {/* Main head */}
      <motion.ellipse
        cx="60" cy="46" rx="30" ry="32"
        fill={`url(#${gradId})`}
        stroke={darken(skinColor, 0.12)}
        strokeWidth="1.5"
        animate={{ cy: bobY.map((v) => 46 + v) }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
      {/* Forehead highlight for depth */}
      <motion.ellipse
        cx="52" cy="34" rx="14" ry="10"
        fill="white"
        opacity="0.12"
        animate={{ cy: bobY.map((v) => 34 + v) }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
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
