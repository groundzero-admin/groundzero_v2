import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// ── FAB (collapsed floating button) ──

const fabPulse = keyframes({
  "0%": { boxShadow: "0 0 0 0 rgba(102,126,234,0.5)" },
  "70%": { boxShadow: "0 0 0 12px rgba(102,126,234,0)" },
  "100%": { boxShadow: "0 0 0 0 rgba(102,126,234,0)" },
});

export const fab = style({
  position: "fixed",
  bottom: "24px",
  right: "24px",
  width: "48px",
  height: "48px",
  borderRadius: vars.radius.full,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  cursor: "pointer",
  zIndex: vars.zIndex.modal,
  boxShadow: vars.shadow.lg,
  border: "none",
  transition: `transform ${vars.transition.base}`,
  animation: `${fabPulse} 2s ease-out 3`,
  ":hover": {
    transform: "scale(1.08)",
  },
});

export const fabNoPulse = style({
  position: "fixed",
  bottom: "24px",
  right: "24px",
  width: "48px",
  height: "48px",
  borderRadius: vars.radius.full,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  cursor: "pointer",
  zIndex: vars.zIndex.modal,
  boxShadow: vars.shadow.lg,
  border: "none",
  transition: `transform ${vars.transition.base}`,
  ":hover": {
    transform: "scale(1.08)",
  },
});

// ── Popup (expanded chat window) ──

export const popup = style({
  position: "fixed",
  bottom: "24px",
  right: "24px",
  width: "380px",
  maxHeight: "min(520px, 75vh)",
  display: "flex",
  flexDirection: "column",
  borderRadius: vars.radius["2xl"],
  border: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  boxShadow: vars.shadow.xl,
  overflow: "hidden",
  zIndex: vars.zIndex.modal,
});

// ── Header ──

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  flexShrink: 0,
});

export const sparkle = style({
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.full,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  flexShrink: 0,
});

export const headerTitle = style({
  flex: 1,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

export const closeButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  borderRadius: vars.radius.full,
  color: vars.color.text.tertiary,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    color: vars.color.text.primary,
    backgroundColor: vars.color.surface.active,
  },
});

// ── Messages ──

export const messagesArea = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[4],
  flex: 1,
  overflowY: "auto",
  scrollBehavior: "smooth",
});

export const messageRow = style({
  display: "flex",
  gap: vars.space[2],
  alignItems: "flex-start",
});

export const messageRowStudent = style({
  justifyContent: "flex-end",
});

export const avatarSmall = style({
  width: "22px",
  height: "22px",
  borderRadius: vars.radius.full,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  flexShrink: 0,
  marginTop: "2px",
});

export const bubble = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.xl,
  fontSize: vars.font.size.sm,
  lineHeight: vars.font.lineHeight.relaxed,
  maxWidth: "85%",
  wordBreak: "break-word",
});

export const bubbleSpark = style({
  backgroundColor: vars.color.surface.inset,
  color: vars.color.text.primary,
  borderTopLeftRadius: vars.radius.sm,
});

export const bubbleStudent = style({
  backgroundColor: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  borderTopRightRadius: vars.radius.sm,
});

const dotPulse = keyframes({
  "0%, 80%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
  "40%": { opacity: 1, transform: "scale(1)" },
});

export const typingDots = style({
  display: "flex",
  gap: "4px",
  padding: `${vars.space[2]} ${vars.space[3]}`,
});

export const dot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.text.tertiary,
  animation: `${dotPulse} 1.4s infinite ease-in-out both`,
  selectors: {
    [`&:nth-child(1)`]: { animationDelay: "0s" },
    [`&:nth-child(2)`]: { animationDelay: "0.2s" },
    [`&:nth-child(3)`]: { animationDelay: "0.4s" },
  },
});

// ── Input ──

export const inputArea = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderTop: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.inset,
  flexShrink: 0,
});

export const input = style({
  flex: 1,
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  padding: `${vars.space[1]} 0`,
  "::placeholder": {
    color: vars.color.text.tertiary,
  },
});

export const sendButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.full,
  backgroundColor: "transparent",
  color: vars.color.text.tertiary,
  transition: `all ${vars.transition.base}`,
  flexShrink: 0,
  selectors: {
    "&[data-active=true]": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#fff",
      cursor: "pointer",
    },
  },
});

export const completeBanner = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderTop: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.inset,
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontFamily: vars.font.family.display,
  flexShrink: 0,
});

// ── Inline teaser (idle state inside ActivityPanel) ──

export const teaser = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius["2xl"],
  border: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    borderColor: vars.color.border.default,
    boxShadow: vars.shadow.sm,
  },
});

export const teaserText = style({
  flex: 1,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
});

export const teaserLabel = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});
