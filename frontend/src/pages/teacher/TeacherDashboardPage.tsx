import { useState, useEffect } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import {
  useStartSession,
  useEndSession,
  useSessionActivities,
  useLaunchActivity,
  useCohorts,
  useLivePulse,
  useSessionScores,
  useClassSummary,
} from "@/api/hooks/useTeacher";
import SessionCockpit from "@/components/teacher/SessionCockpit";
import SessionSummary from "@/components/teacher/SessionSummary";
import ClassAnalytics from "@/components/teacher/ClassAnalytics";
import { Users, Loader2 } from "lucide-react";
import * as s from "./TeacherDashboardPage.css";
import type { Session, SessionActivity } from "@/api/types";

export default function TeacherDashboardPage() {
  const { selectedCohortId } = useTeacherContext();
  const { data: cohorts } = useCohorts();
  const { data: activeSession } = useActiveSession(selectedCohortId);
  const { data: sessionActivities } = useSessionActivities(activeSession?.id);
  const { data: pulseEvents } = useLivePulse(selectedCohortId, activeSession?.id);
  const { data: sessionScores } = useSessionScores(selectedCohortId, activeSession?.id);
  const { data: classSummary, isLoading: loadingClass } = useClassSummary(selectedCohortId);
  const startSession = useStartSession();
  const endSession = useEndSession();
  const launchActivity = useLaunchActivity();

  // Track "just ended" session for summary view
  const [endedSession, setEndedSession] = useState<Session | null>(null);
  const [endedActivities, setEndedActivities] = useState<SessionActivity[]>([]);

  const selectedCohort = cohorts?.find((c) => c.id === selectedCohortId);

  // Clear summary when cohort changes
  useEffect(() => {
    setEndedSession(null);
    setEndedActivities([]);
  }, [selectedCohortId]);

  if (!selectedCohortId) {
    return (
      <div className={s.noCohort}>
        <Users size={48} />
        <div className={s.noCohortTitle}>Select a cohort</div>
        <p>Pick a cohort from the sidebar to get started.</p>
      </div>
    );
  }

  function handleLaunch(activityId: string) {
    if (!activeSession) return;
    launchActivity.mutate({ sessionId: activeSession.id, activityId });
  }

  function handleEndSession() {
    if (!activeSession) return;
    // Snapshot current state for summary
    setEndedSession({ ...activeSession, ended_at: new Date().toISOString() });
    setEndedActivities(
      (sessionActivities ?? []).map((sa) => ({ ...sa, status: "completed" as const })),
    );
    endSession.mutate(activeSession.id);
  }

  function handleStartSession() {
    if (!selectedCohortId) return;
    setEndedSession(null);
    setEndedActivities([]);
    startSession.mutate({ cohort_id: selectedCohortId });
  }

  // ── State 3: Session just ended → show summary ──
  if (endedSession && !activeSession) {
    return (
      <div className={s.page}>
        <SessionSummary
          session={endedSession}
          activities={endedActivities}
          onStartNext={handleStartSession}
          isStarting={startSession.isPending}
        />
      </div>
    );
  }

  // ── State 2: Live session → cockpit mode ──
  if (activeSession) {
    return (
      <div className={s.page}>
        <SessionCockpit
          session={activeSession}
          activities={sessionActivities ?? []}
          pulseEvents={pulseEvents ?? undefined}
          sessionScores={sessionScores ?? []}
          onLaunch={handleLaunch}
          onEndSession={handleEndSession}
          isLaunching={launchActivity.isPending}
          isEnding={endSession.isPending}
        />
      </div>
    );
  }

  // ── State 1: Idle → class analytics + start session ──
  const nextSession = selectedCohort?.current_session_number ?? 1;

  return (
    <div className={s.page}>
      <div className={s.sessionCard}>
        <div className={s.sessionInfo}>
          <div className={s.sessionTitle}>Session {nextSession} · Ready</div>
          <div className={s.sessionMeta}>
            Start a session to load the lesson plan
          </div>
        </div>
        <button
          className={s.startBtn}
          onClick={handleStartSession}
          disabled={startSession.isPending}
        >
          {startSession.isPending ? "Starting..." : "Start Session"}
        </button>
      </div>

      {loadingClass ? (
        <div className={s.emptyState}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : classSummary ? (
        <ClassAnalytics data={classSummary} />
      ) : null}
    </div>
  );
}
