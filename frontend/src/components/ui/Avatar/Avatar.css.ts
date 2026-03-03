import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const avatar = recipe({
  base: {
    borderRadius: vars.radius.full,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: vars.font.family.display,
    fontWeight: vars.font.weight.bold,
    color: vars.color.text.inverse,
    flexShrink: 0,
    userSelect: "none",
  },
  variants: {
    size: {
      sm: { width: "32px", height: "32px", fontSize: vars.font.size.xs },
      md: { width: "40px", height: "40px", fontSize: vars.font.size.sm },
      lg: { width: "56px", height: "56px", fontSize: vars.font.size.lg },
      xl: { width: "80px", height: "80px", fontSize: vars.font.size["2xl"] },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
