import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const button = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space[2],
    borderRadius: vars.radius.xl,
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.semibold,
    border: "none",
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    userSelect: "none",
    ":active": {
      transform: "scale(0.97)",
    },
    selectors: {
      "&:disabled": {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: vars.color.interactive.primary,
        color: vars.color.text.inverse,
        boxShadow: vars.shadow.sm,
        ":hover": {
          backgroundColor: vars.color.interactive.primaryHover,
        },
      },
      secondary: {
        backgroundColor: vars.color.interactive.secondary,
        color: vars.color.text.primary,
        border: `1px solid ${vars.color.border.default}`,
        ":hover": {
          backgroundColor: vars.color.interactive.secondaryHover,
          borderColor: vars.color.border.strong,
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: vars.color.text.secondary,
        ":hover": {
          backgroundColor: vars.color.surface.hover,
          color: vars.color.text.primary,
        },
      },
      danger: {
        backgroundColor: vars.color.feedback.dangerSurface,
        color: vars.color.feedback.danger,
        ":hover": {
          backgroundColor: vars.color.feedback.danger,
          color: vars.color.text.inverse,
        },
      },
    },
    size: {
      sm: {
        fontSize: vars.font.size.xs,
        padding: `${vars.space[1]} ${vars.space[3]}`,
        height: "32px",
      },
      md: {
        fontSize: vars.font.size.sm,
        padding: `${vars.space[2]} ${vars.space[4]}`,
        height: "40px",
      },
      lg: {
        fontSize: vars.font.size.base,
        padding: `${vars.space[3]} ${vars.space[6]}`,
        height: "48px",
      },
      icon: {
        padding: vars.space[2],
        height: "36px",
        width: "36px",
      },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});
