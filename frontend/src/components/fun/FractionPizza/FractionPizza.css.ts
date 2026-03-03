import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[6],
  padding: vars.space[6],
});

export const title = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  textAlign: "center",
});

export const questionText = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  textAlign: "center",
});

export const pizzaContainer = style({
  position: "relative",
  width: 260,
  height: 260,
});

export const options = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space[3],
  width: "100%",
  maxWidth: 400,
});

export const optionBtn = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  ":hover": {
    borderColor: vars.color.border.strong,
    backgroundColor: vars.color.surface.hover,
    transform: "scale(1.03)",
  },
});

export const optionCorrect = style({
  borderColor: vars.color.feedback.success,
  backgroundColor: vars.color.feedback.successSurface,
  boxShadow: `0 0 0 2px ${vars.color.feedback.success}`,
  pointerEvents: "none",
});

export const optionWrong = style({
  borderColor: vars.color.feedback.danger,
  backgroundColor: vars.color.feedback.dangerSurface,
  opacity: 0.6,
  pointerEvents: "none",
});

export const optionDisabled = style({
  pointerEvents: "none",
  opacity: 0.5,
});

const confettiFall = keyframes({
  "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
  "100%": { transform: "translateY(120px) rotate(720deg)", opacity: "0" },
});

export const confetti = style({
  position: "absolute",
  width: 8,
  height: 8,
  borderRadius: "2px",
  animation: `${confettiFall} 1.2s ease-out forwards`,
});

export const feedbackText = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  textAlign: "center",
});

export const nextBtn = style({
  padding: `${vars.space[3]} ${vars.space[8]}`,
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    transform: "scale(1.05)",
  },
});

export const score = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
});
