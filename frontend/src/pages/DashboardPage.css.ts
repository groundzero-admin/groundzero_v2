import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[6],
});

export const columns = style({
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: vars.space[6],
  alignItems: "start",
  "@media": {
    "screen and (max-width: 900px)": {
      gridTemplateColumns: "1fr",
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
