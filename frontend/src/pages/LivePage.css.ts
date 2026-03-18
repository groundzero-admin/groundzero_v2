import { style } from "@vanilla-extract/css";

export const page = style({
  display: "flex",
  height: "100dvh",
  overflow: "hidden",
  background: "#f8fafc",
  "@media": {
    "screen and (max-width: 1024px)": {
      display: "block",
      height: "auto",
      overflow: "auto",
    },
  },
});

export const leftCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  flex: 1,
  minWidth: 0,
  background: "#0b0b1a",
});

export const rightCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  borderLeft: "1px solid #e2e8f0",
  background: "#ffffff",
  "@media": {
    "screen and (max-width: 1024px)": {
      height: "auto",
      maxHeight: "none",
      borderLeft: "none",
      borderTop: "1px solid #e2e8f0",
    },
  },
});

export const loading = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100dvh",
  background: "#f8fafc",
});

export const resizer = style({
  width: 8,
  cursor: "col-resize",
  "@media": {
    "screen and (max-width: 1024px)": {
      display: "none",
    },
  },
});

