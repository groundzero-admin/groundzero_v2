import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const badge = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: vars.radius.full,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.semibold,
    whiteSpace: "nowrap",
    lineHeight: 1,
  },
  variants: {
    size: {
      sm: { fontSize: vars.font.size.xs, padding: `2px ${vars.space[2]}` },
      md: { fontSize: vars.font.size.xs, padding: `${vars.space[1]} ${vars.space[3]}` },
      lg: { fontSize: vars.font.size.sm, padding: `${vars.space[1]} ${vars.space[4]}` },
    },
    tone: {
      neutral: {
        backgroundColor: vars.color.surface.inset,
        color: vars.color.text.secondary,
      },
      success: {
        backgroundColor: vars.color.feedback.successSurface,
        color: vars.color.feedback.success,
      },
      warning: {
        backgroundColor: vars.color.feedback.warningSurface,
        color: vars.color.feedback.warning,
      },
      danger: {
        backgroundColor: vars.color.feedback.dangerSurface,
        color: vars.color.feedback.danger,
      },
      info: {
        backgroundColor: vars.color.feedback.infoSurface,
        color: vars.color.feedback.info,
      },
      gold: {
        backgroundColor: `${vars.color.accent.gold}20`,
        color: vars.color.accent.gold,
      },
    },
  },
  defaultVariants: {
    size: "md",
    tone: "neutral",
  },
});
