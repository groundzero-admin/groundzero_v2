import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
  padding: vars.space[3],
  width: "100%",
});

export const options = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space[3],
  width: "100%",
  maxWidth: 500,
});

export const optionBtn = style({
  padding: `${vars.space[4]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `2px solid ${vars.color.border.default}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
  textAlign: "center",
  transition: `all ${vars.transition.base}`,
  boxShadow: vars.shadow.sm,
  ":hover": {
    borderColor: vars.color.interactive.primary,
    transform: "translateY(-3px)",
    boxShadow: vars.shadow.lg,
    backgroundColor: "rgba(128,90,213,0.04)",
  },
});

export const optionCorrect = style({
  borderColor: "#38A169",
  backgroundColor: "rgba(56,161,105,0.08)",
  color: "#2F855A",
  boxShadow: "0 0 16px rgba(56,161,105,0.2)",
});

export const optionWrong = style({
  borderColor: "#E53E3E",
  backgroundColor: "rgba(229,62,62,0.08)",
  color: "#C53030",
  boxShadow: "0 0 16px rgba(229,62,62,0.2)",
});

export const optionDisabled = style({
  opacity: 0.4,
  cursor: "default",
  boxShadow: "none",
  ":hover": {
    transform: "none",
    boxShadow: "none",
    borderColor: vars.color.border.default,
    backgroundColor: vars.color.surface.card,
  },
});

export const feedback = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[2],
  textAlign: "center",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.inset,
  maxWidth: 460,
  width: "100%",
});

export const feedbackText = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
});

export const explanation = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
  maxWidth: 420,
});
