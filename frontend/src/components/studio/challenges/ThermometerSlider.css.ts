import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[4],
  padding: vars.space[3],
  width: "100%",
});

export const label = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
  textAlign: "center",
});

export const thermoWrap = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[5],
  height: 280,
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
});

export const numberLine = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "space-between",
  height: "100%",
  paddingRight: vars.space[2],
});

export const numberTick = style({
  fontSize: "10px",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  lineHeight: "1",
});

export const numberTickZero = style({
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.sm,
});

export const thermoColumn = style({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const currentTemp = style({
  fontSize: vars.font.size["3xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  minWidth: 80,
  textAlign: "center",
});

export const targetHint = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  backgroundColor: vars.color.surface.inset,
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  border: `1px solid ${vars.color.border.subtle}`,
});

export const submitBtn = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  border: "none",
  boxShadow: vars.shadow.sm,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    transform: "scale(1.05)",
    boxShadow: vars.shadow.md,
  },
});

export const feedback = style({
  textAlign: "center",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.inset,
  width: "100%",
  maxWidth: 400,
});

export const feedbackText = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
});

export const explanation = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  marginTop: vars.space[1],
  lineHeight: vars.font.lineHeight.relaxed,
  maxWidth: 400,
});
