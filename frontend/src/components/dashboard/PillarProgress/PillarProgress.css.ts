import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: vars.space[4],
  "@media": {
    "screen and (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const pillarCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[5],
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius["2xl"],
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  transition: `all ${vars.transition.base}`,
  cursor: "default",
  ":hover": {
    boxShadow: vars.shadow.md,
  },
});

export const pillarHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const pillarName = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
});

export const pillarIcon = style({
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  flexShrink: 0,
});

export const pctLabel = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.xl,
});

export const meta = style({
  display: "flex",
  gap: vars.space[3],
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const metaItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
});

export const stuckDot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.feedback.danger,
});
