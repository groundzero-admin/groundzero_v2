import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[6],
  minHeight: "100%",
  width: "100%",
  boxSizing: "border-box",
  background: "transparent",
});

export const columns = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
  gap: vars.space[6],
  alignItems: "start",
  "@media": {
    "screen and (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const mainCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[6],
  minWidth: 0,
});

export const sideCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[6],
  position: "sticky",
  top: vars.space[4],
  "@media": {
    "screen and (max-width: 900px)": {
      position: "relative",
    },
  },
});

export const loading = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: `${vars.space[16]} 0`,
  color: vars.color.text.tertiary,
});
