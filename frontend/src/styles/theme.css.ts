/**
 * Ground Zero DLS — Theme Contract + Light/Dark Themes
 *
 * createThemeContract defines the SHAPE of all semantic tokens.
 * createTheme fills the shape with values per theme.
 * Components import `vars` and reference tokens like `vars.color.surface.card`.
 */

import {
  createThemeContract,
  createTheme,
  globalStyle,
  globalKeyframes,
} from "@vanilla-extract/css";
import { palette, space, radii, fontFamily, fontSize, fontWeight, lineHeight, shadow, transition, zIndex } from "./tokens";

// ── Theme contract: the shape all themes must satisfy ──

export const vars = createThemeContract({
  color: {
    surface: {
      page: "",
      card: "",
      raised: "",
      overlay: "",
      inset: "",
      hover: "",
      active: "",
    },
    border: {
      subtle: "",
      default: "",
      strong: "",
    },
    text: {
      primary: "",
      secondary: "",
      tertiary: "",
      inverse: "",
      link: "",
    },
    interactive: {
      primary: "",
      primaryHover: "",
      secondary: "",
      secondaryHover: "",
    },
    feedback: {
      success: "",
      successSurface: "",
      warning: "",
      warningSurface: "",
      danger: "",
      dangerSurface: "",
      info: "",
      infoSurface: "",
    },
    pillar: {
      communication: "",
      creativity: "",
      ai: "",
      math: "",
    },
    accent: {
      gold: "",
      orange: "",
    },
  },
  space,
  radius: radii,
  font: {
    family: fontFamily,
    size: fontSize,
    weight: fontWeight,
    lineHeight,
  },
  shadow,
  transition,
  zIndex,
});

// ── Light theme ──

export const lightTheme = createTheme(vars, {
  color: {
    surface: {
      page: palette.gray100,
      card: palette.white,
      raised: palette.white,
      overlay: "rgba(255,255,255,0.85)",
      inset: palette.gray50,
      hover: palette.gray50,
      active: palette.gray200,
    },
    border: {
      subtle: "rgba(212,201,189,0.3)",
      default: "rgba(212,201,189,0.5)",
      strong: palette.gray300,
    },
    text: {
      primary: palette.gray900,
      secondary: palette.gray600,
      tertiary: palette.gray400,
      inverse: palette.white,
      link: palette.blue500,
    },
    interactive: {
      primary: palette.gray900,
      primaryHover: palette.gray800,
      secondary: palette.white,
      secondaryHover: palette.gray50,
    },
    feedback: {
      success: palette.green500,
      successSurface: "rgba(72,187,120,0.12)",
      warning: palette.yellow500,
      warningSurface: "rgba(236,201,75,0.15)",
      danger: palette.red400,
      dangerSurface: "rgba(252,129,129,0.12)",
      info: palette.blue400,
      infoSurface: "rgba(99,179,237,0.12)",
    },
    pillar: {
      communication: palette.red500,
      creativity: palette.blue500,
      ai: palette.green500,
      math: palette.purple500,
    },
    accent: {
      gold: palette.gold500,
      orange: palette.orange500,
    },
  },
  space,
  radius: radii,
  font: {
    family: fontFamily,
    size: fontSize,
    weight: fontWeight,
    lineHeight,
  },
  shadow,
  transition,
  zIndex,
});

// ── Dark theme ──

export const darkTheme = createTheme(vars, {
  color: {
    surface: {
      page: palette.gray900,
      card: palette.gray800,
      raised: palette.gray700,
      overlay: "rgba(15,15,20,0.85)",
      inset: palette.black,
      hover: palette.gray700,
      active: palette.gray600,
    },
    border: {
      subtle: "rgba(90,82,74,0.3)",
      default: "rgba(90,82,74,0.5)",
      strong: palette.gray600,
    },
    text: {
      primary: palette.gray50,
      secondary: palette.gray400,
      tertiary: palette.gray500,
      inverse: palette.gray900,
      link: palette.blue400,
    },
    interactive: {
      primary: palette.white,
      primaryHover: palette.gray200,
      secondary: palette.gray800,
      secondaryHover: palette.gray700,
    },
    feedback: {
      success: palette.green400,
      successSurface: "rgba(72,187,120,0.15)",
      warning: palette.yellow500,
      warningSurface: "rgba(236,201,75,0.15)",
      danger: palette.red400,
      dangerSurface: "rgba(252,129,129,0.15)",
      info: palette.blue400,
      infoSurface: "rgba(99,179,237,0.15)",
    },
    pillar: {
      communication: palette.red500,
      creativity: palette.blue500,
      ai: palette.green500,
      math: palette.purple500,
    },
    accent: {
      gold: palette.gold500,
      orange: palette.orange500,
    },
  },
  space,
  radius: radii,
  font: {
    family: fontFamily,
    size: fontSize,
    weight: fontWeight,
    lineHeight,
  },
  shadow: {
    xs: "0 1px 2px rgba(0,0,0,0.2)",
    sm: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
    md: "0 4px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.2)",
    lg: "0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2)",
    xl: "0 20px 25px rgba(0,0,0,0.35), 0 8px 10px rgba(0,0,0,0.2)",
  },
  transition,
  zIndex,
});

// ── Global reset + base styles ──

globalStyle("*, *::before, *::after", {
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
});

globalStyle("html", {
  fontFamily: vars.font.family.body,
  lineHeight: vars.font.lineHeight.normal,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("body", {
  backgroundColor: vars.color.surface.page,
  color: vars.color.text.primary,
  minHeight: "100vh",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  fontFamily: vars.font.family.display,
  lineHeight: vars.font.lineHeight.tight,
});

globalStyle("a", {
  color: vars.color.text.link,
  textDecoration: "none",
});

globalStyle("button", {
  cursor: "pointer",
  border: "none",
  background: "none",
  font: "inherit",
  color: "inherit",
});

globalKeyframes("spin", {
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

globalKeyframes("blink", {
  "0%, 100%": { opacity: "1" },
  "50%": { opacity: "0" },
});
