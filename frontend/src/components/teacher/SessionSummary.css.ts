import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  maxWidth: "600px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: vars.space[5],
});

export const card = style({
  padding: vars.space[6],
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
});

export const title = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.xl,
  color: vars.color.text.primary,
  marginBottom: vars.space[1],
});

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  marginBottom: vars.space[4],
});

export const statsRow = style({
  display: "flex",
  gap: vars.space[6],
  marginBottom: vars.space[5],
});

export const stat = style({
  display: "flex",
  flexDirection: "column",
});

export const statValue = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.xl,
  color: vars.color.text.primary,
});

export const statLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const activityList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const activityItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
});

export const checkIcon = style({
  color: "#38A169",
  flexShrink: 0,
});

export const startNextBtn = style({
  width: "100%",
  padding: `${vars.space[3]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.interactive.primary,
  color: "#fff",
  fontSize: vars.font.size.base,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
  },
});
