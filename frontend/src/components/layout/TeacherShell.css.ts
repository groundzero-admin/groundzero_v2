import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const layout = style({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor: vars.color.surface.page,
});

export const body = style({
  display: "flex",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
});

export const main = style({
  flex: 1,
  overflowY: "auto",
  padding: vars.space[6],
  minHeight: 0,
});
