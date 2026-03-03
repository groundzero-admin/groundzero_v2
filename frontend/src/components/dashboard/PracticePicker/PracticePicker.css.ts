import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const heading = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const pillars = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const pillarBtn = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  width: "100%",
  textAlign: "left",
  ":hover": {
    borderColor: vars.color.border.default,
    backgroundColor: vars.color.surface.hover,
  },
});

export const pillarBtnExpanded = style({
  borderColor: vars.color.border.strong,
  backgroundColor: vars.color.surface.hover,
});

export const pillarDot = style({
  width: "10px",
  height: "10px",
  borderRadius: vars.radius.full,
  flexShrink: 0,
});

export const pillarName = style({
  flex: 1,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});

export const pillarPct = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
});

export const chevron = style({
  color: vars.color.text.tertiary,
  transition: `transform ${vars.transition.base}`,
});

export const chevronOpen = style({
  transform: "rotate(90deg)",
});

export const compList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  paddingLeft: vars.space[4],
  paddingRight: vars.space[1],
});

export const compRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
  },
});

export const compName = style({
  flex: 1,
  fontSize: vars.font.size.xs,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.normal,
});

export const compStage = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  flexShrink: 0,
});

export const compBar = style({
  width: "48px",
  flexShrink: 0,
});

export const noMcq = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontStyle: "italic",
  padding: `${vars.space[1]} 0`,
});
