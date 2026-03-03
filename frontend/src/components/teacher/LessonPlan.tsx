import { Check, Send } from "lucide-react";
import type { SessionActivity } from "@/api/types";
import * as s from "./LessonPlan.css";

const TYPE_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  key_topic: "Key Topic",
  diy: "DIY",
  ai_lab: "AI Lab",
  artifact: "Artifact",
};

interface LessonPlanProps {
  activities: SessionActivity[];
  onLaunch: (activityId: string) => void;
  isLaunching?: boolean;
}

export default function LessonPlan({ activities, onLaunch, isLaunching }: LessonPlanProps) {
  return (
    <div className={s.root}>
      {activities.map((sa) => (
        <div
          key={sa.id}
          className={`${s.item} ${
            sa.status === "active" ? s.itemActive :
            sa.status === "completed" ? s.itemCompleted : ""
          }`}
        >
          {/* Status icon */}
          <div
            className={`${s.statusIcon} ${
              sa.status === "completed" ? s.statusCompleted :
              sa.status === "active" ? s.statusActive :
              s.statusPending
            }`}
          >
            {sa.status === "completed" ? (
              <Check size={14} />
            ) : sa.status === "active" ? (
              "●"
            ) : (
              sa.order
            )}
          </div>

          {/* Activity info */}
          <div className={s.info}>
            <div className={s.activityName}>
              {sa.activity_name ?? sa.activity_id}
            </div>
            <div className={s.activityType}>
              {TYPE_LABELS[sa.activity_type ?? ""] ?? sa.activity_type}
            </div>
          </div>

          {/* Action */}
          {sa.status === "active" ? (
            <span className={s.liveBadge}>
              <span className={s.liveDot} /> Live
            </span>
          ) : sa.status === "pending" ? (
            <button
              className={s.launchBtn}
              onClick={() => onLaunch(sa.activity_id)}
              disabled={isLaunching}
            >
              Launch <Send size={12} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
