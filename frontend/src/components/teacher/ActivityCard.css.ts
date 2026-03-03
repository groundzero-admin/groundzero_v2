import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const card = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space[4]} ${vars.space[5]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    boxShadow: vars.shadow.sm,
  },
});

export const info = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
});

export const name = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
});

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  lineHeight: vars.font.lineHeight.normal,
});

export const launchBtn = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.interactive.primary,
  color: "#fff",
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
  },
});

export const badge = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.tertiary,
  whiteSpace: "nowrap",
});

export const liveBadge = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: "#38A169",
  whiteSpace: "nowrap",
});

export const liveDot = style({
  width: "8px",
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: "#38A169",
});
