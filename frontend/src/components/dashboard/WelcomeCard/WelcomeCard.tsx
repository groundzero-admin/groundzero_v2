import { Card, Avatar, ProgressBar } from "@/components/ui";
import { Flame } from "lucide-react";
import { pillarColors } from "@/styles/tokens";
import type { Student, CompetencyState } from "@/api/types";
import type { PillarProgress } from "@/lib/pillar-helpers";
import { computeXP, computeLevel } from "@/lib/constants";
import * as s from "./WelcomeCard.css";

const MESSAGES = [
  "Your builder energy is high today. Ready for a new quest?",
  "Every question makes your brain stronger. Let's go!",
  "You're on a roll. Keep building!",
  "Curiosity unlocked. What will you discover today?",
  "The more you practice, the more you grow.",
];

interface WelcomeCardProps {
  student: Student;
  states: CompetencyState[];
  pillarProgress: Record<string, PillarProgress>;
  streak: number;
}

const PILLAR_ORDER = ["communication", "creativity", "ai_systems", "math_logic"] as const;

const PILLAR_LABELS: Record<string, string> = {
  communication: "Communication",
  creativity: "Creativity",
  ai_systems: "AI & Systems",
  math_logic: "Math & Logic",
};

const PILLAR_COLOR_MAP: Record<string, string> = {
  communication: pillarColors.communication,
  creativity: pillarColors.creativity,
  ai_systems: pillarColors.ai,
  math_logic: pillarColors.math,
};

export function WelcomeCard({
  student,
  states,
  pillarProgress,
  streak,
}: WelcomeCardProps) {
  const xp = computeXP(states);
  const { level, xpInLevel, xpForNext } = computeLevel(xp);
  const message = MESSAGES[xp % MESSAGES.length];

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.avatarArea}>
          <Avatar name={student.name} size="xl" />
          <span className={s.levelBadge}>Lvl {level}</span>
        </div>

        <div className={s.info}>
          <div className={s.greeting}>
            Welcome back,{" "}
            <span className={s.name}>{student.name.split(" ")[0]}!</span>
          </div>
          <div className={s.message}>{message}</div>

          <div className={s.stats}>
            <div className={s.xpSection}>
              <div className={s.xpLabel}>
                {xpInLevel}/{xpForNext} XP to Level {level + 1}
              </div>
              <ProgressBar
                value={(xpInLevel / xpForNext) * 100}
                color={pillarColors.math}
                height="sm"
              />
            </div>

            {streak > 0 && (
              <div className={s.streakBox}>
                <Flame size={16} />
                {streak}d streak
              </div>
            )}
          </div>
        </div>

        <div className={s.scoreArea}>
          {PILLAR_ORDER.map((pid) => {
            const pp = pillarProgress[pid];
            const pct = pp ? Math.round(pp.avgPLearned * 100) : 0;
            const color = PILLAR_COLOR_MAP[pid] ?? "#999";
            return (
              <div key={pid} className={s.pillarRow}>
                <span className={s.pillarLabel}>{PILLAR_LABELS[pid]}</span>
                <div className={s.pillarBarTrack}>
                  <div
                    className={s.pillarBarFill}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className={s.pillarPct} style={{ color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default WelcomeCard;
