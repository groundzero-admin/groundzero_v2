import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const sidebar = style({
    width: 240,
    minWidth: 240,
    borderRight: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.card,
    display: "flex",
    flexDirection: "column",
    padding: `${vars.space[4]} 0`,
    overflowY: "auto",
});

export const navItem = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[3],
    padding: `${vars.space[3]} ${vars.space[5]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    color: vars.color.text.secondary,
    cursor: "pointer",
    transition: `all ${vars.transition.base}`,
    borderLeft: "3px solid transparent",
    ":hover": {
        color: vars.color.text.primary,
        backgroundColor: vars.color.surface.hover,
    },
});

export const navItemActive = style({
    color: vars.color.text.primary,
    backgroundColor: vars.color.surface.hover,
    borderLeftColor: vars.color.feedback.success,
    fontWeight: vars.font.weight.semibold,
});

export const sectionLabel = style({
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: `${vars.space[4]} ${vars.space[5]} ${vars.space[2]}`,
});
