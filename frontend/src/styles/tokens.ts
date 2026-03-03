/**
 * Ground Zero DLS — Primitive Tokens
 *
 * Raw design values. Never consumed directly by components.
 * Components use semantic tokens via the theme contract.
 */

export const palette = {
  white: "#FFFFFF",
  black: "#0F0F14",

  gray50: "#FAF7F4",
  gray100: "#F5F0EB",
  gray200: "#E8E0D8",
  gray300: "#D4C9BD",
  gray400: "#A89E94",
  gray500: "#7A7168",
  gray600: "#5A524A",
  gray700: "#3D3730",
  gray800: "#26221D",
  gray900: "#1A1714",

  red100: "#FED7D7",
  red400: "#FC8181",
  red500: "#E53E3E",

  blue100: "#BEE3F8",
  blue400: "#63B3ED",
  blue500: "#3182CE",

  green100: "#C6F6D5",
  green400: "#68D391",
  green500: "#38A169",

  purple100: "#E9D8FD",
  purple400: "#B794F4",
  purple500: "#805AD5",

  gold500: "#F6AD55",
  orange500: "#ED8936",
  yellow500: "#ECC94B",
  teal500: "#38B2AC",
  pink500: "#ED64A6",
} as const;

export const pillarColors = {
  communication: palette.red500,
  creativity: palette.blue500,
  ai: palette.green500,
  math: palette.purple500,
} as const;

export const space = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
} as const;

export const fontFamily = {
  display: "'Nunito', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const lineHeight = {
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.75",
} as const;

export const shadow = {
  xs: "0 1px 2px rgba(0,0,0,0.04)",
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)",
  lg: "0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
  xl: "0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)",
} as const;

export const transition = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
  spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const zIndex = {
  base: "0",
  dropdown: "100",
  sticky: "200",
  overlay: "300",
  modal: "400",
  toast: "500",
} as const;
