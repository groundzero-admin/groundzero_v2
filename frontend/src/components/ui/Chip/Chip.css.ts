import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const chip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  border: `2px solid ${vars.color.border.default}`,
  backgroundColor: vars.color.surface.card,
  color: vars.color.text.secondary,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  userSelect: "none",
  ":hover": {
    borderColor: vars.color.border.strong,
    backgroundColor: vars.color.surface.hover,
  },
});

export const chipSelected = style({
  transform: "scale(1.05)",
  boxShadow: vars.shadow.sm,
});
