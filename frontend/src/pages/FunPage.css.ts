import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  padding: `${vars.space[6]} ${vars.space[4]}`,
});

export const header = style({
  textAlign: "center",
  marginBottom: vars.space[8],
});

export const title = style({
  fontSize: vars.font.size["4xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  marginBottom: vars.space[2],
});

export const subtitle = style({
  fontSize: vars.font.size.base,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
});

export const tabs = style({
  display: "flex",
  justifyContent: "center",
  gap: vars.space[2],
  marginBottom: vars.space[8],
});

export const tab = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.full,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    transform: "translateY(-1px)",
  },
});

export const tabActive = style({
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  borderColor: vars.color.interactive.primary,
});

export const content = style({
  maxWidth: 720,
  margin: "0 auto",
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius["2xl"],
  boxShadow: vars.shadow.lg,
  overflow: "hidden",
});

export const backLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  marginBottom: vars.space[4],
  cursor: "pointer",
  transition: `color ${vars.transition.fast}`,
  ":hover": {
    color: vars.color.text.primary,
  },
});
