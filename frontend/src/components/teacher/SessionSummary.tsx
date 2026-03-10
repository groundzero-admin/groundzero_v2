import { Check, ArrowRight } from "lucide-react";
import type { Session, SessionActivity } from "@/api/types";
import * as s from "./SessionSummary.css";

interface SessionSummaryProps {
  session: Session;
  activities: SessionActivity[];
  onStartNext: () => void;
  isStarting?: boolean;
}

export default function SessionSummary({
  session,
  activities,
  onStartNext,
  isStarting,
}: SessionSummaryProps) {
  const completedCount = activities.filter((a) => a.status === "completed").length;
  const duration = session.ended_at
    ? Math.round(
        (new Date(session.ended_at).getTime() - new Date(session.started_at!).getTime()) / 60000,
      )
    : 0;

  return (
    <div className={s.root}>
      <div className={s.card}>
        <div className={s.title}>Session {session.session_number} — Completed</div>
        <div className={s.subtitle}>
          {new Date(session.started_at!).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>

        <div className={s.statsRow}>
          <div className={s.stat}>
            <div className={s.statValue}>{duration} min</div>
            <div className={s.statLabel}>Duration</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>
              {completedCount}/{activities.length}
            </div>
            <div className={s.statLabel}>Activities completed</div>
          </div>
        </div>

        <div className={s.activityList}>
          {activities.map((sa) => (
            <div key={sa.id} className={s.activityItem}>
              <Check size={16} className={s.checkIcon} />
              {sa.activity_name ?? sa.activity_id}
            </div>
          ))}
        </div>
      </div>

      <button
        className={s.startNextBtn}
        onClick={onStartNext}
        disabled={isStarting}
      >
        {isStarting ? "Starting..." : (
          <>Start Next Session <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
}
