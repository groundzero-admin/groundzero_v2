import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const sidebar = style({
  width: "280px",
  minWidth: "280px",
  height: "100%",
  overflowY: "auto",
  borderRight: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  padding: `${vars.space[4]} 0`,
});

export const section = style({
  padding: `0 ${vars.space[4]}`,
  marginBottom: vars.space[5],
});

export const sectionTitle = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: vars.space[3],
});

/* ── Cohorts ── */

export const cohortList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const cohortCard = style({
  width: "100%",
  padding: `${vars.space[3]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.page,
  cursor: "pointer",
  textAlign: "left",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    boxShadow: vars.shadow.sm,
  },
});

export const cohortCardActive = style({
  borderColor: vars.color.interactive.primary,
  backgroundColor: `${vars.color.interactive.primary}08`,
  boxShadow: `0 0 0 1px ${vars.color.interactive.primary}30`,
  ":hover": {
    borderColor: vars.color.interactive.primary,
  },
});

export const cohortName = style({
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  marginBottom: "2px",
});

export const cohortMeta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

/* ── Students ── */

export const studentGrid = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space[2],
});

export const avatarCircle = style({
  width: "36px",
  height: "36px",
  borderRadius: vars.radius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: vars.font.weight.bold,
  color: "#fff",
  cursor: "default",
  position: "relative",
});

/* ── Live Pulse ── */

export const pulseList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const pulseItem = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.surface.page,
  border: `1px solid ${vars.color.border.subtle}`,
  display: "flex",
  gap: vars.space[2],
  alignItems: "flex-start",
});

export const pulseIcon = style({
  flexShrink: 0,
  marginTop: "2px",
});

export const pulseText = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.normal,
});

export const pulseBold = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});

export const empty = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontStyle: "italic",
});
