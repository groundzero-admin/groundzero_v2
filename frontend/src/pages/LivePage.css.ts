import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  display: "grid",
  gridTemplateColumns: "1fr 400px",
  gap: vars.space[5],
  alignItems: "start",
  minHeight: "calc(100vh - 80px)",
  "@media": {
    "screen and (max-width: 1024px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const leftCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const rightCol = style({
  position: "sticky",
  top: vars.space[4],
  maxHeight: "calc(100vh - 96px)",
  overflow: "auto",
  "@media": {
    "screen and (max-width: 1024px)": {
      position: "static",
      maxHeight: "none",
    },
  },
});
