import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const nav = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
});

export const link = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  textDecoration: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    color: vars.color.text.secondary,
    backgroundColor: vars.color.surface.hover,
  },
});

export const linkActive = style({
  backgroundColor: vars.color.surface.card,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.sm,
});
