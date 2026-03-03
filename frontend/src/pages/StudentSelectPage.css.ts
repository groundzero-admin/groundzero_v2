import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space[4],
});

export const container = style({
  width: "100%",
  maxWidth: "420px",
});

export const title = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size["3xl"],
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  textAlign: "center",
  marginBottom: vars.space[2],
});

export const subtitle = style({
  textAlign: "center",
  color: vars.color.text.tertiary,
  marginBottom: vars.space[8],
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const studentBtn = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: vars.space[4],
  padding: vars.space[4],
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius["2xl"],
  boxShadow: vars.shadow.sm,
  border: `1px solid ${vars.color.border.subtle}`,
  cursor: "pointer",
  textAlign: "left",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    boxShadow: vars.shadow.md,
    borderColor: vars.color.border.default,
  },
});

export const avatarWrap = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  backgroundColor: `${vars.color.pillar.creativity}15`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const name = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});

export const meta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const empty = style({
  textAlign: "center",
  color: vars.color.text.tertiary,
  padding: `${vars.space[12]} 0`,
});

export const spinner = style({
  display: "flex",
  justifyContent: "center",
  padding: `${vars.space[12]} 0`,
});
