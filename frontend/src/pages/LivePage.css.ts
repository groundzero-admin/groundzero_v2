import { style } from "@vanilla-extract/css";

export const page = style({
  display: "grid",
  gridTemplateColumns: "1fr 380px",
  height: "100dvh",
  overflow: "hidden",
  background: "#0d0d1a",
  "@media": {
    "screen and (max-width: 1024px)": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "55vh auto",
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
});

export const rightCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  borderLeft: "1px solid rgba(255,255,255,0.06)",
  background: "#12121f",
  "@media": {
    "screen and (max-width: 1024px)": {
      height: "auto",
      maxHeight: "none",
      borderLeft: "none",
      borderTop: "1px solid rgba(255,255,255,0.06)",
    },
  },
});

export const loading = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100dvh",
  background: "#0d0d1a",
});

