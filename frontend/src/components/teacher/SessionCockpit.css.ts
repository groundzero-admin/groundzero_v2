import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

export const root = style({
  display: "grid",
  gridTemplateColumns: "7fr 3fr",
  gap: vars.space[4],
  height: "calc(100vh - 80px)",
});

export const mainCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
  overflowY: "auto",
  minHeight: 0,
});

export const sessionHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const sessionInfo = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
});

export const sessionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const liveBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radius.full,
  backgroundColor: "rgba(56, 161, 105, 0.15)",
  color: "#38A169",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
});

export const liveDot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: "#38A169",
  animation: `${pulse} 2s ease-in-out infinite`,
});

export const sessionMeta = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const sectionLabel = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
});

export const planScroll = style({
  flex: 1,
  overflowY: "auto",
});

export const pulseCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  overflowY: "auto",
  borderLeft: `1px solid ${vars.color.border.subtle}`,
  paddingLeft: vars.space[4],
});

export const pulseTitle = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export const pulseFeed = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  flex: 1,
  overflowY: "auto",
});

export const pulseEvent = style({
  display: "flex",
  gap: vars.space[2],
  alignItems: "flex-start",
  padding: `${vars.space[2]} ${vars.space[2]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.xs,
  lineHeight: vars.font.lineHeight.normal,
  backgroundColor: vars.color.surface.page,
  border: `1px solid ${vars.color.border.subtle}`,
});

export const pulseIcon = style({
  flexShrink: 0,
  marginTop: "1px",
});

export const pulseBody = style({
  flex: 1,
  minWidth: 0,
});

export const pulseName = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});

export const pulseDetail = style({
  color: vars.color.text.secondary,
});

export const pulseTime = style({
  flexShrink: 0,
  fontSize: "10px",
  color: vars.color.text.tertiary,
  whiteSpace: "nowrap",
});

export const scoreBoard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  paddingBottom: vars.space[3],
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  marginBottom: vars.space[1],
});

export const scoreRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.xs,
});

export const scoreName = style({
  width: "60px",
  flexShrink: 0,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const scoreBarWrap = style({
  flex: 1,
  height: "6px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surface.inset,
  overflow: "hidden",
});

export const scoreBar = style({
  height: "100%",
  borderRadius: vars.radius.full,
  transition: "width 0.3s ease",
});

export const scoreLabel = style({
  flexShrink: 0,
  width: "30px",
  textAlign: "right",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
  fontSize: "11px",
});

export const pulseEmpty = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontStyle: "italic",
});

export const endBtn = style({
  width: "100%",
  padding: `${vars.space[3]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.feedback.danger,
  color: "#fff",
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    opacity: "0.9",
  },
});
