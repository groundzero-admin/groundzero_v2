import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  maxWidth: "960px",
  padding: vars.space[6],
});

/* ── Session List (Idle State) ── */

export const sectionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  marginBottom: vars.space[4],
});

export const sessionCard = style({
  padding: vars.space[5],
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  marginBottom: vars.space[3],
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: `all ${vars.transition.base}`,
});

export const sessionCardNext = style({
  border: "2px solid #22c55e",
  boxShadow: "0 0 0 3px rgba(34,197,94,0.15)",
});

export const sessionCardCompleted = style({
  opacity: 0.5,
});

export const sessionInfo = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
  flex: 1,
});

export const sessionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
});

export const sessionMeta = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  flexWrap: "wrap",
});

export const statusBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 10px",
  borderRadius: vars.radius.full,
  fontSize: "11px",
  fontWeight: "700",
});

/* ── Buttons ── */

export const startBtn = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  backgroundColor: "#22c55e",
  color: "#fff",
  ":hover": { backgroundColor: "#16a34a" },
});

export const endBtn = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  backgroundColor: vars.color.feedback.danger,
  color: "#fff",
  ":hover": { opacity: "0.9" },
});

export const goLiveBtn = style({
  padding: `${vars.space[2]} ${vars.space[5]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  backgroundColor: "#6366f1",
  color: "#fff",
  ":hover": { backgroundColor: "#4f46e5" },
});

/* ── Activity Type Cards ── */

export const typeCardsRow = style({
  display: "flex",
  gap: vars.space[3],
  marginBottom: vars.space[5],
  flexWrap: "wrap",
});

export const typeCard = style({
  flex: 1,
  minWidth: "120px",
  padding: `${vars.space[4]} ${vars.space[3]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `2px solid transparent`,
  boxShadow: vars.shadow.sm,
  cursor: "pointer",
  textAlign: "center",
  transition: `all ${vars.transition.base}`,
  ":hover": { transform: "translateY(-2px)", boxShadow: vars.shadow.md },
});

export const typeCardActive = style({
  border: `2px solid ${vars.color.interactive.primary}`,
  boxShadow: `0 0 0 3px rgba(99,102,241,0.15)`,
});

export const typeCardIcon = style({
  fontSize: "24px",
  marginBottom: vars.space[1],
});

export const typeCardLabel = style({
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  textTransform: "capitalize",
});

export const typeCardCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  marginTop: "2px",
});

/* ── Activity List ── */

export const activityList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  marginBottom: vars.space[5],
});

export const activityCard = style({
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: `all ${vars.transition.base}`,
});

const pulseKf = keyframes({
  "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
  "50%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
});

export const activityCardActive = style({
  border: "2px solid #22c55e",
  animation: `${pulseKf} 2s ease-in-out infinite`,
});

export const activityCardDone = style({
  opacity: 0.5,
});

export const launchBtn = style({
  padding: "6px 16px",
  borderRadius: vars.radius.lg,
  fontSize: "12px",
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  backgroundColor: "#6366f1",
  color: "#fff",
  ":hover": { backgroundColor: "#4f46e5" },
});

/* ── Control Bar ── */

export const controlBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  padding: `${vars.space[4]} ${vars.space[5]}`,
  borderRadius: vars.radius["2xl"],
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  marginTop: vars.space[4],
  position: "sticky",
  bottom: vars.space[4],
});

/* ── Empty / Loading ── */

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

const livePulseKf = keyframes({
  "0%, 100%": { opacity: "1" },
  "50%": { opacity: "0.4" },
});

export const liveDot = style({
  width: "8px",
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: "#22c55e",
  animation: `${livePulseKf} 1.5s ease-in-out infinite`,
});

/* ── Teacher dashboard session cards (larger, with description + Activity Preview) ── */

export const sessionGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: vars.space[4],
  marginBottom: vars.space[8],
});

export const sessionTileTeacher = style({
  borderRadius: vars.radius["2xl"],
  padding: vars.space[5],
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  minHeight: "200px",
});

export const sessionTileTeacherLive = style({
  border: "2px solid #22c55e",
  boxShadow: "0 0 0 3px rgba(34,197,94,0.12)",
});

export const sessionTileTeacherEnded = style({
  border: "2px solid #f59e0b",
  boxShadow: "0 0 0 3px rgba(245,158,11,0.12)",
});

export const sessionTileTeacherDone = style({
  opacity: 0.7,
  borderColor: vars.color.border.subtle,
});

export const sessionTileTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.base,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

export const sessionTileDesc = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  lineHeight: vars.font.lineHeight.tight,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  flex: 1,
});

export const sessionTileMeta = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space[2],
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const sessionTileActions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space[2],
  marginTop: "auto",
});

export const actionBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  fontFamily: vars.font.family.body,
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.15s, transform 0.1s",
  ":hover": { opacity: 0.9 },
  ":disabled": { opacity: 0.6, cursor: "not-allowed" },
});

export const actionBtnPrimary = style([actionBtn, { backgroundColor: "#22c55e", color: "#fff" }]);
export const actionBtnWarning = style([actionBtn, { backgroundColor: "#f59e0b", color: "#fff" }]);
export const actionBtnDanger = style([actionBtn, { backgroundColor: "#ef4444", color: "#fff" }]);
export const actionBtnSecondary = style([actionBtn, { backgroundColor: "#6366f1", color: "#fff" }]);
export const actionBtnOutline = style([actionBtn, { backgroundColor: "transparent", color: vars.color.text.secondary, border: `1px solid ${vars.color.border.default}` }]);
export const actionBtnPreviewBlue = style([
  actionBtn,
  {
    backgroundColor: "transparent",
    color: "#2563eb",
    border: "1px solid rgba(37,99,235,0.35)",
    ":hover": { backgroundColor: "rgba(37,99,235,0.08)", opacity: 1 },
  },
]);
