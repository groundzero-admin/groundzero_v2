import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
});

export const activityBar = style({
  flexShrink: 0,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const activityLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  display: "block",
  marginBottom: vars.space[1],
  letterSpacing: "0.06em",
});

export const select = style({
  width: "100%",
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  background: vars.color.surface.card,
  color: vars.color.text.primary,
});

/** Fills remaining height: question block + answers block */
export const mainColumn = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[3],
  overflow: "hidden",
});

export const navRow = style({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[2],
});

export const navBtn = style({
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
  background: vars.color.surface.card,
  cursor: "pointer",
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
    background: vars.color.surface.inset,
  },
});

export const navLabel = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

/** Question preview card — fixed vertical space; preview scrolls inside if needed */
export const questionCard = style({
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.xl,
  padding: vars.space[4],
  boxShadow: vars.shadow.sm,
  height: "clamp(320px, 46vh, 480px)",
  minHeight: "320px",
});

export const questionMeta = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: "#6366f1",
  marginBottom: vars.space[1],
});

export const questionTitle = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  marginBottom: vars.space[3],
  lineHeight: 1.35,
});

/** Scrolls inside the question card if the widget is taller than the box */
export const questionPreviewScroll = style({
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
  borderRadius: vars.radius.lg,
  background: vars.color.surface.inset,
  border: `1px solid ${vars.color.border.subtle}`,
});

/** Student answers — takes remaining space; fixed flex behavior */
export const answersCard = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.sm,
  overflow: "hidden",
});

export const answersHeader = style({
  flexShrink: 0,
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.tertiary,
  letterSpacing: "0.06em",
});

export const answersScroll = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: vars.space[3],
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

/** Per-student accordion; closed by default */
export const studentDisclosure = style({
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.page,
  overflow: "hidden",
});

export const studentSummary = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  cursor: "pointer",
  listStyle: "none",
  fontSize: vars.font.size.sm,
  userSelect: "none",
  selectors: {
    "&::-webkit-details-marker": { display: "none" },
  },
});

/** Student submitted something — muted bar so teachers know to expand */
export const studentSummaryAnswered = style({
  background: "#e2e8f0",
  color: "#475569",
});

export const studentSummaryNoAnswer = style({
  background: vars.color.surface.inset,
  color: vars.color.text.secondary,
});

export const disclosureChevron = style({
  flexShrink: 0,
  transition: "transform 0.15s ease",
  color: "#64748b",
  selectors: {
    [`${studentDisclosure}[open] &`]: { transform: "rotate(-180deg)" },
  },
});

export const studentDetailBody = style({
  padding: `${vars.space[3]} ${vars.space[3]} ${vars.space[3]}`,
  borderTop: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.surface.card,
});

export const emptyState = style({
  padding: vars.space[4],
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
  textAlign: "center",
});

export const loadingRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: vars.space[4],
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
});

export const spin = style({
  animation: "spin 1s linear infinite",
});
