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
    "screen and (max-width: 640px)": {
      minHeight: "100dvh",
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
  "@media": {
    "screen and (max-width: 1024px)": {
      minHeight: "58dvh",
    },
    "screen and (max-width: 640px)": {
      minHeight: "52dvh",
    },
  },
});

export const rightCol = style({
  display: "flex",
  flexDirection: "column",
  width: "560px",
  flexShrink: 0,
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
      width: "100%",
      flexShrink: 1,
      minHeight: "42dvh",
    },
    "screen and (max-width: 640px)": {
      minHeight: "48dvh",
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
