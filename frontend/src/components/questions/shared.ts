import type { CSSProperties } from "react";

/** Common props every question component accepts. */
export interface QuestionProps {
  data: Record<string, unknown>;
  /** Called when the student submits an answer. Omit for display-only mode. */
  onAnswer?: (answer: unknown) => void;
}

/* ─── Style tokens ─── */

export const CARD: CSSProperties = {
  borderRadius: 12, padding: 20, fontFamily: "inherit", fontSize: 13,
  lineHeight: 1.6, background: "linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%)",
  border: "1px solid #e2e8f0", overflow: "hidden", userSelect: "none",
};

export const HEADING: CSSProperties = {
  fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1a202c",
};

export const OPT: CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
  background: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8,
  cursor: "pointer", transition: "all 0.15s",
};
export const OPT_SEL: CSSProperties = { ...OPT, border: "2px solid #805AD5", background: "#FAF5FF" };
export const OPT_CORRECT: CSSProperties = { ...OPT, border: "2px solid #38A169", background: "#F0FFF4" };
export const OPT_WRONG: CSSProperties = { ...OPT, border: "2px solid #E53E3E", background: "#FFF5F5" };

export const RADIO: CSSProperties = {
  width: 16, height: 16, borderRadius: "50%", border: "2px solid #CBD5E0", flexShrink: 0,
  transition: "all 0.15s",
};
export const RADIO_SEL: CSSProperties = { ...RADIO, border: "2px solid #805AD5", background: "#805AD5" };
export const RADIO_OK: CSSProperties = { ...RADIO, border: "2px solid #38A169", background: "#38A169" };
export const RADIO_BAD: CSSProperties = { ...RADIO, border: "2px solid #E53E3E", background: "#E53E3E" };

export const TAG: CSSProperties = {
  display: "inline-flex", padding: "5px 12px", borderRadius: 20, fontSize: 12,
  fontWeight: 600, border: "1px dashed #a0aec0", background: "#fff", cursor: "grab",
  transition: "all 0.15s",
};
export const TAG_USED: CSSProperties = { ...TAG, opacity: 0.35, cursor: "default" };

export const ZONE: CSSProperties = {
  border: "2px dashed #CBD5E0", borderRadius: 8, padding: "10px 14px", minHeight: 40,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#a0aec0",
  transition: "all 0.15s",
};
export const ZONE_HOVER: CSSProperties = { ...ZONE, border: "2px dashed #805AD5", background: "#FAF5FF" };
export const ZONE_FILLED: CSSProperties = { ...ZONE, border: "2px solid #805AD5", background: "#FAF5FF", color: "#553C9A", cursor: "pointer", fontWeight: 600 };
export const ZONE_CORRECT: CSSProperties = { ...ZONE, border: "2px solid #38A169", background: "#F0FFF4", color: "#276749", fontWeight: 600 };
export const ZONE_WRONG: CSSProperties = { ...ZONE, border: "2px solid #E53E3E", background: "#FFF5F5", color: "#C53030", fontWeight: 600 };

export const BTN: CSSProperties = {
  padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13,
  background: "#805AD5", color: "#fff", border: "none", cursor: "pointer",
  transition: "opacity 0.15s",
};
export const BTN_SECONDARY: CSSProperties = { ...BTN, background: "#E2E8F0", color: "#4A5568" };

export const BUBBLE: CSSProperties = {
  padding: "8px 14px", borderRadius: "12px 12px 12px 4px", background: "#EDF2F7",
  maxWidth: "80%", fontSize: 12,
};
export const BUBBLE_USER: CSSProperties = {
  ...BUBBLE, background: "#805AD5", color: "#fff", borderRadius: "12px 12px 4px 12px",
  marginLeft: "auto",
};

export const TEXT_INPUT: CSSProperties = {
  width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
  padding: 12, fontSize: 12, fontFamily: "inherit", outline: "none",
};

export const FEEDBACK_OK: CSSProperties = {
  marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
  background: "#F0FFF4", color: "#276749", border: "1px solid #C6F6D5",
};
export const FEEDBACK_ERR: CSSProperties = {
  marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
  background: "#FFF5F5", color: "#C53030", border: "1px solid #FED7D7",
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
