import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const page = style({
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  backgroundColor: vars.color.surface.page,
  display: "flex",
  flexDirection: "column",
});

export const filterBar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[4],
  padding: `${vars.space[3]} ${vars.space[5]}`,
  backgroundColor: vars.color.surface.card,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  zIndex: 10,
  flexShrink: 0,
  flexWrap: "wrap",
});

export const filterTitle = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  marginRight: vars.space[4],
});

export const filterTabs = style({
  display: "flex",
  gap: vars.space[2],
  flexWrap: "wrap",
});

export const filterTab = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.lg,
  border: "2px solid transparent",
  backgroundColor: vars.color.surface.page,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.secondary,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
  },
});

export const filterTabActive = style({
  backgroundColor: "white",
  fontWeight: vars.font.weight.semibold,
});

export const filterDot = style({
  width: "10px",
  height: "10px",
  borderRadius: vars.radius.full,
  flexShrink: 0,
});

export const filterCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontWeight: vars.font.weight.regular,
});

export const filterLegend = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  marginLeft: "auto",
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
});

export const canvas = style({
  display: "block",
  width: "100%",
  flex: 1,
  cursor: "grab",
  selectors: {
    "&:active": { cursor: "grabbing" },
  },
});

export const tooltip = style({
  position: "absolute",
  pointerEvents: "none",
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  boxShadow: vars.shadow.lg,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  maxWidth: "280px",
  zIndex: 50,
});

export const sidePanel = style({
  position: "absolute",
  top: 0,
  right: 0,
  width: "360px",
  height: "100%",
  backgroundColor: vars.color.surface.card,
  borderLeft: `1px solid ${vars.color.border.default}`,
  boxShadow: vars.shadow.xl,
  padding: vars.space[6],
  overflowY: "auto",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const panelClose = style({
  alignSelf: "flex-end",
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.md,
  color: vars.color.text.secondary,
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
    color: vars.color.text.primary,
  },
});

export const panelTitle = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
});

export const panelPillarBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[2],
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.full,
  width: "fit-content",
});

export const panelSection = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[1],
});

export const panelLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export const panelValue = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.font.lineHeight.relaxed,
});

export const panelEdgeItem = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderLeft: "3px solid",
  borderRadius: `0 ${vars.radius.md} ${vars.radius.md} 0`,
  backgroundColor: vars.color.surface.page,
  cursor: "pointer",
  textAlign: "left",
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
  },
});

export const panelEdgeSub = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.tertiary,
  fontWeight: vars.font.weight.regular,
});

export const loadingOverlay = style({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: vars.color.surface.page,
  zIndex: 50,
});

export const loadingText = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.lg,
  color: vars.color.text.secondary,
});

export const controls = style({
  position: "absolute",
  bottom: vars.space[4],
  left: vars.space[4],
  display: "flex",
  gap: vars.space[2],
  zIndex: 10,
});

export const controlBtn = style({
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: vars.color.surface.card,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.sm,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.lg,
  cursor: "pointer",
  transition: `all ${vars.transition.base}`,
  ":hover": {
    backgroundColor: vars.color.surface.hover,
    color: vars.color.text.primary,
  },
});
