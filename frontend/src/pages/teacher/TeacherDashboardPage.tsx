import { useState } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import {
  useStartSession,
  useEndSession,
  useRestartSession,
  useUpcomingSessions,
  useCohortStudents,
} from "@/api/hooks/useTeacher";
import { api } from "@/api/client";
import { Users, Calendar, CheckCircle2, Video, Square, Eye, Clapperboard } from "lucide-react";
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
  const { refetch: refetchSessions } = useUpcomingSessions(selectedCohortId);
  const [goingLiveId, setGoingLiveId] = useState<string | null>(null);
  const [endingClassId, setEndingClassId] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);

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

  const previewUrl = (sessionId: string) =>
    `/teacher/session-preview?cohortId=${selectedCohortId}&sessionId=${sessionId}`;

  return (
    <div className={s.page}>
      <div className={s.sectionTitle}>Sessions</div>

      {!allSessions.length && (
        <div className={s.emptyState}>No sessions yet. Ask your admin to import templates for this cohort.</div>
      )}

      <div className={s.sessionGrid}>
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
              className={`${s.sessionTileTeacher} ${
                isDone ? s.sessionTileTeacherDone : isEnded ? s.sessionTileTeacherEnded : isLive || isNext ? s.sessionTileTeacherLive : ""
              }`}
              style={{
                background: isDone ? "var(--color-surface-page, #f8fafc)" : "var(--color-surface-card, #fff)",
              }}
            >
              <div className={s.sessionTileTitle}>
                {ses.title ?? `Session ${ses.session_number}`}
              </div>
              {ses.description && (
                <div className={s.sessionTileDesc}>{ses.description}</div>
              )}
              <div className={s.sessionTileMeta}>
                {ses.scheduled_at && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(ses.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}
                    {new Date(ses.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <span>{ses.activity_count} activities</span>
                <span>{ses.total_questions} questions</span>
              </div>
              <div className={s.sessionTileActions}>
                <button
                  type="button"
                  className={s.actionBtnPreviewBlue}
                  onClick={() => window.open(previewUrl(ses.id), "_blank")}
                >
                  <Eye size={14} />
                  Activity Preview
                </button>
                {isDone ? (
                  <>
                    <button
                      type="button"
                      className={s.actionBtnPreviewBlue}
                      onClick={() => window.open(`/teacher/sessions/${ses.id}/recordings`, "_blank")}
                    >
                      <Clapperboard size={14} /> Recording
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={14} /> Done
                    </span>
                  </>
                ) : isEnded ? (
                  <>
                    <button
                      type="button"
                      className={s.actionBtnPreviewBlue}
                      onClick={() => window.open(`/teacher/sessions/${ses.id}/recordings`, "_blank")}
                    >
                      <Clapperboard size={14} /> Recording
                    </button>
                    <button
                      type="button"
                      className={s.actionBtnWarning}
                      onClick={async () => {
                        setRestartingId(ses.id);
                        try {
                          await restartSession.mutateAsync(ses.id);
                          const startData = await api.post(`/cohorts/${selectedCohortId}/sessions/${ses.id}/start-class`).then((r) => r.data).catch(() => null);
                          const hostCode = startData?.room_code_host;
                          const params = new URLSearchParams({ cohortId: selectedCohortId!, sessionId: ses.id, userName: "Teacher" });
                          if (hostCode) params.set("roomCode", hostCode);
                          window.open(`/teacher/live-class?${params.toString()}`, "_blank");
                          refetchSessions();
                        } finally {
                          setRestartingId(null);
                        }
                      }}
                      disabled={restartingId === ses.id}
                    >
                      <Video size={14} /> {restartingId === ses.id ? "Starting…" : "Go Live"}
                    </button>
                  </>
                ) : isLive ? (
                  <>
                    <button
                      type="button"
                      className={s.actionBtnPrimary}
                      onClick={() => {
                        const params = new URLSearchParams({ cohortId: selectedCohortId!, sessionId: ses.id, userName: "Teacher" });
                        api.get(`/cohorts/${selectedCohortId}/sessions/${ses.id}/class-info`)
                          .then((r) => {
                            if (r.data.room_code) params.set("roomCode", r.data.room_code);
                            window.open(`/teacher/live-class?${params.toString()}`, "_blank");
                          })
                          .catch(() => window.open(`/teacher/live-class?${params.toString()}`, "_blank"));
                      }}
                    >
                      <Video size={14} /> Rejoin
                    </button>
                    <button
                      type="button"
                      className={s.actionBtnDanger}
                      onClick={async () => {
                        setEndingClassId(ses.id);
                        try {
                          endSession.mutate(ses.id);
                          await api.post(`/cohorts/${selectedCohortId}/sessions/${ses.id}/end-class`).catch(() => {});
                          refetchSessions();
                        } finally {
                          setEndingClassId(null);
                        }
                      }}
                      disabled={endingClassId === ses.id}
                    >
                      <Square size={14} /> {endingClassId === ses.id ? "Ending…" : "End Class"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={s.actionBtnPrimary}
                    onClick={() => handleGoLive(ses.id)}
                    disabled={!canStart || goingLiveId === ses.id}
                    style={isFuture || !canStart ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  >
                    <Video size={14} /> {goingLiveId === ses.id ? "Starting…" : "Go Live"}
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
