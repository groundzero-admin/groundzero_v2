import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const header = style({
  position: "sticky",
  top: 0,
  zIndex: Number(vars.zIndex.sticky),
  backgroundColor: vars.color.surface.overlay,
  backdropFilter: "blur(12px)",
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const inner = style({
  width: "min(1120px, 100%)",
  margin: "0 auto",
  padding: `0 ${vars.space[5]}`,
  height: "56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  gap: vars.space[2],
  "@media": {
    "screen and (max-width: 900px)": {
      padding: `0 ${vars.space[3]}`,
      height: "52px",
    },
  },
});

export const brand = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const brandName = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: vars.font.size.base,
    },
  },
});

export const right = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  "@media": {
    "screen and (max-width: 600px)": {
      gap: vars.space[2],
    },
  },
});

export const studentName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.medium,
  maxWidth: "180px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  "@media": {
    "screen and (max-width: 900px)": {
      display: "none",
    },
  },
});

export const iconBtn = style({
  padding: vars.space[1],
  borderRadius: vars.radius.lg,
  color: vars.color.text.tertiary,
  transition: `all ${vars.transition.base}`,
  ":hover": {
    color: vars.color.text.secondary,
    backgroundColor: vars.color.surface.hover,
  },
});

export const themeBtn = style([iconBtn]);
