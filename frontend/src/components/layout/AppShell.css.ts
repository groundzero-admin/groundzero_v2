import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const shell = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
});

export const main = style({
  width: "70%",
  maxWidth: "70%",
  margin: "0 auto",
  padding: `${vars.space[6]} 0`,
  boxSizing: "border-box",
});
