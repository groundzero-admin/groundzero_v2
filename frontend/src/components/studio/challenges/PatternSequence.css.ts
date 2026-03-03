import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const pulse = keyframes({
  "0%, 100%": { boxShadow: `0 0 0 0 rgba(128,90,213,0.3)` },
  "50%": { boxShadow: `0 0 0 8px rgba(128,90,213,0)` },
});

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
  padding: vars.space[3],
  width: "100%",
});

export const train = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  flexWrap: "wrap",
  justifyContent: "center",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
});

export const trainItem = style({
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.surface.raised,
  border: `2px solid ${vars.color.border.default}`,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.xl,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.sm,
});

export const trainMissing = style({
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.lg,
  border: `2.5px dashed #805AD5`,
  backgroundColor: "rgba(128,90,213,0.06)",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.xl,
  color: "#805AD5",
  animation: `${pulse} 2s ease-in-out infinite`,
});

export const trainFilled = style({
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.lg,
  border: `2.5px solid #38A169`,
  backgroundColor: "rgba(56,161,105,0.08)",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.xl,
  color: "#38A169",
  boxShadow: "0 0 12px rgba(56,161,105,0.2)",
});

export const arrow = style({
  fontSize: vars.font.size.lg,
  color: vars.color.text.tertiary,
  fontWeight: vars.font.weight.bold,
});

export const divider = style({
  width: "60%",
  height: 1,
  backgroundColor: vars.color.border.subtle,
});

export const pickLabel = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const options = style({
  display: "flex",
  gap: vars.space[3],
  flexWrap: "wrap",
  justifyContent: "center",
  padding: vars.space[4],
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.inset,
  border: `1px dashed ${vars.color.border.default}`,
});

export const optionBtn = style({
  width: 72,
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.xl,
  border: `3px solid #805AD5`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  transition: `all ${vars.transition.base}`,
  boxShadow: vars.shadow.md,
  ":hover": {
    borderColor: "#6B46C1",
    transform: "translateY(-4px) scale(1.05)",
    boxShadow: vars.shadow.lg,
    backgroundColor: "rgba(128,90,213,0.06)",
  },
});

export const optionCorrect = style({
  borderColor: "#38A169",
  backgroundColor: "rgba(56,161,105,0.1)",
  color: "#38A169",
});

export const optionWrong = style({
  borderColor: "#E53E3E",
  backgroundColor: "rgba(229,62,62,0.1)",
  color: "#E53E3E",
});

export const optionDisabled = style({
  opacity: 0.4,
  cursor: "default",
  ":hover": {
    transform: "none",
    boxShadow: "none",
  },
});

export const feedback = style({
  textAlign: "center",
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
