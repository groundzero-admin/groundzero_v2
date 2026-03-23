import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const cardWrap = style({
  padding: vars.space[6],
  borderRadius: "22px",
  background: "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.55)",
  borderTopWidth: "4px",
  borderTopColor: "#3b82f6",
  boxShadow:
    "0 10px 40px rgba(59, 130, 246, 0.08), 0 2px 12px rgba(15, 23, 42, 0.04)",
  "@media": {
    "screen and (max-width: 900px)": {
      padding: vars.space[4],
      borderRadius: "18px",
    },
  },
});

export const root = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[6],
  flexWrap: "wrap",
  "@media": {
    "screen and (max-width: 900px)": {
      gap: vars.space[4],
      alignItems: "flex-start",
    },
  },
});

export const avatarArea = style({
  position: "relative",
  flexShrink: 0,
});

export const avatarFrame = style({
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  background: "linear-gradient(145deg, #fef3c7 0%, #fde68a 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "3px solid #fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
});

export const avatarEmoji = style({
  fontSize: "28px",
  lineHeight: 1,
});

export const levelBadge = style({
  position: "absolute",
  bottom: "-4px",
  right: "-4px",
  backgroundColor: "#22c55e",
  color: "#fff",
  fontSize: "10px",
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.extrabold,
  borderRadius: vars.radius.full,
  padding: "2px 8px",
  lineHeight: 1.4,
  boxShadow: vars.shadow.sm,
});

export const info = style({
  flex: 1,
  minWidth: "220px",
  "@media": {
    "screen and (max-width: 600px)": {
      minWidth: 0,
      width: "100%",
    },
  },
});

export const greeting = style({
  fontSize: vars.font.size["2xl"],
  fontFamily: "'Nunito', 'Inter', sans-serif",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.font.lineHeight.tight,
  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: vars.font.size.xl,
    },
  },
});

export const name = style({
  color: "#2563eb",
});

export const message = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  marginTop: vars.space[2],
  lineHeight: 1.5,
  maxWidth: "520px",
});

/* Vertical pillar pills */
export const pillarPills = style({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "14px",
  marginLeft: "auto",
  flexShrink: 0,
  padding: "4px 8px",
  "@media": {
    "screen and (max-width: 900px)": {
      marginLeft: 0,
      width: "100%",
      justifyContent: "center",
      overflowX: "visible",
      paddingBottom: "2px",
    },
  },
});

export const pillarCol = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
});

export const pillarTrack = style({
  width: "24px",
  height: "92px",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.12)",
  border: "1px solid rgba(15, 23, 42, 0.18)",
  boxShadow: "inset 0 2px 6px rgba(15, 23, 42, 0.12)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  overflow: "hidden",
  boxSizing: "border-box",
});

export const pillarFill = style({
  width: "100%",
  borderRadius: "999px",
  minHeight: "10px",
  transition: "height 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.35) inset",
});

export const pillarIcon = style({
  opacity: 0.9,
});
