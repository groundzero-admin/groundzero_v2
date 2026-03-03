import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const title = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const timeline = style({
  display: "flex",
  flexDirection: "column",
  position: "relative",
  paddingLeft: vars.space[8],
});

export const line = style({
  position: "absolute",
  left: "11px",
  top: "14px",
  bottom: "14px",
  width: "2px",
  backgroundColor: vars.color.border.default,
  borderRadius: vars.radius.full,
});

export const item = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  padding: `${vars.space[4]} 0`,
  position: "relative",
});

export const dot = style({
  width: "12px",
  height: "12px",
  borderRadius: vars.radius.full,
  flexShrink: 0,
  position: "absolute",
  left: "-26px",
  top: `calc(${vars.space[4]} + 2px)`,
});

export const dotUpcoming = style({
  backgroundColor: vars.color.pillar.creativity,
  boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.2)",
});

export const dotRecent = style({
  backgroundColor: vars.color.feedback.success,
});

export const dotOlder = style({
  backgroundColor: vars.color.border.strong,
});

export const dotLive = style({
  backgroundColor: "#E53E3E",
  boxShadow: "0 0 0 3px rgba(229, 62, 62, 0.25)",
});

export const sessionName = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const timestamp = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const tags = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  marginTop: vars.space[1],
  flexWrap: "wrap",
});

export const scoreTag = style({
  display: "inline-flex",
  alignItems: "center",
  padding: `2px ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  backgroundColor: vars.color.feedback.successSurface,
  color: vars.color.feedback.success,
});

export const reviewBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  backgroundColor: vars.color.surface.inset,
  color: vars.color.text.secondary,
  cursor: "pointer",
  border: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.active,
    color: vars.color.text.primary,
  },
});

export const empty = style({
  textAlign: "center",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
  padding: `${vars.space[6]} 0`,
  lineHeight: vars.font.lineHeight.relaxed,
});
