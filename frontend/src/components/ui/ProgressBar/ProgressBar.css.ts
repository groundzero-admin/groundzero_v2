import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const wrapper = style({
  width: "100%",
});

export const labelRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: vars.space[1],
});

export const labelText = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.secondary,
});

export const percentText = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const track = recipe({
  base: {
    width: "100%",
    borderRadius: vars.radius.full,
    backgroundColor: vars.color.surface.active,
    overflow: "hidden",
  },
  variants: {
    height: {
      sm: { height: "6px" },
      md: { height: "10px" },
      lg: { height: "16px" },
    },
  },
  defaultVariants: {
    height: "md",
  },
});

export const fill = style({
  height: "100%",
  borderRadius: vars.radius.full,
  transition: `width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
});
