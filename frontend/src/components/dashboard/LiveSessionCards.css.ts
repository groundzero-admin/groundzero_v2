import { style } from "@vanilla-extract/css";

const cardRadius = "22px";

export const liveCard = style({
  borderRadius: cardRadius,
  padding: "22px 24px",
  fontFamily: "'Nunito', 'Inter', sans-serif",
  background: "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.55)",
  borderTopWidth: "4px",
  borderTopColor: "#f43f5e",
  boxShadow:
    "0 10px 40px rgba(244, 63, 94, 0.09), 0 2px 14px rgba(15, 23, 42, 0.04)",
  minHeight: "172px",
  boxSizing: "border-box",
  "@media": {
    "screen and (max-width: 900px)": {
      padding: "16px",
      borderRadius: "18px",
      minHeight: "unset",
    },
  },
});

export const liveHeaderRow = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  minHeight: "128px",
  "@media": {
    "screen and (max-width: 700px)": {
      flexDirection: "column",
      minHeight: "unset",
    },
  },
});

export const liveEmptyDesc = style({
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 14px",
  lineHeight: 1.45,
  maxWidth: "520px",
});

export const timeBoxMuted = style({
  textAlign: "center",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "#f1f5f9",
  minWidth: "100px",
  flexShrink: 0,
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  "@media": {
    "screen and (max-width: 700px)": {
      alignSelf: "flex-start",
      minWidth: "unset",
      width: "100%",
    },
  },
});

export const timeBoxPlaceholder = style({
  fontSize: "20px",
  fontWeight: 800,
  color: "#cbd5e1",
  marginTop: "4px",
});

export const loadingRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  minHeight: "128px",
  color: "#94a3b8",
  fontSize: "14px",
  fontWeight: 600,
});

export const liveLeft = style({
  flex: 1,
  minWidth: 0,
});

export const liveTitleRow = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
});

export const liveIconWrap = style({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#fff0f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
});

export const liveLabel = style({
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#e11d48",
});

export const liveTitle = style({
  fontSize: "19px",
  fontWeight: 800,
  color: "#0f172a",
  margin: "0 0 6px",
  fontFamily: "'Nunito', 'Inter', sans-serif",
});

export const liveDesc = style({
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 14px",
  lineHeight: 1.45,
});

export const timeBox = style({
  textAlign: "center",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "#f1f5f9",
  minWidth: "100px",
  flexShrink: 0,
  "@media": {
    "screen and (max-width: 700px)": {
      minWidth: "unset",
      width: "100%",
      textAlign: "left",
    },
  },
});

export const timeBoxLabel = style({
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
});

export const timeBoxTime = style({
  fontSize: "20px",
  fontWeight: 800,
  color: "#0f172a",
  marginTop: "4px",
});

export const lockRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#f1f5f9",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 600,
});

export const joinBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "12px",
  border: "none",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
});

/* Journey — fixed footprint; list scrolls inside */
export const journeyCard = style({
  borderRadius: cardRadius,
  padding: "20px 16px 16px 20px",
  fontFamily: "'Nunito', 'Inter', sans-serif",
  background: "rgba(255, 255, 255, 0.38)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.5)",
  borderTopWidth: "3px",
  borderTopColor: "#a855f7",
  boxShadow:
    "0 8px 32px rgba(168, 85, 247, 0.07), 0 2px 12px rgba(15, 23, 42, 0.035)",
  display: "flex",
  flexDirection: "column",
  maxHeight: "min(72vh, 520px)",
  minHeight: 0,
  overflow: "hidden",
  "@media": {
    "screen and (max-width: 900px)": {
      borderRadius: "18px",
      padding: "16px",
      maxHeight: "none",
    },
  },
});

export const journeyScroll = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor: "#cbd5e1 transparent",
  selectors: {
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "6px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#94a3b8",
    },
  },
});

export const journeyHead = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  flexShrink: 0,
});

export const cohortToggleRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "14px",
  flexShrink: 0,
});

const cohortToggleBase = style({
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  fontFamily: "'Nunito', 'Inter', sans-serif",
  cursor: "pointer",
  border: "1px solid #e2e8f0",
  background: "rgba(255, 255, 255, 0.5)",
  color: "#64748b",
  maxWidth: "160px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
});

export const cohortToggle = style([
  cohortToggleBase,
  {
    ":hover": {
      background: "rgba(255, 255, 255, 0.85)",
      borderColor: "#cbd5e1",
      color: "#334155",
    },
  },
]);

export const cohortToggleActive = style([
  cohortToggleBase,
  {
    borderColor: "#a855f7",
    background: "rgba(168, 85, 247, 0.15)",
    color: "#6b21a8",
    boxShadow: "0 0 0 1px rgba(168, 85, 247, 0.25)",
    ":hover": {
      background: "rgba(168, 85, 247, 0.2)",
      borderColor: "#9333ea",
      color: "#581c87",
    },
  },
]);

export const filterEmpty = style({
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center",
  padding: "24px 12px",
  margin: 0,
});

export const journeyTitle = style({
  fontSize: "17px",
  fontWeight: 800,
  color: "#0f172a",
  margin: 0,
});

export const timeline = style({
  position: "relative",
  paddingLeft: "20px",
});

export const timelineLine = style({
  position: "absolute",
  left: "6px",
  top: "10px",
  bottom: "10px",
  width: "2px",
  background: "#e2e8f0",
});

export const node = style({
  position: "relative",
  paddingBottom: "18px",
  paddingLeft: "16px",
});

export const dot = style({
  position: "absolute",
  left: "-17px",
  top: "5px",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  border: "2px solid rgba(255, 255, 255, 0.75)",
  boxSizing: "border-box",
});

export const sessionTitle = style({
  fontWeight: 700,
  fontSize: "14px",
  color: "#0f172a",
});

export const sessionTitleMuted = style([
  sessionTitle,
  {
    color: "#0f172a",
  },
]);

export const sessionMeta = style({
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "3px",
});

export const sessionMetaMuted = style([
  sessionMeta,
  {
    color: "#334155",
  },
]);

export const sessionCohort = style({
  fontSize: "11px",
  fontWeight: 600,
  color: "#7c3aed",
  marginTop: "4px",
  padding: "5px 10px",
  borderRadius: "999px",
  background: "rgba(124, 58, 237, 0.1)",
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const sessionCohortMuted = style([
  sessionCohort,
  {
    color: "#334155",
    background: "#e2e8f0",
  },
]);

export const liveCohort = style({
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  margin: "0 0 8px",
});

export const reviewBtn = style({
  marginTop: "8px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 12px",
  borderRadius: "999px",
  border: "1px solid #93c5fd",
  background: "linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%)",
  fontSize: "11px",
  fontWeight: 700,
  color: "#1e3a8a",
  cursor: "pointer",
  fontFamily: "inherit",
  ":hover": {
    background: "linear-gradient(135deg, #bfdbfe 0%, #bbf7d0 100%)",
    borderColor: "#60a5fa",
    color: "#1d4ed8",
  },
});

export const reviewBtnMuted = style([
  reviewBtn,
  {
    borderColor: "#93c5fd",
    background: "linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%)",
    color: "#1e3a8a",
    ":hover": {
      background: "linear-gradient(135deg, #bfdbfe 0%, #bbf7d0 100%)",
      borderColor: "#60a5fa",
      color: "#1d4ed8",
    },
  },
]);

export const emptyHint = style({
  fontSize: "13px",
  color: "#94a3b8",
  padding: "8px 0",
});
