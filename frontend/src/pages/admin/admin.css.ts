import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

/* ── Shared admin page styles ── */

export const page = style({
    maxWidth: 1000,
    margin: "0 auto",
});

export const header = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vars.space[6],
});

export const title = style({
    fontSize: vars.font.size["2xl"],
    fontWeight: vars.font.weight.bold,
    color: vars.color.text.primary,
});

export const subtitle = style({
    fontSize: vars.font.size.sm,
    color: vars.color.text.secondary,
    marginTop: vars.space[1],
});

export const addBtn = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[2],
    padding: `${vars.space[2]} ${vars.space[4]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.inverse,
    backgroundColor: vars.color.feedback.success,
    borderRadius: vars.radius.lg,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        opacity: 0.9,
        transform: "translateY(-1px)",
    },
});

export const dangerBtn = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[1],
    padding: `${vars.space[1]} ${vars.space[3]}`,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.medium,
    color: vars.color.feedback.danger,
    backgroundColor: vars.color.feedback.dangerSurface,
    borderRadius: vars.radius.md,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        opacity: 0.8,
    },
});

export const editBtn = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[1],
    padding: `${vars.space[1]} ${vars.space[3]}`,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.medium,
    color: vars.color.text.link,
    backgroundColor: vars.color.feedback.infoSurface,
    borderRadius: vars.radius.md,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        opacity: 0.8,
    },
});

/* ── Card grid ── */

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: vars.space[4],
});

export const card = style({
    backgroundColor: vars.color.surface.card,
    borderRadius: vars.radius.xl,
    padding: vars.space[5],
    border: `1px solid ${vars.color.border.subtle}`,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.md,
        transform: "translateY(-2px)",
    },
});

export const cardTitle = style({
    fontSize: vars.font.size.lg,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
    marginBottom: vars.space[2],
});

export const cardMeta = style({
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    display: "flex",
    gap: vars.space[3],
    marginBottom: vars.space[2],
});

export const cardDesc = style({
    fontSize: vars.font.size.sm,
    color: vars.color.text.secondary,
    lineHeight: vars.font.lineHeight.relaxed,
});

export const badge = style({
    display: "inline-flex",
    alignItems: "center",
    padding: `${vars.space[1]} ${vars.space[2]}`,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.feedback.infoSurface,
    color: vars.color.feedback.info,
});

export const badgeSuccess = style({
    backgroundColor: vars.color.feedback.successSurface,
    color: vars.color.feedback.success,
});

export const badgeWarning = style({
    backgroundColor: vars.color.feedback.warningSurface,
    color: vars.color.feedback.warning,
});

export const cardActions = style({
    display: "flex",
    gap: vars.space[2],
    marginTop: vars.space[3],
    paddingTop: vars.space[3],
    borderTop: `1px solid ${vars.color.border.subtle}`,
});

/* ── Modal / Dialog ── */

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
});

export const overlay = style({
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: `${fadeIn} 0.15s ease`,
});

export const modal = style({
    backgroundColor: vars.color.surface.card,
    borderRadius: vars.radius.xl,
    padding: vars.space[6],
    width: "90%",
    maxWidth: 480,
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: vars.shadow.xl,
});

export const modalTitle = style({
    fontSize: vars.font.size.lg,
    fontWeight: vars.font.weight.bold,
    color: vars.color.text.primary,
    marginBottom: vars.space[4],
});

export const form = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space[4],
});

export const label = style({
    display: "block",
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    color: vars.color.text.secondary,
    marginBottom: vars.space[1],
});

export const input = style({
    width: "100%",
    padding: `${vars.space[2]} ${vars.space[3]}`,
    fontSize: vars.font.size.sm,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.default}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.primary,
    outline: "none",
    transition: `border-color ${vars.transition.base}`,
    ":focus": {
        borderColor: vars.color.feedback.success,
    },
});

export const textarea = style({
    width: "100%",
    padding: `${vars.space[2]} ${vars.space[3]}`,
    fontSize: vars.font.size.sm,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.default}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.primary,
    outline: "none",
    resize: "vertical",
    minHeight: 80,
    fontFamily: "inherit",
    transition: `border-color ${vars.transition.base}`,
    ":focus": {
        borderColor: vars.color.feedback.success,
    },
});

export const select = style({
    width: "100%",
    padding: `${vars.space[2]} ${vars.space[3]}`,
    fontSize: vars.font.size.sm,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.default}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.primary,
    outline: "none",
    cursor: "pointer",
});

export const formActions = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space[2],
    marginTop: vars.space[2],
});

export const cancelBtn = style({
    padding: `${vars.space[2]} ${vars.space[4]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    borderRadius: vars.radius.lg,
    backgroundColor: vars.color.surface.hover,
    color: vars.color.text.secondary,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
});

export const submitBtn = style({
    padding: `${vars.space[2]} ${vars.space[4]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    borderRadius: vars.radius.lg,
    backgroundColor: vars.color.feedback.success,
    color: vars.color.text.inverse,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        opacity: 0.9,
    },
});

/* ── Session list ── */

export const sessionList = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space[3],
});

export const sessionCard = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[4],
    padding: vars.space[4],
    backgroundColor: vars.color.surface.card,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
    },
});

export const sessionOrder = style({
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: vars.radius.full,
    backgroundColor: vars.color.feedback.successSurface,
    color: vars.color.feedback.success,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.bold,
    flexShrink: 0,
});

export const sessionInfo = style({
    flex: 1,
    minWidth: 0,
});

export const sessionTitle = style({
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
});

export const sessionMeta = style({
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    marginTop: vars.space[1],
});

export const sessionActions = style({
    display: "flex",
    gap: vars.space[2],
    flexShrink: 0,
});

export const emptyState = style({
    textAlign: "center",
    padding: `${vars.space[8]} ${vars.space[4]}`,
    color: vars.color.text.tertiary,
    fontSize: vars.font.size.sm,
});

export const backLink = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space[1],
    fontSize: vars.font.size.sm,
    color: vars.color.text.tertiary,
    marginBottom: vars.space[4],
    cursor: "pointer",
    ":hover": {
        color: vars.color.text.primary,
    },
});

export const importBtn = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[2],
    padding: `${vars.space[2]} ${vars.space[4]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.feedback.info,
    backgroundColor: vars.color.feedback.infoSurface,
    borderRadius: vars.radius.lg,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        opacity: 0.8,
    },
});

export const templatePickerCard = style({
    padding: vars.space[4],
    backgroundColor: vars.color.surface.inset,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.feedback.success,
        backgroundColor: vars.color.feedback.successSurface,
    },
});

/* ── Sessions grid (cohort detail) ── */

export const sessionGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: vars.space[3],
});

export const sessionTile = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space[3],
    padding: vars.space[4],
    backgroundColor: vars.color.surface.card,
    borderRadius: vars.radius.xl,
    border: `1px solid ${vars.color.border.subtle}`,
    boxShadow: "0 0 0 rgba(0,0,0,0)",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.md,
        transform: "translateY(-1px)",
    },
});

export const sessionTileTop = style({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: vars.space[3],
});

export const sessionTileTitle = style({
    fontSize: vars.font.size.base,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
    lineHeight: vars.font.lineHeight.tight,
});

export const sessionTileMeta = style({
    display: "flex",
    flexWrap: "wrap",
    gap: vars.space[2],
    alignItems: "center",
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
});

export const metaPill = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space[1],
    padding: `3px ${vars.space[2]}`,
    borderRadius: vars.radius.full,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.secondary,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.medium,
});

export const sessionTileDesc = style({
    fontSize: vars.font.size.sm,
    color: vars.color.text.secondary,
    lineHeight: vars.font.lineHeight.relaxed,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
});

export const sessionTileFooter = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space[3],
    marginTop: vars.space[2],
    paddingTop: vars.space[3],
    borderTop: `1px solid ${vars.color.border.subtle}`,
});

export const sessionTileActions = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[2],
});

export const iconBtn = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.secondary,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
        color: vars.color.text.primary,
    },
    ":disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
    },
});

export const tinyBtn = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space[1],
    padding: `6px ${vars.space[3]}`,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.secondary,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
        color: vars.color.text.primary,
    },
    ":disabled": {
        opacity: 0.6,
        cursor: "not-allowed",
    },
});

/* ── Activity Manage Questions modal: linked question cards + add list ── */

export const questionsCardGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: vars.space[3],
});

export const questionMiniCard = style({
    padding: vars.space[3],
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.inset,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    ":hover": {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.sm,
    },
});

export const questionMiniCardHeader = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vars.space[2],
});

export const questionMiniCardOrder = style({
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.tertiary,
});

export const questionMiniCardTitle = style({
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
    lineHeight: vars.font.lineHeight.tight,
});

export const questionMiniCardStem = style({
    fontSize: vars.font.size.xs,
    color: "#059669",
    lineHeight: vars.font.lineHeight.tight,
    marginTop: vars.space[1],
    WebkitLineClamp: 2,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
});

export const questionMiniCardMeta = style({
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    marginTop: vars.space[1],
});

export const addQuestionList = style({
    maxHeight: 260,
    overflowY: "auto",
    borderRadius: vars.radius.md,
    border: `1px solid ${vars.color.border.subtle}`,
    padding: vars.space[2],
});

export const addQuestionRow = style({
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space[3],
    padding: `${vars.space[2]} ${vars.space[2]}`,
    borderBottom: `1px solid ${vars.color.border.subtle}`,
    cursor: "pointer",
    ":last-child": { borderBottom: "none" },
    ":hover": { backgroundColor: "var(--color-surface-2, #f8f9fa)" },
});

/* ── Template page: template cards + template detail modal ── */

export const templateCardIcon = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: vars.radius.lg,
    backgroundColor: vars.color.surface.inset,
    color: vars.color.text.secondary,
    flexShrink: 0,
});

export const templateActivityGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: vars.space[3],
});

export const templateActivityCard = style({
    padding: vars.space[3],
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.inset,
});

export const templateActivityCardHeader = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vars.space[2],
});

export const templateActivityCardOrder = style({
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.tertiary,
});

export const templateActivityCardTitle = style({
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
    lineHeight: vars.font.lineHeight.tight,
});

export const templateActivityCardMeta = style({
    fontSize: vars.font.size.xs,
    color: vars.color.text.tertiary,
    display: "flex",
    flexWrap: "wrap",
    gap: vars.space[2],
    marginTop: vars.space[1],
});

export const templateActivityCardDesc = style({
    fontSize: vars.font.size.xs,
    color: vars.color.text.secondary,
    marginTop: vars.space[2],
    lineHeight: vars.font.lineHeight.tight,
    WebkitLineClamp: 2,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
});
