import { motion } from "framer-motion";
import type { AccessoryType, HeadShape, Action } from "../types";
import { WizardHat } from "./accessories/WizardHat";
import { Wand } from "./accessories/Wand";
import { SpaceHelmet } from "./accessories/SpaceHelmet";
import { Jetpack } from "./accessories/Jetpack";
import { LeafCrown } from "./accessories/LeafCrown";
import { Binoculars } from "./accessories/Binoculars";
import { DivingMask } from "./accessories/DivingMask";
import { Trident } from "./accessories/Trident";

interface AccessoryProps {
  type: AccessoryType;
  headShape: HeadShape;
  action: Action;
}

export function Accessory({ type, headShape, action }: AccessoryProps) {
  const isTalking = action === "talking";
  const bobOffset = isTalking ? [0, -2, 0] : [0];

  switch (type) {
    case "wizard-hat":
      return <WizardHat headShape={headShape} action={action} />;
    case "wand":
      return <Wand headShape={headShape} action={action} />;
    case "space-helmet":
      return <SpaceHelmet headShape={headShape} action={action} />;
    case "jetpack":
      return <Jetpack headShape={headShape} action={action} />;
    case "leaf-crown":
      return <LeafCrown headShape={headShape} action={action} />;
    case "binoculars":
      return <Binoculars headShape={headShape} action={action} />;
    case "diving-mask":
      return <DivingMask headShape={headShape} action={action} />;
    case "trident":
      return <Trident headShape={headShape} action={action} />;
    case "chef-hat":
      return (
        <motion.g animate={{ y: bobOffset }} transition={{ repeat: Infinity, duration: 0.6 }}>
          {/* Hat band */}
          <ellipse cx="60" cy="18" rx="30" ry="6" fill="#F5F0E8" stroke="#D4C9B8" strokeWidth="1" />
          {/* Hat puff — layered circles for volume */}
          <ellipse cx="60" cy="6" rx="24" ry="16" fill="white" stroke="#E0D5C8" strokeWidth="1" />
          <ellipse cx="50" cy="4" rx="12" ry="12" fill="white" />
          <ellipse cx="70" cy="5" rx="11" ry="11" fill="white" />
          <ellipse cx="60" cy="-2" rx="10" ry="10" fill="white" />
          {/* Shading */}
          <ellipse cx="60" cy="10" rx="18" ry="6" fill="#F0EBE3" opacity="0.5" />
          {/* Top highlight */}
          <ellipse cx="56" cy="-4" rx="5" ry="4" fill="white" opacity="0.6" />
          {/* Band detail */}
          <line x1="36" y1="18" x2="84" y2="18" stroke="#C4B9A8" strokeWidth="0.5" opacity="0.5" />
        </motion.g>
      );

    case "magnifying-glass":
      return (
        <motion.g
          animate={
            action === "pointing"
              ? { x: [0, 6, 0], rotate: [0, 8, 0] }
              : { rotate: [0, -4, 0] }
          }
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ transformOrigin: "100px 100px" }}
        >
          {/* Handle shadow */}
          <line x1="101" y1="102" x2="115" y2="122" stroke="#6B4F0A" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
          {/* Handle */}
          <line x1="100" y1="100" x2="114" y2="120" stroke="#A67C14" strokeWidth="5" strokeLinecap="round" />
          <line x1="100" y1="100" x2="114" y2="120" stroke="#C49A20" strokeWidth="3" strokeLinecap="round" />
          {/* Ring shadow */}
          <circle cx="96" cy="92" r="14" fill="none" stroke="#6B4F0A" strokeWidth="3.5" opacity="0.2" />
          {/* Ring */}
          <circle cx="96" cy="90" r="14" fill="none" stroke="#A67C14" strokeWidth="3.5" />
          <circle cx="96" cy="90" r="14" fill="none" stroke="#C49A20" strokeWidth="1.5" />
          {/* Lens */}
          <circle cx="96" cy="90" r="12" fill="#E8F4FD" opacity="0.4" />
          {/* Lens gradient */}
          <circle cx="96" cy="90" r="12" fill="url(#lensGrad)" opacity="0.3" />
          {/* Glare */}
          <path d="M88,84 Q91,80 94,84" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <circle cx="90" cy="86" r="2" fill="white" opacity="0.4" />
        </motion.g>
      );

    case "sunglasses":
      return (
        <motion.g animate={{ y: bobOffset }} transition={{ repeat: Infinity, duration: 0.6 }}>
          {/* Temples (arms) */}
          <line x1={headShape === "square" ? 30 : 32} y1={headShape === "square" ? 44 : 42} x2={headShape === "square" ? 26 : 28} y2={headShape === "square" ? 50 : 48} stroke="#0D0D1A" strokeWidth="2" strokeLinecap="round" />
          <line x1={headShape === "square" ? 90 : 88} y1={headShape === "square" ? 44 : 42} x2={headShape === "square" ? 94 : 92} y2={headShape === "square" ? 50 : 48} stroke="#0D0D1A" strokeWidth="2" strokeLinecap="round" />
          {/* Bridge */}
          <path
            d={`M${headShape === "square" ? 52 : 50},${headShape === "square" ? 42 : 40} Q60,${headShape === "square" ? 44 : 43} ${headShape === "square" ? 68 : 70},${headShape === "square" ? 42 : 40}`}
            fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Left lens */}
          <rect
            x={headShape === "square" ? 33 : 34}
            y={headShape === "square" ? 37 : 35}
            width="20" height="14" rx="4"
            fill="#0D0D1A"
            stroke="#2A2A4E"
            strokeWidth="1"
          />
          {/* Right lens */}
          <rect
            x={headShape === "square" ? 67 : 66}
            y={headShape === "square" ? 37 : 35}
            width="20" height="14" rx="4"
            fill="#0D0D1A"
            stroke="#2A2A4E"
            strokeWidth="1"
          />
          {/* Lens shine — left */}
          <rect
            x={headShape === "square" ? 35 : 36}
            y={headShape === "square" ? 38 : 36}
            width="8" height="3" rx="1.5"
            fill="#4A4A7E" opacity="0.5"
          />
          {/* Lens shine — right */}
          <rect
            x={headShape === "square" ? 69 : 68}
            y={headShape === "square" ? 38 : 36}
            width="8" height="3" rx="1.5"
            fill="#4A4A7E" opacity="0.5"
          />
          {/* Subtle color reflection */}
          <rect
            x={headShape === "square" ? 39 : 40}
            y={headShape === "square" ? 44 : 42}
            width="6" height="2" rx="1"
            fill="#805AD5" opacity="0.15"
          />
          <rect
            x={headShape === "square" ? 73 : 72}
            y={headShape === "square" ? 44 : 42}
            width="6" height="2" rx="1"
            fill="#805AD5" opacity="0.15"
          />
        </motion.g>
      );

    case "hard-hat":
      return (
        <motion.g animate={{ y: bobOffset }} transition={{ repeat: Infinity, duration: 0.6 }}>
          {/* Brim shadow */}
          <ellipse cx="60" cy="24" rx="36" ry="5" fill="#B87700" opacity="0.2" />
          {/* Brim */}
          <ellipse cx="60" cy="22" rx="36" ry="5" fill="#F9A825" stroke="#E68A00" strokeWidth="1.5" />
          {/* Dome */}
          <path d="M32,22 Q32,2 60,2 Q88,2 88,22" fill="#F9A825" stroke="#E68A00" strokeWidth="1.5" />
          {/* Dome highlight */}
          <path d="M44,10 Q52,4 68,10" fill="none" stroke="#FFD54F" strokeWidth="2" opacity="0.5" />
          {/* Ridge */}
          <line x1="60" y1="2" x2="60" y2="22" stroke="#E68A00" strokeWidth="2" />
          {/* Side ridges */}
          <path d="M42,18 Q42,6 60,4" fill="none" stroke="#E68A00" strokeWidth="1" opacity="0.4" />
          <path d="M78,18 Q78,6 60,4" fill="none" stroke="#E68A00" strokeWidth="1" opacity="0.4" />
        </motion.g>
      );

    case "scarf":
      return (
        <motion.g
          animate={isTalking ? { y: [0, -1, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.6 }}
        >
          {/* Scarf wrap */}
          <path
            d="M34,76 Q38,70 60,70 Q82,70 86,76 L88,82 Q60,78 32,82 Z"
            fill="#E74C3C"
            stroke="#C0392B"
            strokeWidth="1"
          />
          {/* Scarf knot */}
          <ellipse cx="48" cy="78" rx="6" ry="4" fill="#D32F2F" stroke="#B71C1C" strokeWidth="0.5" />
          {/* Scarf tail */}
          <motion.path
            d="M44,80 L40,100 Q42,102 46,100 L48,82"
            fill="#E74C3C"
            stroke="#C0392B"
            strokeWidth="1"
            animate={{
              d: [
                "M44,80 L40,100 Q42,102 46,100 L48,82",
                "M44,80 L38,102 Q40,104 44,102 L48,82",
                "M44,80 L40,100 Q42,102 46,100 L48,82",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
          {/* Stripe pattern */}
          <line x1="40" y1="90" x2="46" y2="90" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.4" />
          <line x1="39" y1="95" x2="45" y2="95" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.4" />
          {/* Wrap texture */}
          <path d="M40,72 Q50,70 60,72 Q70,70 80,72" fill="none" stroke="#B71C1C" strokeWidth="0.5" opacity="0.3" />
        </motion.g>
      );

    case "antenna":
      return (
        <motion.g>
          {/* Antenna stalk */}
          <motion.line
            x1="60" y1="6" x2="60" y2="20"
            stroke="#5B3D8F" strokeWidth="3" strokeLinecap="round"
            animate={isTalking ? { x1: [58, 62, 58] } : {}}
            transition={{ repeat: Infinity, duration: 0.4 }}
          />
          {/* Antenna base */}
          <rect x="55" y="18" width="10" height="4" rx="2" fill="#5B3D8F" />
          {/* Orb glow (behind) */}
          <motion.circle
            cx="60" cy="4" r="8"
            fill="#805AD5"
            opacity="0.15"
            animate={isTalking ? { r: [8, 12, 8], opacity: [0.15, 0.25, 0.15] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          {/* Orb */}
          <motion.circle
            cx="60" cy="4" r="6"
            fill="#805AD5"
            animate={isTalking ? { scale: [1, 1.2, 1], fill: ["#805AD5", "#B794F4", "#805AD5"] } : {}}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
          {/* Orb highlight */}
          <circle cx="58" cy="2" r="2.5" fill="#D6BCFA" opacity="0.6" />
          <circle cx="62" cy="5" r="1" fill="#E9D8FD" opacity="0.4" />
          {/* Signal waves when talking */}
          {isTalking && (
            <>
              <motion.circle
                cx="60" cy="4" r="10"
                fill="none" stroke="#B794F4" strokeWidth="1.5"
                animate={{ opacity: [0, 0.6, 0], r: [8, 16, 24] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <motion.circle
                cx="60" cy="4" r="10"
                fill="none" stroke="#B794F4" strokeWidth="1"
                animate={{ opacity: [0, 0.4, 0], r: [8, 16, 24] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
              />
            </>
          )}
        </motion.g>
      );

    default:
      return null;
  }
}
