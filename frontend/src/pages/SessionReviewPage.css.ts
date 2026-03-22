import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const shell = style({
  minHeight: "100vh",
  backgroundColor: vars.color.surface.page,
  padding: "24px 5%",
  boxSizing: "border-box",
});

export const loading = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  minHeight: "40vh",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
});

export const spin = style({
  animation: "spin 1s linear infinite",
});

export const errorBox = style({
  maxWidth: "480px",
  margin: "48px auto",
  padding: vars.space[6],
  borderRadius: "16px",
  background: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  textAlign: "center",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
});

export const header = style({
  maxWidth: "1200px",
  margin: "0 auto 24px",
});

export const backBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "16px",
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  ":hover": {
    background: vars.color.surface.hover,
    color: vars.color.text.primary,
  },
});

export const headerMain = style({});

export const cohort = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: vars.color.text.tertiary,
  margin: "0 0 6px",
});

export const title = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  margin: "0 0 6px",
  lineHeight: 1.2,
});

export const desc = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: 1.5,
  margin: "0 0 6px",
  maxWidth: "720px",
});

export const metaRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  marginTop: "12px",
});

export const meta = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const mainGrid = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 440px)",
  gap: vars.space[6],
  alignItems: "start",
  maxWidth: "1200px",
  margin: "0 auto",
  "@media": {
    "screen and (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const leftCol = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[5],
  minWidth: 0,
});

export const rightCol = style({
  minWidth: 0,
  position: "sticky",
  top: vars.space[4],
  alignSelf: "start",
  "@media": {
    "screen and (max-width: 960px)": {
      position: "relative",
      top: "auto",
    },
  },
});

export const playerWrap = style({
  width: "100%",
  borderRadius: "16px",
  overflow: "hidden",
  background: "#0f172a",
  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.25)",
});

export const video = style({
  display: "block",
  width: "100%",
  maxHeight: "min(72vh, 560px)",
  background: "#000",
});

export const noVideo = style({
  padding: vars.space[10],
  textAlign: "center",
  background: vars.color.surface.inset,
});

export const noVideoTitle = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  margin: "0 0 8px",
});

export const noVideoHint = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  margin: 0,
  lineHeight: 1.5,
});

export const activitySection = style({});

export const activitySectionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
  margin: "0 0 12px",
});

export const activityLoading = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
});

export const activityError = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  margin: 0,
});

export const activityEmpty = style({
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
  margin: 0,
});

export const activityList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.space[2],
  "@media": {
    "screen and (max-width: 520px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const activityCard = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.card,
  transition: "border-color 0.15s, box-shadow 0.15s",
  minWidth: 0,
});

export const activityCardSelected = style({
  borderColor: vars.color.border.default,
  boxShadow: vars.shadow.sm,
});

export const activityCardTop = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[2],
  marginBottom: vars.space[1],
});

export const activityOrder = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "22px",
  height: "22px",
  borderRadius: vars.radius.md,
  background: vars.color.surface.inset,
  fontSize: "0.65rem",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
  flexShrink: 0,
});

export const activityQCount = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "0.65rem",
  color: vars.color.text.tertiary,
  minWidth: 0,
  whiteSpace: "nowrap",
});

export const activityName = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  fontSize: vars.font.size.xs,
  lineHeight: 1.35,
  marginBottom: "2px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

export const activityDesc = style({
  fontSize: "0.65rem",
  color: vars.color.text.secondary,
  lineHeight: 1.4,
  marginBottom: vars.space[2],
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

export const activityActions = style({
  display: "flex",
  gap: vars.space[2],
});

export const startBtn = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  width: "100%",
  padding: "6px 10px",
  borderRadius: vars.radius.md,
  border: "none",
  cursor: "pointer",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  background: vars.color.interactive.primary,
  color: vars.color.text.inverse,
  ":hover": {
    background: vars.color.interactive.primaryHover,
  },
});

export const rightPlaceholder = style({
  padding: vars.space[8],
  borderRadius: vars.radius.xl,
  border: `1px dashed ${vars.color.border.subtle}`,
  background: vars.color.surface.card,
  textAlign: "center",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: 1.5,
});

export const rightPlaceholderIcon = style({
  marginBottom: vars.space[3],
  opacity: 0.5,
  color: vars.color.text.tertiary,
});

export const rightPlaceholderTitle = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  margin: "0 0 8px",
  fontSize: vars.font.size.base,
});

export const rightPlaceholderHint = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});
