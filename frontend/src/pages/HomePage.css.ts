import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const float = keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-6px)" },
});

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: `${vars.space[10]} ${vars.space[6]}`,
  gap: vars.space[8],
  position: "relative",
  overflow: "hidden",
  flex: 1,
});

export const greeting = style({
  textAlign: "center",
  zIndex: 1,
});

export const greetingTitle = style({
  fontSize: vars.font.size["3xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  marginBottom: vars.space[2],
  letterSpacing: "-0.02em",
});

export const greetingSubtitle = style({
  fontSize: vars.font.size.base,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.display,
});

export const modeCards = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: vars.space[5],
  maxWidth: 860,
  width: "100%",
  zIndex: 1,
  "@media": {
    "(max-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
      maxWidth: 520,
    },
    "(max-width: 480px)": {
      gridTemplateColumns: "1fr",
      maxWidth: 340,
    },
  },
});

export const modeCard = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[8]} ${vars.space[5]}`,
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  cursor: "pointer",
  transition: `all ${vars.transition.slow}`,
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  boxShadow: vars.shadow.md,
  ":hover": {
    transform: "translateY(-8px)",
    boxShadow: vars.shadow.xl,
    borderColor: vars.color.border.default,
  },
});

export const modeCardDisabled = style({
  opacity: 0.45,
  cursor: "default",
  filter: "grayscale(0.3)",
  boxShadow: "none",
  ":hover": {
    transform: "none",
    boxShadow: "none",
    borderColor: vars.color.border.subtle,
  },
});

export const modeGradient = style({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 5,
  borderRadius: `${vars.radius["2xl"]} ${vars.radius["2xl"]} 0 0`,
});

export const modeIcon = style({
  width: 64,
  height: 64,
  borderRadius: vars.radius.xl,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  animation: `${float} 3s ease-in-out infinite`,
});

export const modeName = style({
  fontSize: vars.font.size.xl,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
});

export const modeDesc = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const comingSoon = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  backgroundColor: vars.color.surface.inset,
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  border: `1px solid ${vars.color.border.subtle}`,
});

export const modeStats = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
});

export const footer = style({
  display: "flex",
  gap: vars.space[5],
  justifyContent: "center",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  opacity: 0.6,
  zIndex: 1,
});
