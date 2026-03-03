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

export const dimensions = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  backgroundColor: vars.color.surface.inset,
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  border: `1px solid ${vars.color.border.subtle}`,
});

export const gridWrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  padding: vars.space[3],
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
});

export const gridRow = style({
  display: "flex",
  gap: 3,
});

export const cell = style({
  width: 48,
  height: 48,
  border: `1.5px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  cursor: "pointer",
  transition: `all ${vars.transition.fast}`,
  backgroundColor: vars.color.surface.raised,
  ":hover": {
    borderColor: "#3182CE",
    backgroundColor: "rgba(49,130,206,0.06)",
  },
});

export const cellFilled = style({
  backgroundColor: "rgba(49,130,206,0.18)",
  borderColor: "#3182CE",
  boxShadow: "inset 0 0 8px rgba(49,130,206,0.1)",
});

export const cellLocked = style({
  cursor: "default",
  ":hover": {
    borderColor: vars.color.border.default,
    backgroundColor: vars.color.surface.raised,
  },
});

export const counter = style({
  fontSize: vars.font.size.xl,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  backgroundColor: vars.color.surface.inset,
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
});

export const submitBtn = style({
  padding: `${vars.space[2]} ${vars.space[6]}`,
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
});
