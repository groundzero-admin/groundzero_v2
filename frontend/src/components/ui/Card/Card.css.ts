import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const card = recipe({
  base: {
    backgroundColor: vars.color.surface.card,
    borderRadius: vars.radius["2xl"],
    padding: vars.space[6],
    border: `1px solid ${vars.color.border.subtle}`,
    transition: `box-shadow ${vars.transition.base}, border-color ${vars.transition.base}`,
  },
  variants: {
    elevation: {
      flat: { boxShadow: "none" },
      low: { boxShadow: vars.shadow.sm },
      mid: { boxShadow: vars.shadow.md },
      high: { boxShadow: vars.shadow.lg },
    },
    interactive: {
      true: {
        cursor: "pointer",
        ":hover": {
          boxShadow: vars.shadow.md,
          borderColor: vars.color.border.default,
        },
        ":active": {
          transform: "scale(0.99)",
        },
      },
    },
  },
  defaultVariants: {
    elevation: "low",
  },
});
