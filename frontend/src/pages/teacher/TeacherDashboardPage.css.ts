import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  maxWidth: "900px",
});

export const sessionCard = style({
  padding: vars.space[6],
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  marginBottom: vars.space[6],
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
  fontSize: vars.font.size.xl,
  color: vars.color.text.primary,
});

export const sessionMeta = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const liveIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: "#38A169",
});

export const liveDot = style({
  width: "8px",
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: "#38A169",
});

export const sessionBtn = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
});

export const startBtn = style([
  sessionBtn,
  {
    backgroundColor: vars.color.interactive.primary,
    color: "#fff",
    ":hover": {
      backgroundColor: vars.color.interactive.primaryHover,
    },
  },
]);

export const endBtn = style([
  sessionBtn,
  {
    backgroundColor: vars.color.feedback.danger,
    color: "#fff",
    ":hover": {
      opacity: "0.9",
    },
  },
]);

export const sectionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  marginBottom: vars.space[4],
});

export const activityGrid = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const emptyState = style({
  padding: `${vars.space[8]} 0`,
  textAlign: "center",
  color: vars.color.text.tertiary,
});

export const noCohort = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "60vh",
  color: vars.color.text.tertiary,
  gap: vars.space[2],
});

export const noCohortTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.xl,
  color: vars.color.text.secondary,
});
