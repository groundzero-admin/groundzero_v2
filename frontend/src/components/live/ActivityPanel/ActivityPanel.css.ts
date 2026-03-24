import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
  height: "100%",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
});

export const moduleBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
});

export const durationTag = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  marginLeft: "auto",
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
});

export const activityTitle = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const activityDesc = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const compTabs = style({
  display: "flex",
  gap: vars.space[1],
  flexWrap: "wrap",
});

export const compTab = style({
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  backgroundColor: vars.color.surface.inset,
  border: `2px solid transparent`,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
    color: vars.color.text.primary,
  },
});

export const compTabActive = style({
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  borderColor: vars.color.interactive.primary,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    color: vars.color.text.inverse,
  },
});

export const divider = style({
  height: "1px",
  backgroundColor: vars.color.border.subtle,
});

export const progressMini = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.display,
});

export const questionArea = style({
  flex: 1,
  overflow: "auto",
});

export const actions = style({
  display: "flex",
  gap: vars.space[2],
  paddingTop: vars.space[3],
  borderTop: `1px solid ${vars.color.border.subtle}`,
});

export const emptyState = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[3],
  padding: vars.space[8],
  textAlign: "center",
  color: vars.color.text.tertiary,
});

export const emptyIcon = style({
  width: "56px",
  height: "56px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surface.inset,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.text.tertiary,
});

export const emptyTitle = style({
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
});

export const emptyText = style({
  fontSize: vars.font.size.sm,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const popIn = keyframes({
  "0%": { opacity: "0", transform: "translateY(4px) scale(0.98)" },
  "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
});

export const shakeX = keyframes({
  "0%": { transform: "translateX(0)" },
  "30%": { transform: "translateX(-2px)" },
  "60%": { transform: "translateX(2px)" },
  "100%": { transform: "translateX(0)" },
});

export const softAppear = keyframes({
  "0%": {
    opacity: "0",
    transform: "translateY(8px)",
    filter: "blur(1px)",
  },
  "100%": {
    opacity: "1",
    transform: "translateY(0)",
    filter: "blur(0px)",
  },
});

export const dotsPulse = keyframes({
  "0%": { opacity: "0.25", transform: "translateY(0)" },
  "50%": { opacity: "1", transform: "translateY(-1px)" },
  "100%": { opacity: "0.25", transform: "translateY(0)" },
});
