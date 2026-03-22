import { keyframes, style } from "@vanilla-extract/css";

const pop = keyframes({
  "0%": { transform: "scale(1)" },
  "45%": { transform: "scale(1.08)" },
  "100%": { transform: "scale(1)" },
});

export const root = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  flexShrink: 0,
});

export const label = style({
  fontSize: "10px",
  fontWeight: 700,
  color: "rgba(148, 163, 184, 0.95)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginRight: "4px",
});

const btnBase = style({
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "10px",
  padding: "6px 10px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  color: "#f1f5f9",
  background: "rgba(30, 41, 59, 0.85)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
  ":hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
  },
  ":active": {
    transform: "translateY(0) scale(0.97)",
  },
});

export const btnGotIt = style([
  btnBase,
  {
    borderColor: "rgba(34, 197, 94, 0.45)",
    background: "rgba(22, 101, 52, 0.35)",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)",
      borderColor: "rgba(34, 197, 94, 0.65)",
    },
  },
]);

export const btnConfused = style([
  btnBase,
  {
    borderColor: "rgba(168, 85, 247, 0.45)",
    background: "rgba(88, 28, 135, 0.35)",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(168, 85, 247, 0.22)",
      borderColor: "rgba(168, 85, 247, 0.65)",
    },
  },
]);

export const btnKinda = style([
  btnBase,
  {
    borderColor: "rgba(245, 158, 11, 0.45)",
    background: "rgba(120, 53, 15, 0.4)",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(245, 158, 11, 0.22)",
      borderColor: "rgba(245, 158, 11, 0.65)",
    },
  },
]);

export const btnLost = style([
  btnBase,
  {
    borderColor: "rgba(239, 68, 68, 0.45)",
    background: "rgba(127, 29, 29, 0.35)",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.22)",
      borderColor: "rgba(239, 68, 68, 0.65)",
    },
  },
]);

export const btnFlash = style({
  animation: `${pop} 0.4s ease-out`,
});
