import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const layout = style({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
});

export const body = style({
  display: "flex",
  flex: 1,
  overflow: "hidden",
});

export const main = style({
  flex: 1,
  overflowY: "auto",
  padding: vars.space[6],
});
