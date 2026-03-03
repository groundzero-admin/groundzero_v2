import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  padding: `${vars.space[6]} ${vars.space[5]}`,
});

export const backLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  marginBottom: vars.space[6],
  cursor: "pointer",
  transition: `color ${vars.transition.fast}`,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  ":hover": {
    color: vars.color.text.primary,
  },
});

export const header = style({
  textAlign: "center",
  marginBottom: vars.space[8],
  maxWidth: 560,
  margin: `0 auto ${vars.space[8]}`,
});

export const title = style({
  fontSize: vars.font.size["3xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  marginBottom: vars.space[2],
  letterSpacing: "-0.02em",
});

export const subtitle = style({
  fontSize: vars.font.size.base,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.display,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: vars.space[5],
  maxWidth: 1080,
  margin: "0 auto",
  "@media": {
    "(max-width: 480px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: vars.space[3],
    },
  },
});
