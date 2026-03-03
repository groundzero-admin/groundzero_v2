import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const blink = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0 },
});

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
  padding: vars.space[4],
  textAlign: "center",
});

export const characterWrap = style({
  marginBottom: vars.space[2],
});

export const storyText = style({
  fontSize: vars.font.size.lg,
  lineHeight: vars.font.lineHeight.relaxed,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.display,
  maxWidth: 520,
  fontWeight: vars.font.weight.semibold,
});

export const cursor = style({
  display: "inline-block",
  width: 2,
  height: "1em",
  backgroundColor: vars.color.interactive.primary,
  marginLeft: 2,
  verticalAlign: "text-bottom",
  animation: `${blink} 1s step-end infinite`,
});

export const continueBtn = style({
  padding: `${vars.space[3]} ${vars.space[8]}`,
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  boxShadow: vars.shadow.md,
  border: "none",
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    transform: "scale(1.05)",
    boxShadow: vars.shadow.lg,
  },
});
