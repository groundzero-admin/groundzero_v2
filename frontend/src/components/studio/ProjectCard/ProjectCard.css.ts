import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const card = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[5]} ${vars.space[4]}`,
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  cursor: "pointer",
  transition: `all ${vars.transition.slow}`,
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  boxShadow: vars.shadow.sm,
  ":hover": {
    transform: "translateY(-6px)",
    boxShadow: vars.shadow.xl,
    borderColor: vars.color.border.default,
  },
});

export const cardLocked = style({
  opacity: 0.5,
  cursor: "default",
  filter: "grayscale(0.4)",
  boxShadow: "none",
  ":hover": {
    transform: "none",
    boxShadow: "none",
    borderColor: vars.color.border.subtle,
  },
});

export const colorBar = style({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 4,
  borderRadius: `${vars.radius["2xl"]} ${vars.radius["2xl"]} 0 0`,
});

export const icon = style({
  fontSize: "2.8rem",
  lineHeight: "1",
  marginTop: vars.space[1],
});

export const name = style({
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  marginTop: vars.space[1],
});

export const tagline = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const chapter = style({
  fontSize: "10px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "1px",
  backgroundColor: vars.color.surface.inset,
  padding: `2px ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  fontFamily: vars.font.family.display,
});

export const stepDots = style({
  display: "flex",
  gap: 5,
  marginTop: vars.space[2],
});

export const dot = style({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: vars.color.border.default,
  transition: `background-color ${vars.transition.fast}`,
});

export const dotDone = style({
  backgroundColor: "#38A169",
});

export const lockBadge = style({
  position: "absolute",
  top: vars.space[2],
  right: vars.space[2],
  fontSize: "10px",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  backgroundColor: vars.color.surface.inset,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  border: `1px solid ${vars.color.border.subtle}`,
});
