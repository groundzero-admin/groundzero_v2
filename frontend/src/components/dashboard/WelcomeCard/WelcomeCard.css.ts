import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[6],
  flexWrap: "wrap",
});

export const avatarArea = style({
  position: "relative",
  flexShrink: 0,
});

export const levelBadge = style({
  position: "absolute",
  bottom: "-4px",
  right: "-4px",
  backgroundColor: vars.color.accent.gold,
  color: vars.color.text.inverse,
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  borderRadius: vars.radius.full,
  padding: "2px 8px",
  lineHeight: 1.4,
  boxShadow: vars.shadow.sm,
});

export const info = style({
  flex: 1,
  minWidth: "200px",
});

export const greeting = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const name = style({
  color: vars.color.pillar.creativity,
});

export const message = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  marginTop: vars.space[1],
});

export const stats = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[4],
  marginTop: vars.space[3],
});

export const xpSection = style({
  flex: 1,
  maxWidth: "240px",
});

export const xpLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.display,
  color: vars.color.accent.gold,
  marginBottom: vars.space[1],
});

export const streakBox = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  backgroundColor: `${vars.color.accent.orange}15`,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.accent.orange,
});

/* ── Pillar score area (right side) ── */
export const scoreArea = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  marginLeft: "auto",
  flexShrink: 0,
  width: "240px",
});

export const pillarRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
});

export const pillarLabel = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  width: "100px",
  flexShrink: 0,
  textAlign: "right",
});

export const pillarBarTrack = style({
  flex: 1,
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surface.inset,
  overflow: "hidden",
});

export const pillarBarFill = style({
  height: "100%",
  borderRadius: vars.radius.full,
  transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
});

export const pillarPct = style({
  fontSize: vars.font.size.xs,
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  width: "32px",
  flexShrink: 0,
  textAlign: "right",
});
