import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const slideIn = keyframes({
  "0%": { transform: "translateX(120%)", opacity: 0 },
  "100%": { transform: "translateX(0)", opacity: 1 },
});

const slideOut = keyframes({
  "0%": { transform: "translateX(0)", opacity: 1 },
  "100%": { transform: "translateX(120%)", opacity: 0 },
});

export const root = style({
  position: "fixed",
  top: vars.space[4],
  right: vars.space[4],
  zIndex: vars.zIndex.toast,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  animation: `${slideIn} 300ms ease-out forwards`,
});

export const rootExiting = style({
  animation: `${slideOut} 300ms ease-in forwards`,
});

export const toast = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  boxShadow: vars.shadow.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  minWidth: "280px",
});

export const iconBox = style({
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const content = style({
  flex: 1,
});

export const title = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const detail = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  marginTop: "2px",
});

export const change = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  flexShrink: 0,
});

export const stageUp = style({
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  boxShadow: vars.shadow.lg,
  minWidth: "280px",
});

export const stageUpText = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  fontSize: vars.font.size.base,
});

export const stageUpSub = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  opacity: 0.9,
});
