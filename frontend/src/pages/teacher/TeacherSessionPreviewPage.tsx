/**
 * Teacher Session Preview — full-page view of a session: activities + question-by-question preview.
 * Opens in new tab from Teacher Dashboard "Activity Preview". Supports launching activities (same as live class).
 */
import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  useTeacherSessionView,
  useLaunchActivity,
  usePauseActivity,
  useCohorts,
  useSessionActivities,
} from "@/api/hooks/useTeacher";
import { Calendar, ArrowLeft, Radio, Pause, Play, BookOpen, ChevronRight, ChevronLeft, FileText, ExternalLink } from "lucide-react";
import LivePreview from "@/pages/admin/LivePreview";
import * as s from "./TeacherSessionPreviewPage.css";

export default function TeacherSessionPreviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cohortId = searchParams.get("cohortId") ?? "";
  const sessionId = searchParams.get("sessionId") ?? "";

  const { data: cohorts } = useCohorts();
  const { data: sessionView, isLoading, error } = useTeacherSessionView(cohortId || undefined, sessionId || undefined);
  const { data: sessionActivities } = useSessionActivities(sessionId || undefined);
  const launchActivity = useLaunchActivity();
  const pauseActivity = usePauseActivity();

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [questionIdx, setQuestionIdx] = useState<number>(0);

  const selectedActivity = sessionView?.activities.find((a) => a.activity_id === selectedActivityId) ?? sessionView?.activities[0];
  const questions = selectedActivity?.questions ?? [];
  const previewQuestion = questions[questionIdx] ?? null;
  const cohort = useMemo(() => cohorts?.find((c) => c.id === cohortId) ?? null, [cohorts, cohortId]);

  if (!cohortId || !sessionId) {
    return (
      <div className={s.page}>
        <div className={s.emptyState}>
          <p>Missing cohort or session. Open Activity Preview from a session card on the Teacher dashboard.</p>
          <button type="button" className={s.backBtn} onClick={() => navigate("/teacher")}>
            <ArrowLeft size={16} /> Back to Teacher View
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.page}>
        <div className={s.emptyState}>
          <p>You don’t have access to this session or it wasn’t found.</p>
          <button type="button" className={s.backBtn} onClick={() => navigate("/teacher")}>
            <ArrowLeft size={16} /> Back to Teacher View
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !sessionView) {
    return (
      <div className={s.page}>
        <div className={s.loading}>Loading session…</div>
      </div>
    );
  }

  const session = sessionView.session;
  const canManageLive = !!session.is_live;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <button type="button" className={s.backBtn} onClick={() => navigate("/teacher")}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={s.headerContent}>
          <h1 className={s.sessionTitle}>
            {cohort?.name ? `${cohort.name} · ` : ""}
            {session.title ?? `Session ${session.session_number}`}
          </h1>
          {session.scheduled_at && (
            <div className={s.sessionMeta}>
              <Calendar size={14} />
              {new Date(session.scheduled_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
              {" · "}
              {new Date(session.scheduled_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
            </div>
          )}
          {(cohort?.description || session.description) && (
            <p className={s.sessionDesc}>
              {cohort?.description ? `${cohort.description} · ` : ""}
              {session.description ?? ""}
            </p>
          )}
        </div>
      </header>

      <div className={s.layout}>
        <aside className={s.activityList}>
          <h2 className={s.sidebarTitle}>Activities</h2>
          {sessionView.activities.map((act) => {
            const sa = sessionActivities?.find((s) => s.activity_id === act.activity_id);
            const status = sa?.status ?? "pending";
            const isActive = status === "active";
            const isPaused = status === "paused";
            const isSelected = selectedActivityId === act.activity_id || (!selectedActivityId && act === sessionView.activities[0]);
            return (
              <div
                key={act.activity_id}
                className={`${s.activityCard} ${isSelected ? s.activityCardSelected : ""}`}
                onClick={() => {
                  setSelectedActivityId(act.activity_id);
                  setQuestionIdx(0);
                }}
              >
                <div className={s.activityCardHeader}>
                  <span className={s.activityOrder}>{act.order}</span>
                  {isActive && <Radio size={14} className={s.liveIcon} />}
                  {isPaused && <Pause size={14} className={s.pauseIcon} />}
                </div>
                <div className={s.activityName}>{act.name}</div>
                {act.description && <div className={s.activityDesc}>{act.description}</div>}
                <div className={s.activityMeta}>
                  {act.questions.length} questions
                  {act.resources && act.resources.length > 0 && (
                    <> · <FileText size={12} style={{ verticalAlign: "middle" }} /> {act.resources.length} resources</>
                  )}
                </div>
                <div className={s.activityActions} onClick={(e) => e.stopPropagation()}>
                  {!act.questions.length ? null : (
                    <button
                      type="button"
                      className={s.viewQuestionsBtn}
                      onClick={() => {
                        setSelectedActivityId(act.activity_id);
                        setQuestionIdx(0);
                      }}
                    >
                      <BookOpen size={14} /> View questions
                    </button>
                  )}
                  {isActive ? (
                    <button
                      type="button"
                      className={s.launchBtnPause}
                      disabled={!canManageLive || pauseActivity.isPending}
                      title={!canManageLive ? "Start the session (Go Live) to launch/pause activities." : undefined}
                      onClick={() => pauseActivity.mutate(sessionId)}
                    >
                      <Pause size={14} /> Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={s.launchBtn}
                      disabled={!canManageLive || launchActivity.isPending}
                      title={!canManageLive ? "Start the session (Go Live) to launch/pause activities." : undefined}
                      onClick={() => launchActivity.mutate({ sessionId, activityId: act.activity_id })}
                    >
                      <Play size={14} /> {isPaused ? "Resume" : "Launch"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </aside>

        <main className={s.main}>
          {selectedActivity && (
            <>
              <div className={s.questionsSection}>
                <h3 className={s.questionsTitle}>Questions — {selectedActivity.name}</h3>
                {!questions.length ? (
                  <div className={s.noQuestions}>No questions in this activity.</div>
                ) : (
                  <div className={s.qNavRow}>
                    <button
                      type="button"
                      className={s.qNavBtn}
                      onClick={() => setQuestionIdx((i) => Math.max(0, i - 1))}
                      disabled={questionIdx <= 0}
                    >
                      <ChevronLeft size={18} /> Prev
                    </button>
                    <div className={s.qNavLabel}>
                      Q{questionIdx + 1} of {questions.length}
                    </div>
                    <button
                      type="button"
                      className={s.qNavBtn}
                      onClick={() => setQuestionIdx((i) => Math.min(questions.length - 1, i + 1))}
                      disabled={questionIdx >= questions.length - 1}
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
                <div className={s.previewSection}>
                {previewQuestion ? (
                  <div className={s.previewCard}>
                    <LivePreview slug={previewQuestion.template_slug ?? "mcq"} data={previewQuestion.data ?? {}} />
                  </div>
                ) : (
                  <div className={s.previewPlaceholder}>
                    <ChevronRight size={24} />
                    <p>Select an activity to preview its questions</p>
                  </div>
                )}
              </div>

              {selectedActivity.resources && selectedActivity.resources.length > 0 && (
                <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#334155" }}>Resources</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedActivity.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 8, background: "#fff",
                          border: "1px solid #e2e8f0", color: "#4f46e5",
                          fontSize: 13, fontWeight: 500, textDecoration: "none",
                        }}
                      >
                        {r.type === "file" ? <FileText size={16} /> : <ExternalLink size={16} />}
                        {r.name || r.label || r.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
