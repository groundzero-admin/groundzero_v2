/**
 * Ground Zero DLS — Sprinkles (atomic utility classes from tokens)
 *
 * Instead of Tailwind's arbitrary utilities, these are type-safe
 * atomic styles generated from our token set.
 */

import { defineProperties, createSprinkles } from "@vanilla-extract/sprinkles";
import { vars } from "./theme.css";

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { "@media": "screen and (min-width: 768px)" },
    desktop: { "@media": "screen and (min-width: 1024px)" },
  },
  defaultCondition: "mobile",
  properties: {
    display: ["none", "flex", "grid", "block", "inline-flex", "inline-block"],
    flexDirection: ["row", "column", "row-reverse", "column-reverse"],
    alignItems: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    justifyContent: [
      "stretch",
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
    ],
    flexWrap: ["nowrap", "wrap"],
    gap: vars.space,
    padding: vars.space,
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
    margin: vars.space,
    marginTop: vars.space,
    marginBottom: vars.space,
    marginLeft: vars.space,
    marginRight: vars.space,
    width: ["auto", "100%", "fit-content"],
    maxWidth: ["none", "480px", "640px", "768px", "1024px", "1280px"],
    textAlign: ["left", "center", "right"] as const,
    fontSize: vars.font.size,
    fontWeight: vars.font.weight,
    lineHeight: vars.font.lineHeight,
  },
  shorthands: {
    px: ["paddingLeft", "paddingRight"],
    py: ["paddingTop", "paddingBottom"],
    mx: ["marginLeft", "marginRight"],
    my: ["marginTop", "marginBottom"],
    p: ["padding"],
    m: ["margin"],
    align: ["alignItems"],
    justify: ["justifyContent"],
    direction: ["flexDirection"],
    size: ["fontSize"],
    weight: ["fontWeight"],
    leading: ["lineHeight"],
  },
});

const colorProperties = defineProperties({
  properties: {
    color: {
      primary: vars.color.text.primary,
      secondary: vars.color.text.secondary,
      tertiary: vars.color.text.tertiary,
      inverse: vars.color.text.inverse,
      link: vars.color.text.link,
      success: vars.color.feedback.success,
      warning: vars.color.feedback.warning,
      danger: vars.color.feedback.danger,
      info: vars.color.feedback.info,
      pillarComm: vars.color.pillar.communication,
      pillarCreate: vars.color.pillar.creativity,
      pillarAi: vars.color.pillar.ai,
      pillarMath: vars.color.pillar.math,
      gold: vars.color.accent.gold,
    },
    backgroundColor: {
      page: vars.color.surface.page,
      card: vars.color.surface.card,
      raised: vars.color.surface.raised,
      inset: vars.color.surface.inset,
      hover: vars.color.surface.hover,
      active: vars.color.surface.active,
      successSurface: vars.color.feedback.successSurface,
      warningSurface: vars.color.feedback.warningSurface,
      dangerSurface: vars.color.feedback.dangerSurface,
      infoSurface: vars.color.feedback.infoSurface,
      interactive: vars.color.interactive.primary,
      interactiveSecondary: vars.color.interactive.secondary,
    },
    borderColor: {
      subtle: vars.color.border.subtle,
      default: vars.color.border.default,
      strong: vars.color.border.strong,
    },
    borderRadius: vars.radius,
  },
});

export const sprinkles = createSprinkles(
  responsiveProperties,
  colorProperties
);

export type Sprinkles = Parameters<typeof sprinkles>[0];
