import { useState, useEffect } from "react";
import { Check, Send, Clock } from "lucide-react";
import type { SessionActivity } from "@/api/types";
import * as s from "./LessonPlan.css";

const TYPE_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  key_topic: "Key Topic",
  diy: "DIY",
  ai_lab: "AI Lab",
  artifact: "Artifact",
};

function formatTime(secs: number) {
  const m = Math.floor(Math.max(0, secs) / 60);
  const sec = Math.max(0, secs) % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function ActivityTimer({ launchedAt, durationMinutes }: { launchedAt: string; durationMinutes: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const raw = launchedAt;
    const launched = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
    const endTime = launched + durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const raw = launchedAt;
    const launched = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
    const endTime = launched + durationMinutes * 60 * 1000;

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [launchedAt, durationMinutes, timeLeft <= 0]);

  const expired = timeLeft <= 0;
  const urgent = timeLeft > 0 && timeLeft <= 60;

  return (
    <span
      className={s.timerBadge}
      style={{
        color: expired ? "#E53E3E" : urgent ? "#D69E2E" : undefined,
        fontWeight: expired || urgent ? 600 : undefined,
      }}
    >
      <Clock size={12} />
      {expired ? "Time's up" : formatTime(timeLeft)}
    </span>
  );
}

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
              {sa.duration_minutes && ` · ${sa.duration_minutes} min`}
            </div>
          </div>

          {/* Timer + Action */}
          {sa.status === "active" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {sa.launched_at && sa.duration_minutes ? (
                <ActivityTimer launchedAt={sa.launched_at} durationMinutes={sa.duration_minutes} />
              ) : null}
              <span className={s.liveBadge}>
                <span className={s.liveDot} /> Live
              </span>
            </div>
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
