import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const toolbar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  flexWrap: "wrap",
});

export const legend = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[4],
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
});

export const legendItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
});

export const legendDot = style({
  width: "10px",
  height: "10px",
  borderRadius: vars.radius.full,
});

export const graphContainer = style({
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  overflow: "auto",
  position: "relative",
  cursor: "grab",
  ":active": {
    cursor: "grabbing",
  },
});

export const tooltip = style({
  position: "fixed",
  pointerEvents: "none",
  zIndex: 1000,
  backgroundColor: vars.color.surface.raised,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  boxShadow: vars.shadow.lg,
  maxWidth: "220px",
});

export const tooltipName = style({
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  marginBottom: "2px",
});

export const tooltipMeta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.normal,
});
