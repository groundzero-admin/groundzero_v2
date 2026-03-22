import { Bot, Calculator, MessageCircle, Palette } from "lucide-react";
import type { Student, CompetencyState } from "@/api/types";
import type { PillarProgress } from "@/lib/pillar-helpers";
import { computeXP, computeLevel } from "@/lib/constants";
import * as s from "./WelcomeCard.css";

const SUBTEXT =
  "Your builder energy is high today. Check out your upcoming mission or review your past conquests.";

interface WelcomeCardProps {
  student: Student;
  states: CompetencyState[];
  pillarProgress: Record<string, PillarProgress>;
}

const PILLAR_ORDER = ["communication", "creativity", "ai_systems", "math_logic"] as const;

/** Display order: pink, orange, green, teal — matches dashboard visual */
const PILLAR_VISUAL: Record<
  (typeof PILLAR_ORDER)[number],
  { color: string; Icon: typeof MessageCircle }
> = {
  communication: { color: "#ec4899", Icon: MessageCircle },
  creativity: { color: "#f97316", Icon: Palette },
  ai_systems: { color: "#22c55e", Icon: Bot },
  math_logic: { color: "#14b8a6", Icon: Calculator },
};

export function WelcomeCard({
  student,
  states,
  pillarProgress,
}: WelcomeCardProps) {
  const xp = computeXP(states);
  const { level } = computeLevel(xp);

  return (
    <div className={s.cardWrap}>
      <div className={s.root}>
        <div className={s.avatarArea}>
          <div className={s.avatarFrame}>
            <span className={s.avatarEmoji} aria-hidden>
              🎓
            </span>
          </div>
          <span className={s.levelBadge}>Lvl {level}</span>
        </div>

        <div className={s.info}>
          <div className={s.greeting}>
            Welcome back,{" "}
            <span className={s.name}>{student.name}!</span>
          </div>
          <div className={s.message}>{SUBTEXT}</div>
        </div>

        <div className={s.pillarPills} aria-label="Pillar progress">
          {PILLAR_ORDER.map((pid) => {
            const pp = pillarProgress[pid];
            const pct = pp ? Math.round(pp.avgPLearned * 100) : 0;
            const { color, Icon } = PILLAR_VISUAL[pid];
            return (
              <div key={pid} className={s.pillarCol}>
                <div className={s.pillarTrack}>
                  <div
                    className={s.pillarFill}
                    style={{ height: `${Math.max(8, pct)}%`, backgroundColor: color }}
                  />
                </div>
                <Icon size={16} className={s.pillarIcon} strokeWidth={2} style={{ color }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WelcomeCard;
