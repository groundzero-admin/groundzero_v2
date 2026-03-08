import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const item = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  transition: `all ${vars.transition.base}`,
});

export const itemActive = style({
  borderColor: "#38A169",
  boxShadow: "0 0 0 1px #38A169",
});

export const itemCompleted = style({
  opacity: 0.7,
});

export const statusIcon = style({
  flexShrink: 0,
  width: "24px",
  height: "24px",
  borderRadius: vars.radius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "700",
});

export const statusCompleted = style({
  backgroundColor: "#38A169",
  color: "#fff",
});

export const statusActive = style({
  backgroundColor: "#38A169",
  color: "#fff",
  animation: "pulse 2s ease-in-out infinite",
});

export const statusPending = style({
  backgroundColor: vars.color.surface.inset,
  color: vars.color.text.tertiary,
  border: `1px solid ${vars.color.border.default}`,
});

export const info = style({
  flex: 1,
  minWidth: 0,
});

export const activityName = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const activityType = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  textTransform: "capitalize" as const,
});

export const launchBtn = style({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.interactive.primary,
  color: "#fff",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
  },
});

export const liveBadge = style({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: "#38A169",
});

export const liveDot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: "#38A169",
});

export const timerBadge = style({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontVariantNumeric: "tabular-nums",
});
