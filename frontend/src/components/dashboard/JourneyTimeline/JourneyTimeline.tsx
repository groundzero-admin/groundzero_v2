import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Clock, ChevronRight } from "lucide-react";
import type { Session, Activity, EvidenceOut } from "@/api/types";
import { timeAgo } from "@/lib/format";
import * as s from "./JourneyTimeline.css";

interface JourneyTimelineProps {
  sessions: Session[];
  activities: Activity[];
  evidence: EvidenceOut[];
}

export function JourneyTimeline({ sessions, activities, evidence }: JourneyTimelineProps) {
  const navigate = useNavigate();

  // Build activity lookup
  const activityMap = useMemo(() => {
    const map: Record<string, Activity> = {};
    for (const a of activities) map[a.id] = a;
    return map;
  }, [activities]);

  // Build quiz scores per session: { sessionId → { correct, total } }
  const scoreMap = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    for (const ev of evidence) {
      if (!ev.session_id || ev.is_propagated) continue;
      if (!map[ev.session_id]) map[ev.session_id] = { correct: 0, total: 0 };
      map[ev.session_id].total += 1;
      if (ev.outcome >= 0.5) map[ev.session_id].correct += 1;
    }
    return map;
  }, [evidence]);

  // Deduplicate by session_number (keep latest per session_number), then sort descending
  const sorted = useMemo(() => {
    const byNum = new Map<number, Session>();
    for (const sess of sessions) {
      const existing = byNum.get(sess.session_number);
      if (!existing || new Date(sess.started_at) > new Date(existing.started_at)) {
        byNum.set(sess.session_number, sess);
      }
    }
    return [...byNum.values()].sort((a, b) => b.session_number - a.session_number);
  }, [sessions]);

  if (!sorted.length) {
    return (
      <div className={s.root}>
        <div className={s.title}>
          <Clock size={16} /> Your Journey
        </div>
        <div className={s.empty}>
          No sessions yet. Your journey will appear here as you attend live sessions.
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.title}>
        <Clock size={16} /> Your Journey
      </div>
      <div className={s.timeline}>
        <div className={s.line} />
        {sorted.map((session, idx) => {
          const activity = session.current_activity_id ? activityMap[session.current_activity_id] : null;
          const isLive = !session.ended_at;
          const isRecent = idx < 2 && !!session.ended_at;
          const score = session.id ? scoreMap[session.id] : null;
          const sessionNum = session.session_number;

          // Activity's primary competency for review navigation
          const primaryComp = activity?.primary_competencies?.[0]?.competency_id;

          const dotCls = [
            s.dot,
            isLive ? s.dotLive : isRecent ? s.dotRecent : s.dotOlder,
          ].join(" ");

          const activityName = activity?.name ?? session.current_activity_id ?? "Session";

          return (
            <div key={session.id} className={s.item}>
              <span className={dotCls} />
              <div className={s.sessionName}>
                Session {sessionNum}: {activityName}
              </div>
              <div className={s.timestamp}>
                {isLive
                  ? "Happening now"
                  : `Completed ${timeAgo(session.ended_at ?? session.started_at)}`}
              </div>
              {(score || (session.ended_at && primaryComp)) && (
                <div className={s.tags}>
                  {score && score.total > 0 && (
                    <span className={s.scoreTag}>
                      Quiz: {score.correct}/{score.total}
                    </span>
                  )}
                  {session.ended_at && primaryComp && (
                    <button
                      className={s.reviewBtn}
                      onClick={() => navigate(`/practice?competency=${primaryComp}`)}
                    >
                      {score && score.total > 0 ? "Review & Practice" : "Review"}
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default JourneyTimeline;
