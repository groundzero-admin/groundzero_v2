import { useNavigate } from "react-router";
import { Radio, Play, Calendar } from "lucide-react";
import type { Session, Activity } from "@/api/types";
import { Card } from "@/components/ui";
import * as s from "./SessionsCard.css";

interface SessionsCardProps {
  session: Session | null;
  activity: Activity | null;
  loading: boolean;
}

export function SessionsCard({ session, activity, loading }: SessionsCardProps) {
  const navigate = useNavigate();

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <Radio size={16} />
          Sessions
        </div>

        {loading ? (
          <div className={s.emptyState}>
            <div className={s.emptyText}>Checking for sessions...</div>
          </div>
        ) : session ? (
          <div className={s.liveCard}>
            <div className={s.liveHeader}>
              <span className={s.liveBadge}>
                <span className={s.liveDot} />
                LIVE NOW
              </span>
              {session.teacher_id && (
                <span className={s.facilitator}>
                  Teacher session
                </span>
              )}
            </div>
            <div className={s.activityName}>
              {activity?.name ?? session.current_activity_id ?? "Live Session"}
            </div>
            <button className={s.joinBtn} onClick={() => navigate("/live")}>
              <Play size={14} />
              Join Session
            </button>
          </div>
        ) : (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <Calendar size={18} />
            </div>
            <div className={s.emptyText}>
              No live session right now. Your facilitator will start one when it's time.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
