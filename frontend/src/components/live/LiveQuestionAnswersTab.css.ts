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
  background: vars.color.surface.card,
});

/** Horizontal activity tabs (aligned with Feed tab) */
export const activityTabRow = style({
  display: "flex",
  overflowX: "auto",
  flexShrink: 0,
  gap: 0,
  scrollbarWidth: "thin",
});

export const activityTabBtn = style({
  flexShrink: 0,
  cursor: "pointer",
  outline: "none",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  gap: 5,
  background: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
});

export const activityTabBtnSelected = style({
  background: "rgba(34, 197, 94, 0.16)",
  borderBottom: "2px solid #22c55e",
});

export const activityTabBtnSelectedLive = style({
  background: "rgba(34, 197, 94, 0.26)",
  borderBottom: "2px solid #16a34a",
});

export const activityTabLabel = style({
  fontSize: "11px",
  fontWeight: vars.font.weight.semibold,
  whiteSpace: "nowrap",
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const activityTabLabelSelected = style({
  color: "#14532d",
  fontWeight: vars.font.weight.bold,
});

export const activityTabLabelMuted = style({
  color: "#94a3b8",
});

export const activityTabLabelDefault = style({
  color: "#475569",
});

/** Single scroll column: question + student answers flow naturally */
export const mainColumn = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[3],
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
});

export const navRow = style({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[2],
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: `${vars.space[1]} 0`,
  background: vars.color.surface.card,
});

export const navBtn = style({
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "3px 7px",
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.subtle}`,
  fontSize: "10px",
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
  fontSize: "10px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
});

/** Question preview — natural height; outer column scrolls */
export const questionCard = style({
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.xl,
  padding: vars.space[4],
  boxShadow: vars.shadow.sm,
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

/** Question widget wrapper — no inner scroll; grows with content */
export const questionPreviewScroll = style({
  borderRadius: vars.radius.lg,
  background: vars.color.surface.inset,
  border: `1px solid ${vars.color.border.subtle}`,
  padding: vars.space[2],
});

/** Student answers — flows with main column scroll */
export const answersCard = style({
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.sm,
  overflow: "visible",
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
  padding: vars.space[3],
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

/** Per-student accordion; open by default in TSX */
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
