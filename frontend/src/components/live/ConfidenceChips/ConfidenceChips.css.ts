import { style, styleVariants, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

/* ── Press/bounce animation ── */
const press = keyframes({
  "0%": { transform: "scale(1)" },
  "35%": { transform: "scale(0.87)" },
  "65%": { transform: "scale(1.07)" },
  "100%": { transform: "scale(1)" },
});

const pulseGlow = keyframes({
  "0%": { boxShadow: "0 0 0 var(--pulse-color)", transform: "scale(1)" },
  "40%": { boxShadow: "0 0 22px var(--pulse-color)", transform: "scale(1.06)" },
  "100%": { boxShadow: "0 0 0 var(--pulse-color)", transform: "scale(1)" },
});

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const privacyNote = styleVariants({
  dark: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.medium,
    letterSpacing: "0.3px",
  },
  light: {
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.medium,
  },
});

export const label = styleVariants({
  dark: {
    fontSize: 11,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.bold,
    color: "rgba(255,255,255,0.88)",
    letterSpacing: "0.7px",
    textTransform: "uppercase" as const,
  },
  light: {
    fontSize: vars.font.size.xs,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.bold,
    color: vars.color.text.secondary,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },
});

export const chips = style({
  display: "flex",
  gap: 8,
  flexWrap: "nowrap",
});

/* ─── Dark base chip ─── */
export const chipDark = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "9px 6px",
  borderRadius: 12,
  border: "1.5px solid rgba(255,255,255,0.11)",
  backgroundColor: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.58)",
  fontSize: 12,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
  userSelect: "none",
  ":hover": {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderColor: "rgba(255,255,255,0.24)",
    color: "#fff",
  },
  ":active": {
    animation: `${press} 0.3s ease`,
  },
  selectors: {
    "&:disabled": {
      opacity: 1,
      pointerEvents: "none",
    },
  },
});

/* plays the bounce on selection too */
export const chipDarkSelected = style({
  animation: `${press} 0.3s ease`,
});

// Extra local "clicked" impression (only affects this student's UI).
export const chipPulse = style({
  animation: `${pulseGlow} 0.6s ease`,
});

/* ─── Per-mood selected colours ─── */
export const chipGotIt = style({
  borderColor: "rgba(34,197,94,0.65) !important",
  backgroundColor: "rgba(34,197,94,0.16) !important",
  color: "#4ade80 !important",
  boxShadow: "0 0 14px rgba(34,197,94,0.22)",
});
export const chipKinda = style({
  borderColor: "rgba(245,158,11,0.65) !important",
  backgroundColor: "rgba(245,158,11,0.16) !important",
  color: "#fbbf24 !important",
  boxShadow: "0 0 14px rgba(245,158,11,0.22)",
});
export const chipLost = style({
  borderColor: "rgba(239,68,68,0.65) !important",
  backgroundColor: "rgba(239,68,68,0.16) !important",
  color: "#f87171 !important",
  boxShadow: "0 0 14px rgba(239,68,68,0.22)",
});

/* ─── Per-mood base colours (when enabled, but NOT persistent-selected) ─── */
export const chipGotItBase = style({
  borderColor: "rgba(34,197,94,0.45) !important",
  backgroundColor: "rgba(34,197,94,0.10) !important",
  color: "#22c55e !important",
});
export const chipKindaBase = style({
  borderColor: "rgba(245,158,11,0.45) !important",
  backgroundColor: "rgba(245,158,11,0.10) !important",
  color: "#f59e0b !important",
});
export const chipLostBase = style({
  borderColor: "rgba(239,68,68,0.45) !important",
  backgroundColor: "rgba(239,68,68,0.10) !important",
  color: "#ef4444 !important",
});

/* ─── Per-mood disabled colours (10s cooldown) ─── */
export const chipGotItDisabled = style({
  borderColor: "rgba(34,197,94,0.20) !important",
  backgroundColor: "rgba(34,197,94,0.07) !important",
  color: "rgba(34,197,94,0.75) !important",
});
export const chipKindaDisabled = style({
  borderColor: "rgba(245,158,11,0.20) !important",
  backgroundColor: "rgba(245,158,11,0.07) !important",
  color: "rgba(245,158,11,0.75) !important",
});
export const chipLostDisabled = style({
  borderColor: "rgba(239,68,68,0.22) !important",
  backgroundColor: "rgba(239,68,68,0.07) !important",
  color: "rgba(239,68,68,0.80) !important",
});

/* ─── Light base chip ─── */
export const chipLight = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  userSelect: "none",
  ":hover": {
    backgroundColor: vars.color.surface.hover,
    borderColor: vars.color.border.default,
  },
  ":active": {
    animation: `${press} 0.3s ease`,
  },
  selectors: {
    "&:disabled": {
      opacity: 0.4,
      pointerEvents: "none",
    },
  },
});

export const chipLightSelected = style({
  borderColor: vars.color.interactive.primary,
  backgroundColor: `${vars.color.interactive.primary}10`,
  color: vars.color.text.primary,
  transform: "scale(1.05)",
  boxShadow: vars.shadow.sm,
});
