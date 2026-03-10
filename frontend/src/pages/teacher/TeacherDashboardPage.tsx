import { useState, useEffect } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import {
  useStartSession,
  useEndSession,
  useSessionActivities,
  useLaunchActivity,
  useLivePulse,
  useSessionScores,
  useClassSummary,
  useUpcomingSessions,
} from "@/api/hooks/useTeacher";
import { api } from "@/api/client";
import SessionCockpit from "@/components/teacher/SessionCockpit";
import SessionSummary from "@/components/teacher/SessionSummary";
import ClassAnalytics from "@/components/teacher/ClassAnalytics";
import { Users, Loader2, Calendar, Clock } from "lucide-react";
import * as s from "./TeacherDashboardPage.css";
import type { Session, SessionActivity } from "@/api/types";

export default function TeacherDashboardPage() {
  const { selectedCohortId } = useTeacherContext();
  const { data: activeSession } = useActiveSession(selectedCohortId);
  const { data: sessionActivities } = useSessionActivities(activeSession?.id);
  const { data: pulseEvents } = useLivePulse(selectedCohortId, activeSession?.id);
  const { data: sessionScores } = useSessionScores(selectedCohortId, activeSession?.id);
  const { data: classSummary, isLoading: loadingClass } = useClassSummary(selectedCohortId);
  const { data: upcomingSessions } = useUpcomingSessions(selectedCohortId);
  const startSession = useStartSession();
  const endSession = useEndSession();
  const launchActivity = useLaunchActivity();

  // HMS room code for teacher video
  const [roomCodeHost, setRoomCodeHost] = useState<string | null>(null);

  // Track "just ended" session for summary view
  const [endedSession, setEndedSession] = useState<Session | null>(null);
  const [endedActivities, setEndedActivities] = useState<SessionActivity[]>([]);

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

  // Start HMS room for a cohort session
  async function startHmsRoom(cohortId: string, sessionId: string) {
    try {
      // Create room if needed
      const roomData = await api
        .post(`/cohorts/${cohortId}/sessions/${sessionId}/create-room`)
        .then((r) => r.data)
        .catch(() => null); // room may already exist

      // Start class
      const startData = await api
        .post(`/cohorts/${cohortId}/sessions/${sessionId}/start-class`)
        .then((r) => r.data);

      setRoomCodeHost(startData.room_code_host || roomData?.room_code_host || null);
    } catch {
      // HMS is optional — session still works without video
    }
  }

  function handleEndSession() {
    if (!activeSession) return;
    // Snapshot current state for summary
    setEndedSession({ ...activeSession, ended_at: new Date().toISOString() });
    setEndedActivities(
      (sessionActivities ?? []).map((sa) => ({ ...sa, status: "completed" as const })),
    );
    endSession.mutate(activeSession.id);

    // End HMS class for the cohort session
    if (selectedCohortId && activeSession.id) {
      api.post(`/cohorts/${selectedCohortId}/sessions/${activeSession.id}/end-class`).catch(() => {});
    }
    setRoomCodeHost(null);
  }

  async function handleStartSession(sessionId?: string) {
    if (!selectedCohortId) return;
    setEndedSession(null);
    setEndedActivities([]);
    startSession.mutate({
      cohort_id: selectedCohortId,
      ...(sessionId ? { session_id: sessionId } : {}),
    });
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
          roomCodeHost={roomCodeHost}
          onStartHms={selectedCohortId ? (sessionId: string) => startHmsRoom(selectedCohortId, sessionId) : undefined}
        />
      </div>
    );
  }

  // ── State 1: Idle → upcoming sessions + class analytics ──
  const pendingSessions = upcomingSessions?.filter((us) => !us.started_at) ?? [];
  const completedSessions = upcomingSessions?.filter((us) => us.ended_at) ?? [];
  const now = Date.now();

  function isStartable(scheduledAt: string | null): boolean {
    if (!scheduledAt) return true; // no schedule = always startable
    const scheduled = new Date(scheduledAt).getTime();
    return now >= scheduled - 30 * 60 * 1000; // 30 min before
  }

  function formatSchedule(scheduledAt: string | null): string {
    if (!scheduledAt) return "No date set";
    const d = new Date(scheduledAt);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      + " at "
      + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className={s.page}>
      <div className={s.sectionTitle}>Upcoming Sessions</div>

      {!pendingSessions.length && (
        <div className={s.emptyState}>No upcoming sessions. Import a template from the admin panel.</div>
      )}

      {pendingSessions.map((us) => {
        const startable = isStartable(us.scheduled_at);
        return (
          <div key={us.id} className={s.sessionCard}>
            <div className={s.sessionInfo}>
              <div className={s.sessionTitle}>
                {us.title ?? `Session ${us.session_number}`}
              </div>
              <div className={s.sessionMeta}>
                {us.scheduled_at && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {formatSchedule(us.scheduled_at)}
                  </span>
                )}
                {us.description && <span style={{ marginLeft: 8 }}>{us.description}</span>}
              </div>
              {!startable && us.scheduled_at && (
                <div style={{ fontSize: 11, color: "#999", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> Available 30 min before scheduled time
                </div>
              )}
            </div>
            <button
              className={s.startBtn}
              onClick={() => handleStartSession(us.id)}
              disabled={!startable || startSession.isPending}
              style={!startable ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
            >
              {startSession.isPending ? "Starting..." : "Start"}
            </button>
          </div>
        );
      })}

      {completedSessions.length > 0 && (
        <>
          <div className={s.sectionTitle} style={{ marginTop: 24 }}>
            Completed ({completedSessions.length})
          </div>
          {completedSessions.map((us) => (
            <div key={us.id} className={s.sessionCard} style={{ opacity: 0.5 }}>
              <div className={s.sessionInfo}>
                <div className={s.sessionTitle}>{us.title ?? `Session ${us.session_number}`}</div>
                <div className={s.sessionMeta}>
                  {us.scheduled_at && formatSchedule(us.scheduled_at)}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#999" }}>Completed</span>
            </div>
          ))}
        </>
      )}

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
