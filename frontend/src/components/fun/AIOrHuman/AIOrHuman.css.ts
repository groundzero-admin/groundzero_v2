import { style, keyframes, globalStyle } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
  padding: vars.space[6],
  maxWidth: 760,
  margin: "0 auto",
});

export const header = style({ textAlign: "center" });

export const title = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  color: vars.color.text.primary,
  marginBottom: vars.space[1],
});

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
});

export const promptBox = style({
  padding: `${vars.space[3]} ${vars.space[5]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.inset,
  border: `1px solid ${vars.color.border.subtle}`,
  textAlign: "center",
  width: "100%",
});

export const promptLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: vars.space[1],
});

export const promptText = style({
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  fontStyle: "italic",
});

export const speakers = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space[5],
  width: "100%",
});

export const speakerCard = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[3],
  transition: `all ${vars.transition.slow}`,
});

export const characterArea = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[1],
});

export const speakerLabel = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const revealBadge = style({
  display: "inline-block",
  padding: `2px ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.extrabold,
  textTransform: "uppercase",
  letterSpacing: "1px",
});

export const speechBubble = style({
  position: "relative",
  padding: vars.space[4],
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `2px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  width: "100%",
  minHeight: 100,
  transition: `all ${vars.transition.slow}`,
});

export const speechTail = style({
  position: "absolute",
  top: -8,
  left: "50%",
  marginLeft: -8,
  width: 16,
  height: 16,
  backgroundColor: vars.color.surface.card,
  border: `2px solid ${vars.color.border.subtle}`,
  borderBottom: "none",
  borderRight: "none",
  transform: "rotate(45deg)",
});

export const messageText = style({
  fontSize: vars.font.size.sm,
  lineHeight: vars.font.lineHeight.relaxed,
  color: vars.color.text.primary,
  whiteSpace: "pre-wrap",
  position: "relative",
  zIndex: 1,
});

export const cardAI = style({});

export const cardHuman = style({});

globalStyle(`${cardAI} .${speechBubble}`, {
  borderColor: "#805AD5",
  boxShadow: "0 0 20px rgba(128,90,213,0.15)",
});

globalStyle(`${cardHuman} .${speechBubble}`, {
  borderColor: "#38A169",
  boxShadow: "0 0 20px rgba(56,161,105,0.15)",
});

export const choices = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[3],
  width: "100%",
});

export const choiceLabel = style({
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
});

export const choiceBtns = style({
  display: "flex",
  gap: vars.space[3],
});

const pulse = keyframes({
  "0%, 100%": { boxShadow: "0 0 0 0 rgba(99,179,237,0.4)" },
  "50%": { boxShadow: "0 0 0 8px rgba(99,179,237,0)" },
});

export const choiceBtn = style({
  padding: `${vars.space[3]} ${vars.space[6]}`,
  borderRadius: vars.radius.full,
  border: "2px solid",
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.base,
  animation: `${pulse} 2s ease-in-out infinite`,
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: vars.shadow.md,
  },
});

export const feedbackText = style({
  fontSize: vars.font.size.lg,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  textAlign: "center",
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
  ":hover": {
    backgroundColor: vars.color.interactive.primaryHover,
    transform: "scale(1.05)",
  },
});

export const score = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
});
