import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const sidebar = style({
    width: 248,
    minWidth: 248,
    borderRight: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.surface.card,
    display: "flex",
    flexDirection: "column",
    padding: `${vars.space[4]} ${vars.space[2]}`,
    overflowY: "auto",
    gap: vars.space[1],
});

export const navItem = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space[3],
    padding: `${vars.space[3]} ${vars.space[4]}`,
    margin: `0 ${vars.space[2]}`,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    color: vars.color.text.secondary,
    cursor: "pointer",
    transition: "color 0.15s ease, background 0.15s ease",
    border: "none",
    borderRadius: vars.radius.lg,
    background: "transparent",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
    ":hover": {
        color: vars.color.text.primary,
        backgroundColor: vars.color.surface.hover,
    },
});

export const navItemActive = style({
    color: vars.color.text.primary,
    backgroundColor: `${vars.color.feedback.success}14`,
    fontWeight: vars.font.weight.semibold,
    boxShadow: `inset 0 0 0 1px ${vars.color.feedback.success}40`,
    ":hover": {
        backgroundColor: `${vars.color.feedback.success}18`,
    },
});

export const sectionLabel = style({
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: `${vars.space[3]} ${vars.space[4]} ${vars.space[2]}`,
    marginBottom: vars.space[1],
});
