import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const strip = style({
  display: "flex",
  gap: vars.space[3],
  justifyContent: "center",
  flexWrap: "wrap",
  marginBottom: vars.space[6],
});

export const chip = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.full,
  border: `2px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    transform: "translateY(-1px)",
    boxShadow: vars.shadow.sm,
  },
});

export const chipActive = style({
  borderColor: "var(--chip-accent, #805AD5)",
  backgroundColor: "var(--chip-bg, rgba(128,90,213,0.08))",
  color: "var(--chip-accent, #805AD5)",
  boxShadow: "0 0 12px var(--chip-glow, rgba(128,90,213,0.2))",
});

export const chipIcon = style({
  fontSize: vars.font.size.lg,
  lineHeight: "1",
});
