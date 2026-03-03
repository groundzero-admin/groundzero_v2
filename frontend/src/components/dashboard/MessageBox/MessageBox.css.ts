import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
});

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const inputRow = style({
  display: "flex",
  gap: vars.space[2],
});

export const input = style({
  flex: 1,
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.default}`,
  backgroundColor: vars.color.surface.card,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  outline: "none",
  transition: `border-color ${vars.transition.base}`,
  "::placeholder": {
    color: vars.color.text.tertiary,
  },
  ":focus": {
    borderColor: vars.color.pillar.creativity,
  },
});

export const sendBtn = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.pillar.creativity,
  color: vars.color.text.inverse,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    opacity: 0.85,
    transform: "scale(1.05)",
  },
  ":active": {
    transform: "scale(0.95)",
  },
});
