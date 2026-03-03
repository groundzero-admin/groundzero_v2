import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const questionNumber = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export const questionText = style({
  fontSize: vars.font.size.base,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.display,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const options = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const option = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  userSelect: "none",
  ":hover": {
    borderColor: vars.color.border.default,
    backgroundColor: vars.color.surface.hover,
  },
});

export const optionSelected = style({
  borderColor: vars.color.interactive.primary,
  backgroundColor: `${vars.color.interactive.primary}10`,
  boxShadow: `0 0 0 1px ${vars.color.interactive.primary}`,
});

export const optionCorrect = style({
  borderColor: vars.color.feedback.success,
  backgroundColor: vars.color.feedback.successSurface,
  boxShadow: `0 0 0 1px ${vars.color.feedback.success}`,
});

export const optionWrong = style({
  borderColor: vars.color.feedback.danger,
  backgroundColor: vars.color.feedback.dangerSurface,
  boxShadow: `0 0 0 1px ${vars.color.feedback.danger}`,
});

export const optionDisabled = style({
  pointerEvents: "none",
  opacity: 0.7,
});

export const optionLabel = style({
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.full,
  border: `2px solid ${vars.color.border.default}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  fontFamily: vars.font.family.display,
  color: vars.color.text.secondary,
  flexShrink: 0,
  transition: `all ${vars.transition.base}`,
});

export const optionLabelSelected = style({
  borderColor: vars.color.interactive.primary,
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
});

export const optionLabelCorrect = style({
  borderColor: vars.color.feedback.success,
  backgroundColor: vars.color.feedback.success,
  color: vars.color.text.inverse,
});

export const optionLabelWrong = style({
  borderColor: vars.color.feedback.danger,
  backgroundColor: vars.color.feedback.danger,
  color: vars.color.text.inverse,
});

export const optionText = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.relaxed,
  paddingTop: "2px",
});

export const explanation = style({
  padding: vars.space[4],
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.feedback.infoSurface,
  border: `1px solid ${vars.color.feedback.info}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const feedbackRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
});

export const feedbackCorrect = style({
  color: vars.color.feedback.success,
});

export const feedbackWrong = style({
  color: vars.color.feedback.danger,
});
