import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const heading = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const topicList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const topicCard = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.pillar.math,
    backgroundColor: vars.color.surface.hover,
  },
});

export const rank = style({
  width: "24px",
  height: "24px",
  borderRadius: vars.radius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  flexShrink: 0,
});

export const topicBody = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  minWidth: 0,
});

export const topicName = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const topicMeta = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  flexWrap: "wrap",
});

export const chapterLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const weakChip = style({
  fontSize: "10px",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  padding: `1px ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  lineHeight: vars.font.lineHeight.normal,
});

export const arrow = style({
  color: vars.color.text.tertiary,
  flexShrink: 0,
  transition: `transform ${vars.transition.base}`,
});

export const empty = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  textAlign: "center",
  padding: `${vars.space[6]} 0`,
});

export const loading = style({
  display: "flex",
  justifyContent: "center",
  padding: `${vars.space[6]} 0`,
  color: vars.color.text.tertiary,
});
