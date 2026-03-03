import { motion } from "framer-motion";
import { Head } from "./parts/Head";
import { Eyes } from "./parts/Eyes";
import { Mouth } from "./parts/Mouth";
import { Body } from "./parts/Body";
import { Arms } from "./parts/Arms";
import { Accessory } from "./parts/Accessories";
import type { CharacterConfig, Expression, Action } from "./types";

interface CharacterBaseProps {
  config: CharacterConfig;
  expression?: Expression;
  action?: Action;
  size?: number;
}

export function CharacterBase({
  config,
  expression = "idle",
  action = "idle",
  size = 140,
}: CharacterBaseProps) {
  const isCelebrating = expression === "celebrating" || action === "celebrating";

  return (
    <motion.svg
      width={size}
      height={size * (160 / 120)}
      viewBox="0 0 120 160"
      animate={isCelebrating ? { y: [0, -6, 0] } : {}}
      transition={isCelebrating ? { repeat: Infinity, duration: 0.5 } : {}}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Shared skin gradient */}
        <radialGradient id={`skin-${config.skinColor.replace("#", "")}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lighten(config.skinColor, 0.08)} />
          <stop offset="100%" stopColor={config.skinColor} />
        </radialGradient>

        {/* Outfit gradient */}
        <linearGradient id={`outfit-${config.outfitColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lighten(config.outfitColor, 0.15)} />
          <stop offset="100%" stopColor={config.outfitColor} />
        </linearGradient>

        {/* Soft shadow filter */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow filter for celebrations */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Cheek blush gradient */}
        <radialGradient id="blush">
          <stop offset="0%" stopColor="#FF9999" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF9999" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hair (behind head) */}
      {config.hairStyle && config.hairStyle !== "none" && config.hairColor && (
        <HairBack style={config.hairStyle} color={config.hairColor} headShape={config.headShape} />
      )}

      <Body shape={config.headShape} color={config.outfitColor} action={action} />
      <Arms action={action} outfitColor={config.outfitColor} skinColor={config.skinColor} />
      <Head shape={config.headShape} skinColor={config.skinColor} action={action} />

      {/* Ears — for round/oval heads */}
      {config.headShape !== "square" && (
        <g>
          <ellipse cx="30" cy="48" rx="5" ry="6" fill={config.skinColor} stroke={darken(config.skinColor, 0.1)} strokeWidth="1" />
          <ellipse cx="30" cy="48" rx="2.5" ry="3" fill={darken(config.skinColor, 0.08)} />
          <ellipse cx="90" cy="48" rx="5" ry="6" fill={config.skinColor} stroke={darken(config.skinColor, 0.1)} strokeWidth="1" />
          <ellipse cx="90" cy="48" rx="2.5" ry="3" fill={darken(config.skinColor, 0.08)} />
        </g>
      )}

      {/* Cheek blush */}
      {(expression === "happy" || expression === "celebrating") && config.headShape !== "square" && (
        <g>
          <circle cx="38" cy="55" r="7" fill="url(#blush)" />
          <circle cx="82" cy="55" r="7" fill="url(#blush)" />
        </g>
      )}

      <Eyes color={config.eyeColor} expression={expression} />
      <Mouth expression={expression} action={action} />

      {/* Nose — subtle */}
      {config.headShape !== "square" && (
        <ellipse cx="60" cy="52" rx="2" ry="1.5" fill={darken(config.skinColor, 0.1)} opacity="0.6" />
      )}

      {/* Hair (front) */}
      {config.hairStyle && config.hairStyle !== "none" && config.hairColor && (
        <HairFront style={config.hairStyle} color={config.hairColor} headShape={config.headShape} />
      )}

      {/* Accessories */}
      {config.accessories.map((acc) => (
        <Accessory key={acc} type={acc} headShape={config.headShape} action={action} />
      ))}
    </motion.svg>
  );
}

function HairBack({ style, color, headShape }: { style: "short" | "long"; color: string; headShape: string }) {
  if (headShape === "square") return null;
  const dark = darken(color, 0.2);

  if (style === "long") {
    return (
      <g>
        <ellipse cx="60" cy="28" rx="36" ry="22" fill={color} />
        <ellipse cx="34" cy="52" rx="9" ry="22" fill={color} />
        <ellipse cx="86" cy="52" rx="9" ry="22" fill={color} />
        {/* Hair shine */}
        <ellipse cx="52" cy="18" rx="12" ry="6" fill={lighten(color, 0.15)} opacity="0.5" />
        {/* Hair shadow bottom */}
        <ellipse cx="60" cy="34" rx="32" ry="4" fill={dark} opacity="0.3" />
      </g>
    );
  }
  // short
  return (
    <g>
      <ellipse cx="60" cy="26" rx="34" ry="20" fill={color} />
      <ellipse cx="44" cy="22" rx="12" ry="7" fill={color} />
      <ellipse cx="78" cy="24" rx="10" ry="6" fill={color} />
      {/* Hair shine */}
      <ellipse cx="54" cy="16" rx="10" ry="5" fill={lighten(color, 0.15)} opacity="0.4" />
    </g>
  );
}

function HairFront({ style, color, headShape }: { style: "short" | "long"; color: string; headShape: string }) {
  if (headShape === "square") return null;
  const dark = darken(color, 0.15);

  if (style === "long") {
    return (
      <g>
        <path d="M30,32 Q40,16 60,14 Q80,16 90,32" fill={color} />
        {/* Bangs detail */}
        <path d="M38,30 Q44,20 52,22" fill="none" stroke={dark} strokeWidth="1" opacity="0.4" />
        <path d="M68,22 Q76,20 82,30" fill="none" stroke={dark} strokeWidth="1" opacity="0.4" />
      </g>
    );
  }
  // short — spiky tuft
  return (
    <g>
      <path d="M42,24 Q48,8 56,16 Q60,6 66,14 Q72,8 78,24" fill={color} />
      {/* Hair strand highlights */}
      <path d="M50,18 Q54,12 58,16" fill="none" stroke={lighten(color, 0.2)} strokeWidth="1.2" opacity="0.5" />
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
