import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

export const root = style({
  position: "relative",
  borderRadius: vars.radius["2xl"],
  overflow: "hidden",
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  minHeight: "420px",
  display: "flex",
  flexDirection: "column",
});

export const main = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space[8],
  gap: vars.space[4],
});

export const facilitatorAvatar = style({
  width: "96px",
  height: "96px",
  borderRadius: vars.radius.full,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "36px",
  color: "#fff",
  fontWeight: "700",
  fontFamily: vars.font.family.display,
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
});

export const facilitatorName = style({
  color: "#fff",
  fontSize: vars.font.size.xl,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
});

export const liveBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  backgroundColor: "rgba(229, 62, 62, 0.9)",
  color: "#fff",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  fontFamily: vars.font.family.display,
  letterSpacing: "0.5px",
});

export const liveDot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: "#fff",
  animation: `${pulse} 2s ease-in-out infinite`,
});

export const controls = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[6]}`,
  background: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(8px)",
});

export const controlBtn = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.15)",
  ":hover": {
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: "scale(1.08)",
  },
});

export const controlBtnActive = style({
  backgroundColor: "rgba(229, 62, 62, 0.8)",
  ":hover": {
    backgroundColor: "rgba(229, 62, 62, 0.9)",
  },
});

export const thumbnails = style({
  display: "flex",
  gap: vars.space[2],
  padding: `0 ${vars.space[6]} ${vars.space[3]}`,
  background: "rgba(0,0,0,0.15)",
});

export const thumbnail = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.lg,
  border: "2px solid rgba(255,255,255,0.3)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: "#fff",
  background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
});

export const bottomArea = style({
  padding: `${vars.space[3]} ${vars.space[6]} ${vars.space[4]}`,
  background: "rgba(0,0,0,0.25)",
  backdropFilter: "blur(4px)",
});
