import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  display: "flex",
  flexDirection: "column",
});

export const topBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space[3]} ${vars.space[5]}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  backdropFilter: "blur(8px)",
  position: "sticky",
  top: 0,
  zIndex: 10,
});

export const topBarLeft = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
});

export const backBtn = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  cursor: "pointer",
  transition: `color ${vars.transition.fast}`,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  ":hover": {
    color: vars.color.text.primary,
  },
});

export const projectTitle = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const stepCounter = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
});

export const xpBadge = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: "#D69E2E",
  backgroundColor: "rgba(214,158,46,0.1)",
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  border: "1px solid rgba(214,158,46,0.2)",
});

export const main = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: `${vars.space[6]} ${vars.space[4]}`,
  gap: vars.space[4],
  maxWidth: 720,
  margin: "0 auto",
  width: "100%",
});

export const characterArea = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const storyArea = style({
  width: "100%",
});

export const storyText = style({
  fontSize: vars.font.size.base,
  lineHeight: vars.font.lineHeight.relaxed,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.display,
  textAlign: "center",
  maxWidth: 540,
  padding: `${vars.space[4]} ${vars.space[5]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  position: "relative",
  margin: "0 auto",
});

export const speechTail = style({
  position: "absolute",
  top: -7,
  left: "50%",
  marginLeft: -7,
  width: 14,
  height: 14,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderBottom: "none",
  borderRight: "none",
  transform: "rotate(45deg)",
});

export const challengeArea = style({
  width: "100%",
});

export const contentCard = style({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[4],
  backgroundColor: "rgba(255,255,255,0.95)",
  borderRadius: vars.radius["2xl"],
  padding: `${vars.space[5]} ${vars.space[4]}`,
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  "@media": {
    "(prefers-color-scheme: dark)": {
      backgroundColor: "rgba(30,30,40,0.95)",
    },
  },
});

export const nextBtn = style({
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

const pulseDot = keyframes({
  "0%, 100%": { transform: "scale(1)" },
  "50%": { transform: "scale(1.4)" },
});

export const progressDots = style({
  display: "flex",
  gap: 8,
  justifyContent: "center",
  paddingTop: vars.space[5],
  paddingBottom: vars.space[4],
});

export const dot = style({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: vars.color.border.default,
  transition: `all ${vars.transition.base}`,
});

export const dotDone = style({
  backgroundColor: "#38A169",
  boxShadow: "0 0 4px rgba(56,161,105,0.4)",
});

export const dotCurrent = style({
  backgroundColor: vars.color.interactive.primary,
  animation: `${pulseDot} 1.5s ease-in-out infinite`,
  boxShadow: `0 0 6px ${vars.color.interactive.primary}`,
});

export const xpToast = style({
  position: "fixed",
  top: vars.space[4],
  right: vars.space[4],
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: "#D69E2E",
  color: "white",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.base,
  zIndex: vars.zIndex.toast,
  boxShadow: "0 4px 20px rgba(214,158,46,0.4)",
});

export const completionScreen = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
  textAlign: "center",
  padding: vars.space[8],
});

export const completionTitle = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
});

export const completionXP = style({
  fontSize: vars.font.size["4xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: "#D69E2E",
  textShadow: "0 2px 8px rgba(214,158,46,0.3)",
});

export const completionSubtext = style({
  fontSize: vars.font.size.base,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.display,
});
