import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const header = style({
  position: "sticky",
  top: 0,
  zIndex: Number(vars.zIndex.sticky),
  backgroundColor: vars.color.surface.overlay,
  backdropFilter: "blur(12px)",
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const inner = style({
  padding: `0 ${vars.space[6]}`,
  height: "56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const brand = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  cursor: "pointer",
});

export const brandName = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
});

export const badge = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.interactive.primary,
  backgroundColor: `${vars.color.interactive.primary}15`,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radius.md,
  marginLeft: vars.space[2],
});

export const right = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
});

export const userName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.medium,
});

export const iconBtn = style({
  padding: vars.space[1],
  borderRadius: vars.radius.lg,
  color: vars.color.text.tertiary,
  transition: `all ${vars.transition.base}`,
  cursor: "pointer",
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  ":hover": {
    color: vars.color.text.secondary,
    backgroundColor: vars.color.surface.hover,
  },
});
