import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  maxWidth: "1400px",
  margin: "0 auto",
  padding: vars.space[6],
  minHeight: "100%",
});

export const header = style({
  marginBottom: vars.space[6],
});

export const headerContent = style({
  marginTop: vars.space[3],
});

export const sessionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size["2xl"],
  color: vars.color.text.primary,
  marginBottom: vars.space[2],
});

export const sessionMeta = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  marginBottom: vars.space[2],
});

export const sessionDesc = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
  maxWidth: "60ch",
});

export const backBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  background: "transparent",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  ":hover": {
    background: vars.color.surface.hover,
    color: vars.color.text.primary,
  },
});

export const layout = style({
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: vars.space[6],
  alignItems: "start",
  "@media": {
    "screen and (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const activityList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  position: "sticky",
  top: vars.space[4],
});

export const sidebarTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  marginBottom: vars.space[2],
});

export const activityCard = style({
  padding: vars.space[4],
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.card,
  cursor: "pointer",
  transition: "border-color 0.15s, box-shadow 0.15s",
  ":hover": {
    borderColor: vars.color.border.default,
    boxShadow: vars.shadow.sm,
  },
});

export const activityCardSelected = style({
  borderColor: vars.color.interactive.primary,
  boxShadow: `0 0 0 2px ${vars.color.interactive.primary}30`,
});

export const activityCardHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  marginBottom: vars.space[2],
});

export const activityOrder = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  minWidth: 20,
});

export const liveIcon = style({ color: "#22c55e" });
export const pauseIcon = style({ color: "#94a3b8" });

export const activityName = style({
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  marginBottom: vars.space[1],
});

export const activityDesc = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  lineHeight: vars.font.lineHeight.tight,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  marginBottom: vars.space[2],
});

export const activityMeta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  marginBottom: vars.space[3],
});

export const activityActions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space[2],
});

export const viewQuestionsBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.subtle}`,
  background: "transparent",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  cursor: "pointer",
  ":hover": { background: vars.color.surface.hover, color: vars.color.text.primary },
});

export const launchBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  border: "none",
  background: "#6366f1",
  color: "#fff",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  ":hover": { opacity: 0.9 },
  ":disabled": { opacity: 0.6, cursor: "not-allowed" },
});

export const launchBtnPause = style([
  launchBtn,
  { background: "#ef4444" },
]);

export const main = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
  minHeight: 400,
});

export const questionsSection = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
});

export const questionsTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
});

export const noQuestions = style({
  padding: `${vars.space[4]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  border: `1px dashed ${vars.color.border.default}`,
  background: vars.color.surface.page,
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
});

export const qNavRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[3]}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.page,
});

export const qNavBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  background: "transparent",
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: "pointer",
  ":hover": { background: vars.color.surface.hover, color: vars.color.text.primary },
  ":disabled": { opacity: 0.6, cursor: "not-allowed" },
});

export const qNavLabel = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
});

export const questionsSidebar = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  maxHeight: 220,
  overflowY: "auto",
});

export const questionItem = style({
  padding: vars.space[3],
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.page,
  textAlign: "left",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  ":hover": {
    borderColor: vars.color.border.default,
    background: vars.color.surface.hover,
  },
});

export const questionItemSelected = style({
  borderColor: vars.color.interactive.primary,
  background: `${vars.color.interactive.primary}10`,
});

export const questionItemTitle = style({
  display: "block",
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  marginBottom: vars.space[1],
});

export const questionItemSnippet = style({
  display: "block",
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  lineHeight: vars.font.lineHeight.tight,
});

export const previewSection = style({
  flex: 1,
  minHeight: 320,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.card,
  overflow: "hidden",
});

export const previewCard = style({
  padding: vars.space[5],
  minHeight: 320,
});

export const previewPlaceholder = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 320,
  color: vars.color.text.tertiary,
  gap: vars.space[2],
});

export const emptyState = style({
  padding: vars.space[8],
  textAlign: "center",
  color: vars.color.text.secondary,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[4],
});

export const loading = style({
  padding: vars.space[8],
  textAlign: "center",
  color: vars.color.text.tertiary,
});
