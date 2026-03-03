import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const shell = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
});

export const main = style({
  maxWidth: "1280px",
  margin: "0 auto",
  padding: `${vars.space[6]} ${vars.space[4]}`,
});
