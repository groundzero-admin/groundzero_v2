import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[6],
});

export const sectionTitle = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

export const card = style({
  padding: vars.space[5],
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.sm,
});

// Heatmap
export const heatmapScroll = style({
  overflowX: "auto",
});

export const heatmapTable = style({
  borderCollapse: "collapse",
  fontSize: vars.font.size.sm,
  width: "100%",
  minWidth: "500px",
});

export const heatmapTh = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  textAlign: "left",
  fontSize: vars.font.size.xs,
  whiteSpace: "nowrap",
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const heatmapThComp = style([heatmapTh, {
  textAlign: "center",
  maxWidth: "90px",
  overflow: "hidden",
  textOverflow: "ellipsis",
}]);

export const heatmapTd = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const heatmapName = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  whiteSpace: "nowrap",
});

export const heatmapCell = style({
  textAlign: "center",
  borderRadius: vars.radius.md,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  minWidth: "48px",
  display: "inline-block",
});

export const overallCell = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  textAlign: "center",
});

// Interventions
export const alertList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
});

export const alertRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border.subtle}`,
  backgroundColor: vars.color.surface.card,
});

export const alertIcon = style({
  flexShrink: 0,
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const alertBody = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const alertName = style({
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
});

export const alertDetail = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const alertBadge = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radius.md,
});

export const empty = style({
  padding: vars.space[6],
  textAlign: "center",
  color: vars.color.text.tertiary,
  fontSize: vars.font.size.sm,
});

// Student detail
export const studentDetail = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const detailHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const detailName = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.xl,
  color: vars.color.text.primary,
});

export const detailMeta = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.tertiary,
});

export const compRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  padding: `${vars.space[2]} 0`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const compName = style({
  flex: 1,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
});

export const compBar = style({
  width: "120px",
  height: "8px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surface.inset,
  overflow: "hidden",
});

export const compBarFill = style({
  height: "100%",
  borderRadius: vars.radius.full,
  transition: `width ${vars.transition.base}`,
});

export const compPct = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  width: "36px",
  textAlign: "right",
});

export const compStage = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  width: "80px",
});

export const backBtn = style({
  background: "none",
  border: "none",
  cursor: "pointer",
  color: vars.color.text.link,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: 0,
});

export const viewToggle = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[1],
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.md,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  cursor: "pointer",
  border: "none",
  background: "none",
  transition: `all ${vars.transition.fast}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
  },
});

export const stuckBadge = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: "#E53E3E",
  backgroundColor: "#FED7D7",
  padding: `2px ${vars.space[2]}`,
  borderRadius: vars.radius.md,
});
