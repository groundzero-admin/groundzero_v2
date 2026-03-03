import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const strip = style({
  display: "flex",
  gap: vars.space[3],
  marginBottom: vars.space[6],
});

export const tab = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    color: vars.color.text.primary,
    boxShadow: vars.shadow.sm,
  },
});

export const tabActive = style({
  backgroundColor: vars.color.interactive.primary,
  borderColor: vars.color.interactive.primary,
  color: "#fff",
  fontWeight: vars.font.weight.semibold,
  boxShadow: vars.shadow.sm,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    borderColor: vars.color.interactive.primaryHover,
    color: "#fff",
  },
});

export const tabLabel = style({
  display: "flex",
  flexDirection: "column",
});

export const tabName = style({
  lineHeight: 1.2,
});

export const tabDuration = style({
  fontSize: "11px",
  opacity: 0.75,
});

export const statusIndicator = style({
  marginLeft: vars.space[1],
  fontSize: "12px",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
});
