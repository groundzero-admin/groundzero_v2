import type { CompetencyState } from "@/api/types";

const PILLAR_BY_PREFIX: Record<string, string> = {
  "1": "communication",
  "2": "creativity",
  "3": "ai_systems",
  "4": "math_logic",
};

export function competencyToPillarId(competencyId: string): string {
  const prefix = competencyId.replace("C", "").split(".")[0];
  return PILLAR_BY_PREFIX[prefix] ?? "unknown";
}

export interface PillarProgress {
  pillarId: string;
  avgPLearned: number;
  avgStage: number;
  competencyCount: number;
  stuckCount: number;
  totalEvidence: number;
}

export function aggregatePillarProgress(
  states: CompetencyState[]
): Record<string, PillarProgress> {
  const buckets: Record<
    string,
    { sumPL: number; sumStage: number; count: number; stuck: number; evidence: number }
  > = {};

  for (const s of states) {
    const pillarId = competencyToPillarId(s.competency_id);
    if (!buckets[pillarId]) {
      buckets[pillarId] = { sumPL: 0, sumStage: 0, count: 0, stuck: 0, evidence: 0 };
    }
    const b = buckets[pillarId];
    b.sumPL += s.p_learned;
    b.sumStage += s.stage;
    b.count += 1;
    if (s.is_stuck) b.stuck += 1;
    b.evidence += s.total_evidence;
  }

  const result: Record<string, PillarProgress> = {};
  for (const [pillarId, b] of Object.entries(buckets)) {
    result[pillarId] = {
      pillarId,
      avgPLearned: b.count > 0 ? b.sumPL / b.count : 0,
      avgStage: b.count > 0 ? b.sumStage / b.count : 1,
      competencyCount: b.count,
      stuckCount: b.stuck,
      totalEvidence: b.evidence,
    };
  }

  return result;
}

export function computeStreak(evidenceDates: string[]): number {
  if (evidenceDates.length === 0) return 0;

  const uniqueDays = new Set(
    evidenceDates.map((d) => new Date(d).toISOString().split("T")[0])
  );
  const sortedDays = [...uniqueDays].sort().reverse();

  const today = new Date().toISOString().split("T")[0];
  if (sortedDays[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (sortedDays[0] !== yesterday) return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
