import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const shell = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
});

export const main = style({
  width: "min(1120px, 100%)",
  margin: "0 auto",
  padding: `${vars.space[6]} ${vars.space[5]}`,
  boxSizing: "border-box",
  "@media": {
    "screen and (max-width: 900px)": {
      padding: `${vars.space[4]} ${vars.space[3]}`,
    },
  },
});
