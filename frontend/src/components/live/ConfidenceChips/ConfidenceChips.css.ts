import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

/* ── Dark variant (VideoArea overlay) ── */

const darkBase = {
  privacyNote: {
    fontSize: vars.font.size.xs,
    color: "rgba(255,255,255,0.6)",
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.medium,
  },
  label: {
    fontSize: vars.font.size.sm,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.extrabold,
    color: "#fff",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  },
} as const;

const lightBase = {
  privacyNote: {
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.medium,
  },
  label: {
    fontSize: vars.font.size.xs,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.bold,
    color: vars.color.text.secondary,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },
} as const;

export const privacyNote = styleVariants({
  dark: darkBase.privacyNote,
  light: lightBase.privacyNote,
});

export const label = styleVariants({
  dark: darkBase.label,
  light: lightBase.label,
});

export const chips = style({
  display: "flex",
  gap: vars.space[2],
  flexWrap: "wrap",
});

/* ── Chip: dark variant ── */

export const chipDark = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  border: "2px solid rgba(255,255,255,0.25)",
  backgroundColor: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.85)",
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  userSelect: "none",
  ":hover": {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.4)",
  },
  selectors: {
    "&:disabled": {
      opacity: 0.4,
      pointerEvents: "none",
    },
  },
});

export const chipDarkSelected = style({
  borderColor: "#fff",
  backgroundColor: "rgba(255,255,255,0.2)",
  color: "#fff",
  transform: "scale(1.05)",
  boxShadow: "0 2px 12px rgba(255,255,255,0.15)",
});

/* ── Chip: light variant ── */

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
