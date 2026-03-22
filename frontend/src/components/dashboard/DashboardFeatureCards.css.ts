import { style } from "@vanilla-extract/css";

const radius = "22px";

export const row = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  "@media": {
    "screen and (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

const cardBase = style({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "20px 18px",
  borderRadius: radius,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.5)",
  background: "rgba(255, 255, 255, 0.36)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  textDecoration: "none",
  color: "inherit",
  boxShadow: "0 6px 24px rgba(15, 23, 42, 0.045)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
  minHeight: "168px",
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
  },
});

export const card = style([
  cardBase,
  {
    borderTopWidth: "4px",
    borderTopStyle: "solid",
  },
]);

export const cardGreen = style({
  borderTopColor: "#34d399",
});

export const cardPurple = style({
  borderTopColor: "#a78bfa",
});

export const cardTeal = style({
  borderTopColor: "#2dd4bf",
});

export const cardDisabled = style({
  cursor: "not-allowed",
  opacity: 0.92,
  ":hover": {
    transform: "none",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
});

export const comingSoon = style({
  position: "absolute",
  top: "12px",
  right: "12px",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#94a3b8",
  background: "#f1f5f9",
  padding: "4px 8px",
  borderRadius: "6px",
});

export const cardTop = style({
  marginBottom: "10px",
});

export const icon = style({
  color: "#475569",
});

export const iconMuted = style({
  color: "#94a3b8",
});

export const title = style({
  fontSize: "17px",
  fontWeight: 700,
  margin: "0 0 6px",
  color: "#1e293b",
  fontFamily: "'Nunito', 'Inter', sans-serif",
});

export const titleMuted = style([
  title,
  {
    color: "#94a3b8",
  },
]);

export const desc = style({
  fontSize: "13px",
  lineHeight: 1.45,
  color: "#64748b",
  margin: "0 0 auto",
  flex: 1,
});

export const descMuted = style([
  desc,
  {
    color: "#cbd5e1",
  },
]);

export const linkHint = style({
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  marginTop: "12px",
});

export const badgePurple = style({
  marginTop: "12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#7c3aed",
  background: "rgba(124, 58, 237, 0.1)",
  padding: "4px 10px",
  borderRadius: "999px",
});

export const badgeTeal = style({
  marginTop: "12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#0d9488",
  background: "rgba(13, 148, 136, 0.1)",
  padding: "4px 10px",
  borderRadius: "999px",
});
