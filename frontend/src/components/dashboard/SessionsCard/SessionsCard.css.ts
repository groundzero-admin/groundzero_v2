import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const heading = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

export const liveDot = style({
  width: "8px",
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: "#E53E3E",
  animation: `${pulse} 2s ease-in-out infinite`,
});

export const liveCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[4],
  borderRadius: vars.radius.xl,
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  color: "#fff",
});

export const liveHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const liveBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `2px ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  backgroundColor: "rgba(229, 62, 62, 0.9)",
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "0.5px",
});

export const facilitator = style({
  marginLeft: "auto",
  fontSize: vars.font.size.xs,
  opacity: 0.7,
});

export const activityName = style({
  fontSize: vars.font.size.base,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  lineHeight: vars.font.lineHeight.tight,
});

export const joinBtn = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: "#fff",
  color: "#1a1a2e",
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  cursor: "pointer",
  border: "none",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    transform: "scale(1.02)",
    boxShadow: "0 4px 16px rgba(255,255,255,0.2)",
  },
});

export const emptyState = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[6]} ${vars.space[4]}`,
  textAlign: "center",
  color: vars.color.text.tertiary,
});

export const emptyIcon = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surface.inset,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const emptyText = style({
  fontSize: vars.font.size.sm,
  lineHeight: vars.font.lineHeight.relaxed,
});
