import type { CSSProperties } from "react";

/** Common props every question component accepts. */
export interface QuestionProps {
  data: Record<string, unknown>;
  /** Called when the student submits an answer. Omit for display-only mode. */
  onAnswer?: (answer: unknown) => void;
}

/* ─── Style tokens ─── */

export const CARD: CSSProperties = {
  borderRadius: 20,
  padding: 24,
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.6,
  background: "#fff",
  border: "none",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  overflow: "hidden",
  userSelect: "none",
};

export const HEADING: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 16,
  color: "#1a202c",
  lineHeight: 1.4,
};

export const OPT: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "2px solid #e2e8f0",
  background: "#fafafa",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all 0.15s",
  fontWeight: 500,
};
export const OPT_SEL: CSSProperties = {
  ...OPT,
  border: "2px solid #7C3AED",
  background: "#F5F3FF",
  color: "#5B21B6",
};
export const OPT_CORRECT: CSSProperties = {
  ...OPT,
  border: "2px solid #059669",
  background: "#ECFDF5",
  color: "#065F46",
};
export const OPT_WRONG: CSSProperties = {
  ...OPT,
  border: "2px solid #DC2626",
  background: "#FEF2F2",
  color: "#991B1B",
};

// aliases used by GeometryExplorer
export const OPT_CORRECT_AS = OPT_CORRECT;
export const OPT_WRONG_AS = OPT_WRONG;

export const RADIO: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "2px solid #CBD5E0",
  flexShrink: 0,
  transition: "all 0.15s",
};
export const RADIO_SEL: CSSProperties = { ...RADIO, border: "5px solid #7C3AED", background: "#fff" };
export const RADIO_OK: CSSProperties = { ...RADIO, border: "5px solid #059669", background: "#fff" };
export const RADIO_BAD: CSSProperties = { ...RADIO, border: "5px solid #DC2626", background: "#fff" };

export const TAG: CSSProperties = {
  display: "inline-flex",
  padding: "6px 14px",
  borderRadius: 24,
  fontSize: 13,
  fontWeight: 600,
  border: "2px dashed #a0aec0",
  background: "#fff",
  cursor: "grab",
  transition: "all 0.15s",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
export const TAG_USED: CSSProperties = {
  ...TAG,
  opacity: 0.3,
  cursor: "default",
  boxShadow: "none",
};

export const ZONE: CSSProperties = {
  border: "2px dashed #CBD5E0",
  borderRadius: 14,
  padding: "12px 14px",
  minHeight: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "#a0aec0",
  transition: "all 0.15s",
  fontWeight: 500,
};
export const ZONE_HOVER: CSSProperties = {
  ...ZONE,
  border: "2px dashed #7C3AED",
  background: "#F5F3FF",
  transform: "scale(1.01)",
};
export const ZONE_FILLED: CSSProperties = {
  ...ZONE,
  border: "2px solid #7C3AED",
  background: "#F5F3FF",
  color: "#5B21B6",
  cursor: "pointer",
  fontWeight: 700,
};
export const ZONE_CORRECT: CSSProperties = {
  ...ZONE,
  border: "2px solid #059669",
  background: "#ECFDF5",
  color: "#065F46",
  fontWeight: 700,
};
export const ZONE_WRONG: CSSProperties = {
  ...ZONE,
  border: "2px solid #DC2626",
  background: "#FEF2F2",
  color: "#991B1B",
  fontWeight: 700,
};

export const BTN: CSSProperties = {
  padding: "10px 28px",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 13,
  background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(109,40,217,0.3)",
  transition: "all 0.15s",
};
export const BTN_SECONDARY: CSSProperties = {
  ...BTN,
  background: "#F1F5F9",
  color: "#475569",
  boxShadow: "none",
};

export const BUBBLE: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "16px 16px 16px 4px",
  background: "#F1F5F9",
  maxWidth: "80%",
  fontSize: 13,
};
export const BUBBLE_USER: CSSProperties = {
  ...BUBBLE,
  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
  color: "#fff",
  borderRadius: "16px 16px 4px 16px",
  marginLeft: "auto",
};

export const TEXT_INPUT: CSSProperties = {
  width: "100%",
  background: "#fafafa",
  border: "2px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.15s",
};

export const FEEDBACK_OK: CSSProperties = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  background: "#ECFDF5",
  color: "#065F46",
  border: "none",
  boxShadow: "0 1px 4px rgba(5,150,105,0.15)",
};
export const FEEDBACK_ERR: CSSProperties = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "none",
  boxShadow: "0 1px 4px rgba(220,38,38,0.15)",
};

/* ─── Data parsing helpers ─── */

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function arr(v: unknown): string[] {
  if (Array.isArray(v))
    return v.map((x) =>
      typeof x === "string" ? x : typeof x === "object" && x ? JSON.stringify(x) : String(x),
    );
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim());
  return [];
}

export function num(v: unknown, fallback: number): number {
  return typeof v === "number" ? v : fallback;
}
