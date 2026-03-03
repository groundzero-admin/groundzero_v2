import { Flame, BookOpen, Wrench, Bot, Check } from "lucide-react";
import { useTeacherContext, type Phase } from "@/context/TeacherContext";
import type { SessionActivity } from "@/api/types";
import * as s from "./PhaseStrip.css";

const PHASES: { key: Phase; label: string; duration: string; Icon: typeof Flame }[] = [
  { key: "warmup", label: "Warm-up", duration: "10 mins", Icon: Flame },
  { key: "key_topic", label: "Key Topic", duration: "15 mins", Icon: BookOpen },
  { key: "diy", label: "Do it yourself", duration: "15 mins", Icon: Wrench },
  { key: "ai_lab", label: "AI Labs", duration: "20 mins", Icon: Bot },
];

/** Derive phase status from session activities */
function getPhaseStatus(
  phase: Phase,
  sessionActivities: SessionActivity[] | undefined,
): "completed" | "active" | "pending" {
  if (!sessionActivities?.length) return "pending";
  const matching = sessionActivities.filter((sa) => sa.activity_type === phase);
  if (!matching.length) return "pending";
  if (matching.some((sa) => sa.status === "active")) return "active";
  if (matching.every((sa) => sa.status === "completed")) return "completed";
  return "pending";
}

interface PhaseStripProps {
  sessionActivities?: SessionActivity[];
}

export default function PhaseStrip({ sessionActivities }: PhaseStripProps) {
  const { activePhase, setActivePhase } = useTeacherContext();

  return (
    <div className={s.strip}>
      {PHASES.map((p) => {
        const status = getPhaseStatus(p.key, sessionActivities);
        return (
          <button
            key={p.key}
            className={`${s.tab} ${activePhase === p.key ? s.tabActive : ""}`}
            onClick={() => setActivePhase(p.key)}
          >
            <p.Icon size={16} />
            <div className={s.tabLabel}>
              <span className={s.tabName}>{p.label}</span>
              <span className={s.tabDuration}>{p.duration}</span>
            </div>
            <span className={s.statusIndicator}>
              {status === "completed" ? (
                <Check size={14} />
              ) : status === "active" ? (
                "●"
              ) : (
                "○"
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
