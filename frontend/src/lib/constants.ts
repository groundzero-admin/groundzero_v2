import type { CompetencyState } from "@/api/types";

export const PILLAR_COLORS: Record<string, string> = {
  communication: "#E53E3E",
  creativity: "#3182CE",
  ai_systems: "#38A169",
  math_logic: "#805AD5",
};

export const PILLAR_DISPLAY_NAMES: Record<string, string> = {
  communication: "Communication",
  creativity: "Creativity",
  ai_systems: "AI & Systems",
  math_logic: "Math & Logic",
};

export const PILLAR_ICONS: Record<string, string> = {
  communication: "MessageCircle",
  creativity: "Lightbulb",
  ai_systems: "Cpu",
  math_logic: "Calculator",
};

export const STAGE_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Emerging",
  3: "Developing",
  4: "Proficient",
  5: "Mastered",
};

export const STAGE_COLORS: Record<number, string> = {
  1: "#A0AEC0",
  2: "#F6AD55",
  3: "#4FD1C5",
  4: "#63B3ED",
  5: "#48BB78",
};

export function computeXP(states: CompetencyState[]): number {
  return states.reduce((sum, s) => sum + s.total_evidence, 0);
}

export function computeLevel(xp: number): {
  level: number;
  xpInLevel: number;
  xpForNext: number;
} {
  const level = Math.floor(xp / 20) + 1;
  const xpInLevel = xp % 20;
  return { level, xpInLevel, xpForNext: 20 };
}
