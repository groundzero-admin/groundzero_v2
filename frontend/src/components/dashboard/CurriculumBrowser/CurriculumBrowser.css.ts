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

export const filters = style({
  display: "flex",
  gap: vars.space[2],
  flexWrap: "wrap",
});

export const select = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.default}`,
  backgroundColor: vars.color.surface.card,
  color: vars.color.text.primary,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  outline: "none",
  ":focus": {
    borderColor: vars.color.border.strong,
  },
});

export const topicList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
});

export const topicRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
  },
});

export const chapterNum = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  width: "24px",
  textAlign: "center",
  flexShrink: 0,
});

export const topicName = style({
  flex: 1,
  fontSize: vars.font.size.xs,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.normal,
});

export const topicGrade = style({
  fontSize: "10px",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  flexShrink: 0,
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
