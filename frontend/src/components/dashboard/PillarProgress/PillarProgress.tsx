import { ProgressBar } from "@/components/ui";
import { pillarColors } from "@/styles/tokens";
import { PILLAR_DISPLAY_NAMES, STAGE_LABELS } from "@/lib/constants";
import type { PillarProgress as PillarProgressType } from "@/lib/pillar-helpers";
import { BookOpen, AlertTriangle } from "lucide-react";
import * as s from "./PillarProgress.css";

const PILLAR_ORDER = ["communication", "creativity", "ai_systems", "math_logic"] as const;
const PILLAR_EMOJIS: Record<string, string> = {
  communication: "💬",
  creativity: "💡",
  ai_systems: "🤖",
  math_logic: "🧮",
};

interface PillarProgressProps {
  progress: Record<string, PillarProgressType>;
}

export function PillarProgress({ progress }: PillarProgressProps) {
  return (
    <div className={s.grid}>
      {PILLAR_ORDER.map((pid) => {
        const pp = progress[pid];
        if (!pp) return null;

        const pct = Math.round(pp.avgPLearned * 100);
        const color = pillarColors[pid as keyof typeof pillarColors] ?? "#999";
        const avgStageLabel = STAGE_LABELS[Math.round(pp.avgStage)] ?? "—";

        return (
          <div key={pid} className={s.pillarCard}>
            <div className={s.pillarHeader}>
              <div className={s.pillarName}>
                <div
                  className={s.pillarIcon}
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {PILLAR_EMOJIS[pid]}
                </div>
                <span style={{ color }}>{PILLAR_DISPLAY_NAMES[pid]}</span>
              </div>
              <span className={s.pctLabel} style={{ color }}>
                {pct}%
              </span>
            </div>

            <ProgressBar value={pct} color={color} height="md" />

            <div className={s.meta}>
              <span className={s.metaItem}>
                <BookOpen size={12} />
                {pp.totalEvidence} evidence
              </span>
              <span className={s.metaItem}>
                Avg: {avgStageLabel}
              </span>
              {pp.stuckCount > 0 && (
                <span className={s.metaItem}>
                  <AlertTriangle size={12} />
                  {pp.stuckCount} stuck
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PillarProgress;
