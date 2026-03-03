import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space[4],
});

export const container = style({
  width: "100%",
  maxWidth: "400px",
});

export const brandRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  marginBottom: vars.space[2],
});

export const title = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size["3xl"],
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const subtitle = style({
  textAlign: "center",
  color: vars.color.text.tertiary,
  marginBottom: vars.space[8],
});

export const card = style({
  backgroundColor: vars.color.surface.card,
  borderRadius: vars.radius["2xl"],
  boxShadow: vars.shadow.md,
  border: `1px solid ${vars.color.border.subtle}`,
  padding: vars.space[8],
});

export const form = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[5],
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
});

export const label = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.secondary,
});

export const input = style({
  width: "100%",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.default}`,
  backgroundColor: vars.color.surface.page,
  color: vars.color.text.primary,
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.body,
  transition: `border-color ${vars.transition.base}`,
  outline: "none",
  "::placeholder": {
    color: vars.color.text.tertiary,
  },
  ":focus": {
    borderColor: vars.color.interactive.primary,
    boxShadow: `0 0 0 3px ${vars.color.interactive.primary}25`,
  },
});

export const submitBtn = style({
  width: "100%",
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.interactive.primary,
  color: "#fff",
  fontSize: vars.font.size.base,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.display,
  cursor: "pointer",
  border: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
  },
  ":disabled": {
    opacity: "0.6",
    cursor: "not-allowed",
  },
});

export const error = style({
  backgroundColor: `${vars.color.feedback.danger}12`,
  border: `1px solid ${vars.color.feedback.danger}40`,
  borderRadius: vars.radius.md,
  padding: `${vars.space[3]} ${vars.space[4]}`,
  color: vars.color.feedback.danger,
  fontSize: vars.font.size.sm,
});

export const footer = style({
  textAlign: "center",
  marginTop: vars.space[6],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const link = style({
  color: vars.color.text.link,
  fontWeight: vars.font.weight.medium,
  textDecoration: "none",
  ":hover": {
    textDecoration: "underline",
  },
});
