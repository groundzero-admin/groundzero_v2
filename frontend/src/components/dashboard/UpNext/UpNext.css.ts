import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const sectionLabel = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: vars.color.pillar.ai,
});

export const heroCard = style({
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius["2xl"],
  border: `2px solid ${vars.color.pillar.ai}30`,
  padding: vars.space[5],
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: `${vars.color.pillar.ai}60`,
    boxShadow: vars.shadow.md,
  },
});

export const heroTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
});

export const heroDesc = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const heroMeta = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  flexWrap: "wrap",
});

export const metaBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.tertiary,
  backgroundColor: vars.color.surface.inset,
  borderRadius: vars.radius.full,
  padding: `2px ${vars.space[2]}`,
});

export const scoreChip = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  fontFamily: vars.font.family.display,
  color: vars.color.pillar.ai,
  backgroundColor: `${vars.color.pillar.ai}12`,
  borderRadius: vars.radius.full,
  padding: `2px ${vars.space[2]}`,
});

export const moreList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const moreItem = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.medium,
  transition: `all ${vars.transition.base}`,
  cursor: "pointer",
  ":hover": {
    backgroundColor: vars.color.surface.hover,
    borderColor: vars.color.border.default,
  },
});

export const moreScore = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontWeight: vars.font.weight.semibold,
});

export const emptyState = style({
  textAlign: "center",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
  padding: `${vars.space[8]} 0`,
});
