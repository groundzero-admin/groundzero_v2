import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[5],
  maxWidth: "680px",
  margin: "0 auto",
});

export const backLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  cursor: "pointer",
  transition: `color ${vars.transition.base}`,
  border: "none",
  background: "none",
  padding: 0,
  ":hover": {
    color: vars.color.text.primary,
  },
});

export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const title = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
});

export const progressRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  color: vars.color.text.secondary,
});

export const loading = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: `${vars.space[16]} 0`,
  color: vars.color.text.tertiary,
});
