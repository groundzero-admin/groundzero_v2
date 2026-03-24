import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const surface = style({
  padding: vars.space[6],
  borderRadius: "22px",
  background: "rgba(255, 255, 255, 0.38)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.5)",
  borderTopWidth: "3px",
  borderTopColor: "#6366f1",
  boxShadow:
    "0 8px 36px rgba(99, 102, 241, 0.07), 0 2px 12px rgba(15, 23, 42, 0.035)",
  "@media": {
    "screen and (max-width: 900px)": {
      padding: vars.space[4],
      borderRadius: "18px",
    },
  },
});

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
});

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const inputRow = style({
  display: "flex",
  gap: vars.space[2],
  alignItems: "flex-end",
  "@media": {
    "screen and (max-width: 600px)": {
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
});

export const input = style({
  flex: 1,
  minHeight: "88px",
  resize: "vertical",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.default}`,
  backgroundColor: "#f1f5f9",
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  outline: "none",
  transition: `border-color ${vars.transition.base}`,
  "::placeholder": {
    color: vars.color.text.tertiary,
  },
  ":focus": {
    borderColor: vars.color.pillar.creativity,
  },
});

export const sendBtn = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.pillar.creativity,
  color: vars.color.text.inverse,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    opacity: 0.85,
    transform: "scale(1.05)",
  },
  ":active": {
    transform: "scale(0.95)",
  },
  "@media": {
    "screen and (max-width: 600px)": {
      width: "100%",
      borderRadius: vars.radius.xl,
      height: "42px",
    },
  },
});
