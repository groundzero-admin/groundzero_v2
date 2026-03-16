import { useState } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import {
  useStartSession,
  useEndSession,
  useRestartSession,
  useMarkSessionDone,
  useUpcomingSessions,
  useCohortStudents,
} from "@/api/hooks/useTeacher";
import { api } from "@/api/client";
import { Users, Calendar, CheckCircle2, Video, Square, RotateCcw, Flag } from "lucide-react";
import * as s from "./TeacherDashboardPage.css";

const AVATAR_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#14B8A6",
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.replace(/[^a-zA-Z\s]/g, "").split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function TeacherDashboardPage() {
  const { selectedCohortId } = useTeacherContext();
  const { data: upcomingSessions } = useUpcomingSessions(selectedCohortId);
  const { data: students } = useCohortStudents(selectedCohortId);
  const startSession = useStartSession();
  const endSession = useEndSession();
  const restartSession = useRestartSession();
  const markDone = useMarkSessionDone();
  const { refetch: refetchSessions } = useUpcomingSessions(selectedCohortId);
  const [goingLiveId, setGoingLiveId] = useState<string | null>(null);
  const [endingClassId, setEndingClassId] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);

  // ── No cohort selected ──
  if (!selectedCohortId) {
    return (
      <div className={s.noCohort}>
        <Users size={48} />
        <div className={s.noCohortTitle}>Select a cohort</div>
        <p>Pick a cohort from the sidebar to get started.</p>
      </div>
    );
  }

  // ── Go Live — full flow ──
  async function handleGoLive(sessionId: string) {
    if (!selectedCohortId) return;
    setGoingLiveId(sessionId);
    try {
      // 1. Start session in our backend
      startSession.mutate(
        { cohort_id: selectedCohortId, session_id: sessionId },
        {
          onSuccess: async () => {
            try {
              // 2. Create HMS room (ignore if already exists)
              const roomData = await api
                .post(`/cohorts/${selectedCohortId}/sessions/${sessionId}/create-room`)
                .then((r) => r.data)
                .catch(() => null);
              // 3. Start live class
              const startData = await api
                .post(`/cohorts/${selectedCohortId}/sessions/${sessionId}/start-class`)
                .then((r) => r.data);

              const hostCode = startData?.room_code_host || roomData?.room_code_host;
              // 4. Open live class in new tab
              const params = new URLSearchParams({
                roomCode: hostCode || "",
                cohortId: selectedCohortId,
                sessionId,
                userName: "Teacher",
              });
              window.open(`/teacher/live-class?${params.toString()}`, "_blank");
            } catch (e) {
              console.error("HMS room setup failed:", e);
              // Still open the page without HMS if needed
              const params = new URLSearchParams({
                cohortId: selectedCohortId,
                sessionId,
                userName: "Teacher",
              });
              window.open(`/teacher/live-class?${params.toString()}`, "_blank");
            } finally {
              setGoingLiveId(null);
            }
          },
          onError: () => setGoingLiveId(null),
        }
      );
    } catch {
      setGoingLiveId(null);
    }
  }

  function isStartable(scheduledAt: string | null): boolean {
    if (!scheduledAt) return true;
    return Date.now() >= new Date(scheduledAt).getTime() - 30 * 60 * 1000;
  }

  // ══════════════════════════════════════════
  // Session boxes + student list
  // ══════════════════════════════════════════
  const allSessions = upcomingSessions ?? [];
  const doneIds = new Set(allSessions.filter((s) => s.is_done).map((s) => s.id));
  const endedIds = new Set(allSessions.filter((s) => s.ended_at && !s.is_done).map((s) => s.id));
  const firstPendingId = allSessions.find((s) => !s.started_at && !s.ended_at)?.id ?? null;

  return (
    <div className={s.page}>
      <div className={s.sectionTitle}>Sessions</div>

      {!allSessions.length && (
        <div className={s.emptyState}>No sessions yet. Ask your admin to import templates for this cohort.</div>
      )}

      {/* Session grid — square boxes in a row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
        {allSessions.map((ses) => {
          const isDone = doneIds.has(ses.id);
          const isEnded = endedIds.has(ses.id);
          const isNext = ses.id === firstPendingId;
          const isFuture = !isDone && !isEnded && !isNext && !ses.started_at;
          const isLive = ses.started_at && !ses.ended_at;
          const canStart = (isNext || isLive) && isStartable(ses.scheduled_at);

          return (
            <div
              key={ses.id}
              style={{
                width: 160, minHeight: 160,
                borderRadius: 16,
                padding: "16px 14px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                background: isDone
                  ? "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)"
                  : isEnded
                    ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                    : isNext || isLive
                      ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                      : "var(--color-surface-card, #fff)",
                border: isLive
                  ? "2px solid #22c55e"
                  : isEnded
                    ? "2px solid #f59e0b"
                    : isDone
                      ? "1px solid #d1d5db"
                      : isNext
                        ? "2px solid #22c55e"
                        : "1px solid var(--color-border-subtle, #e5e7eb)",
                boxShadow: isLive || isNext ? "0 0 0 3px rgba(34,197,94,0.15)" : isEnded ? "0 0 0 3px rgba(245,158,11,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
                opacity: isDone ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Session info */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, lineHeight: 1.3,
                  color: isDone ? "#9ca3af" : isEnded ? "#92400e" : (isNext || isLive) ? "#16a34a" : "var(--color-text-primary, #333)",
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                  {ses.title ?? `Session ${ses.session_number}`}
                </div>
                {ses.scheduled_at && (
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.6 }}>
                    <Calendar size={10} style={{ verticalAlign: "middle", marginRight: 2 }} />
                    {new Date(ses.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(ses.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
                <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, display: "flex", justifyContent: "center", gap: 8 }}>
                  <span>{ses.activity_count} activities</span>
                  <span>{ses.total_questions} questions</span>
                </div>
              </div>

              {/* Bottom: status or button */}
              <div style={{ textAlign: "center", marginTop: 12 }}>
                {isDone ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={13} /> Done
                  </span>
                ) : isEnded ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      className={s.goLiveBtn}
                      onClick={async () => {
                        setRestartingId(ses.id);
                        try {
                          await restartSession.mutateAsync(ses.id);
                          // Re-enable HMS room and get room code
                          const startData = await api
                            .post(`/cohorts/${selectedCohortId}/sessions/${ses.id}/start-class`)
                            .then((r) => r.data)
                            .catch(() => null);
                          const hostCode = startData?.room_code_host;
                          // Open live class tab
                          const params = new URLSearchParams({
                            cohortId: selectedCohortId!,
                            sessionId: ses.id,
                            userName: "Teacher",
                          });
                          if (hostCode) params.set("roomCode", hostCode);
                          window.open(`/teacher/live-class?${params.toString()}`, "_blank");
                          refetchSessions();
                        } finally {
                          setRestartingId(null);
                        }
                      }}
                      disabled={restartingId === ses.id}
                      style={{ width: "100%", padding: "7px 0", fontSize: 11, backgroundColor: "#f59e0b" }}
                    >
                      <RotateCcw size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      {restartingId === ses.id ? "Restarting..." : "Restart"}
                    </button>
                    <button
                      className={s.goLiveBtn}
                      onClick={async () => {
                        setMarkingDoneId(ses.id);
                        try {
                          await markDone.mutateAsync(ses.id);
                          refetchSessions();
                        } finally {
                          setMarkingDoneId(null);
                        }
                      }}
                      disabled={markingDoneId === ses.id}
                      style={{ width: "100%", padding: "7px 0", fontSize: 11, backgroundColor: "#6366f1" }}
                    >
                      <Flag size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      {markingDoneId === ses.id ? "Marking..." : "Mark Done"}
                    </button>
                  </div>
                ) : isLive ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      className={s.goLiveBtn}
                      onClick={() => {
                        const params = new URLSearchParams({
                          cohortId: selectedCohortId!,
                          sessionId: ses.id,
                          userName: "Teacher",
                        });
                        api.get(`/cohorts/${selectedCohortId}/sessions/${ses.id}/class-info`)
                          .then((r) => {
                            if (r.data.room_code) params.set("roomCode", r.data.room_code);
                            window.open(`/teacher/live-class?${params.toString()}`, "_blank");
                          })
                          .catch(() => window.open(`/teacher/live-class?${params.toString()}`, "_blank"));
                      }}
                      style={{ width: "100%", padding: "7px 0", fontSize: 11, backgroundColor: "#22c55e" }}
                    >
                      <Video size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      Rejoin
                    </button>
                    <button
                      className={s.goLiveBtn}
                      onClick={async () => {
                        setEndingClassId(ses.id);
                        try {
                          endSession.mutate(ses.id);
                          await api.post(`/cohorts/${selectedCohortId}/sessions/${ses.id}/end-class`).catch(() => { });
                          refetchSessions();
                        } finally {
                          setEndingClassId(null);
                        }
                      }}
                      disabled={endingClassId === ses.id}
                      style={{ width: "100%", padding: "7px 0", fontSize: 11, backgroundColor: "#ef4444" }}
                    >
                      <Square size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      {endingClassId === ses.id ? "Ending..." : "End Class"}
                    </button>
                  </div>
                ) : (
                  <button
                    className={s.goLiveBtn}
                    onClick={() => handleGoLive(ses.id)}
                    disabled={!canStart || goingLiveId === ses.id}
                    style={{
                      width: "100%", padding: "8px 0", fontSize: 12,
                      ...(isFuture || !canStart ? { backgroundColor: "#9ca3af", cursor: "not-allowed", opacity: 0.5 } : {}),
                      ...(isNext && canStart ? { backgroundColor: "#22c55e" } : {}),
                    }}
                  >
                    <Video size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {goingLiveId === ses.id ? "Starting..." : "Go Live"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Student list — columns */}
      <div className={s.sectionTitle}>
        <Users size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
        Students ({students?.length ?? 0})
      </div>
      {students && students.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 8,
        }}>
          {students.map((st, i) => (
            <div
              key={st.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12,
                background: "var(--color-surface-card, #fff)",
                border: "1px solid var(--color-border-subtle, #e5e7eb)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 11,
              }}>
                {getInitials(st.name)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {st.name ?? "Unknown"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={s.emptyState}>No students enrolled in this cohort yet.</div>
      )}
    </div>
  );
}
