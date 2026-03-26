import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Calendar, Clock, Play, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useSessionReview, useStudentSessionView } from "@/api/hooks/useSessionReview";
import { useQuery } from "@tanstack/react-query";
import { useActivity } from "@/api/hooks/useActivities";
import { useNextActivityQuestion } from "@/api/hooks/useNextActivityQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { useStudent } from "@/context/StudentContext";
import { RecordingPlayer } from "@/components/dashboard/RecordingPlayer";
import { ActivityPanel } from "@/components/live/ActivityPanel";
import type { Session } from "@/api/types";
import type { EvidenceCreate } from "@/api/types";
import * as s from "./SessionReviewPage.css";
import { api } from "@/api/client";

type RecordingAsset = {
  id: string;
  type: string;
  status: string;
  path?: string | null;
  url?: string | null;
};
type RecordingItem = {
  id: string;
  status: string;
  created_at?: string | null;
  started_at?: string | null;
  stopped_at?: string | null;
  assets: RecordingAsset[];
};
type RecordingDetail = {
  recordings: RecordingItem[];
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString(undefined, { timeStyle: "short" })}`;
}

function formatDuration(startIso: string | null | undefined, endIso: string | null | undefined): string {
  if (!startIso || !endIso) return "Duration unavailable";
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "Duration unavailable";
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function SessionReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { studentId, isLoading: loadingStudent } = useStudent();

  const { data, isLoading: loadingReview, error } = useSessionReview(sessionId);
  const { data: sessionView, isLoading: loadingView, error: viewError } = useStudentSessionView(sessionId);
  const { data: recordingDetail } = useQuery<RecordingDetail>({
    queryKey: ["student-class-recording-detail", sessionId],
    queryFn: () => api.get(`/class-recordings/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
    staleTime: 20_000,
  });

  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [selectedRecordingIdx, setSelectedRecordingIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [resetKey, setAttemptKey] = useState(0);
  const questionShownAt = useRef<number>(Date.now());

  const { data: activity, isLoading: loadingActivity } = useActivity(activeActivityId ?? undefined);
  const {
    data: activityQuestion,
    isLoading: questionLoading,
    refetch: refetchQuestion,
  } = useNextActivityQuestion(studentId, activeActivityId);

  const { mutateAsync: submitEvidence, isPending: submitting } = useSubmitEvidence(studentId);

  const sessionStub = useMemo((): Session | null => {
    if (!sessionId || !data) return null;
    return {
      id: sessionId,
      cohort_id: data.cohort_id || null,
      session_number: 0,
      current_activity_id: activeActivityId,
      teacher_id: null,
      started_at: data.started_at,
      ended_at: data.ended_at,
    };
  }, [sessionId, data, activeActivityId]);

  useEffect(() => {
    setSubmitted(false);
    setIsCorrect(null);
    setAttemptKey(0);
    questionShownAt.current = Date.now();
  }, [activityQuestion?.activity_question_id]);

  const handleAnswer = useCallback(
    async (answer: unknown) => {
      const maybeAnswer = (answer && typeof answer === "object" && !Array.isArray(answer))
        ? (answer as Record<string, unknown>)
        : null;
      const allowResubmit = maybeAnswer?.__allow_resubmit === true;
      if (!studentId || !activityQuestion || (!allowResubmit && submitted) || !sessionId) return;

      const responseTimeMs = Date.now() - questionShownAt.current;

      const evidence: EvidenceCreate = {
        student_id: studentId,
        competency_id: activityQuestion.competency_id,
        session_id: sessionId,
        response_time_ms: responseTimeMs,
        activity_question_id: activityQuestion.activity_question_id,
        response: answer as Record<string, unknown>,
      };

      try {
        const result = await submitEvidence(evidence);
        const correct = result.event.outcome >= 0.5;
        setSubmitted(true);
        setIsCorrect(correct);
      } catch {
        /* TanStack Query surfaces errors */
      }
    },
    [studentId, activityQuestion, submitted, sessionId, submitEvidence],
  );

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

  const handleTryAgain = useCallback(() => {
    setSubmitted(false);
    setIsCorrect(null);
    setAttemptKey((k) => k + 1);
  }, []);

  const recordings = recordingDetail?.recordings ?? [];
  const recordingRuns = useMemo(() => {
    return recordings.map((rec) => {
      const videoAssets = (rec.assets ?? []).filter(
        (a) => (a.type === "room-composite" || a.type === "room-vod") && a.url,
      );
      const preferredVideo = videoAssets.find((a) => !(a.path ?? "").toLowerCase().includes("rec-audio")) ?? videoAssets[0] ?? null;
      return { rec, preferredVideo };
    });
  }, [recordings]);
  useEffect(() => {
    if (!recordingRuns.length) {
      setSelectedRecordingIdx(0);
      return;
    }
    setSelectedRecordingIdx((prev) => Math.min(Math.max(prev, 0), recordingRuns.length - 1));
  }, [recordingRuns.length]);
  const selectedRun = recordingRuns[selectedRecordingIdx] ?? null;

  if (loadingStudent || loadingReview || !sessionId) {
    return (
      <div className={s.shell}>
        <div className={s.loading}>
          <Loader2 size={28} className={s.spin} />
          Loading session…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={s.shell}>
        <div className={s.errorBox}>
          <p>Couldn’t load this session review.</p>
          <button type="button" className={s.backBtn} onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} /> Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const title = data.title?.trim() || `Session ${data.order ?? ""}`;
  const activities = sessionView?.activities ?? [];

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <button type="button" className={s.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={s.headerMain}>
          <p className={s.cohort}>{data.cohort_name}</p>
          <h1 className={s.title}>{title}</h1>
          {data.description && <p className={s.desc}>{data.description}</p>}
          <div className={s.metaRow}>
            {data.scheduled_at && (
              <span className={s.meta}>
                <Calendar size={14} /> Scheduled: {formatWhen(data.scheduled_at)}
              </span>
            )}
            {data.ended_at && (
              <span className={s.meta}>
                <Clock size={14} /> Ended: {formatWhen(data.ended_at)}
              </span>
            )}
            {recordingRuns.length > 0 && (
              <span className={s.meta}>
                <Play size={14} /> Total class runs: {recordingRuns.length}
              </span>
            )}
            {selectedRun && (
              <>
                <span className={s.meta}>
                  <Calendar size={14} /> Run date: {formatWhen(selectedRun.rec.started_at ?? selectedRun.rec.stopped_at ?? selectedRun.rec.created_at ?? null)}
                </span>
                <span className={s.meta}>
                  <Clock size={14} /> {formatDuration(selectedRun.rec.started_at ?? null, selectedRun.rec.stopped_at ?? null)}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={s.mainGrid}>
        <div className={s.leftCol}>
          <div className={s.playerWrap}>
            {recordings.length === 0 ? (
              data.recording_playback_url ? (
                <RecordingPlayer src={data.recording_playback_url} className={s.video} />
              ) : (
                <div className={s.noVideo}>
                  <p className={s.noVideoTitle}>Recording not available</p>
                  <p className={s.noVideoHint}>
                    {data.recording_status === "error"
                      ? "We couldn’t load the recording right now. Try again later."
                      : "There is no recording for this session yet."}
                  </p>
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordingIdx((p) => Math.max(0, p - 1))}
                    disabled={selectedRecordingIdx <= 0}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      borderRadius: 10,
                      padding: "6px 10px",
                      cursor: selectedRecordingIdx <= 0 ? "not-allowed" : "pointer",
                      opacity: selectedRecordingIdx <= 0 ? 0.5 : 1,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>
                    Session: {selectedRecordingIdx + 1} of {recordingRuns.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordingIdx((p) => Math.min(recordingRuns.length - 1, p + 1))}
                    disabled={selectedRecordingIdx >= recordingRuns.length - 1}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      borderRadius: 10,
                      padding: "6px 10px",
                      cursor: selectedRecordingIdx >= recordingRuns.length - 1 ? "not-allowed" : "pointer",
                      opacity: selectedRecordingIdx >= recordingRuns.length - 1 ? 0.5 : 1,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
                {selectedRun?.preferredVideo ? (
                  <RecordingPlayer src={selectedRun.preferredVideo.url ?? ""} className={s.video} />
                ) : (
                  <div className={s.noVideo}>
                    <p className={s.noVideoTitle}>Video not available yet for this run.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <section className={s.activitySection}>
            <h2 className={s.activitySectionTitle}>Session activities</h2>
            {loadingView ? (
              <div className={s.activityLoading}>
                <Loader2 size={20} className={s.spin} />
                Loading activities…
              </div>
            ) : viewError ? (
              <p className={s.activityError}>Couldn’t load activities for this session.</p>
            ) : activities.length === 0 ? (
              <p className={s.activityEmpty}>No activities are linked to this session.</p>
            ) : (
              <ul className={s.activityList}>
                {activities.map((act) => {
                  const selected = activeActivityId === act.activity_id;
                  const qCount = act.questions.length;
                  return (
                    <li
                      key={act.session_activity_id}
                      className={`${s.activityCard} ${selected ? s.activityCardSelected : ""}`}
                    >
                      <div className={s.activityCardTop}>
                        <span className={s.activityOrder}>{act.order}</span>
                        <span className={s.activityQCount}>
                          <BookOpen size={11} /> {qCount} qs
                        </span>
                      </div>
                      <div className={s.activityName}>{act.name}</div>
                      {act.description && <div className={s.activityDesc}>{act.description}</div>}
                      <div className={s.activityActions}>
                        <button
                          type="button"
                          className={s.startBtn}
                          onClick={() => setActiveActivityId(act.activity_id)}
                        >
                          <Play size={12} />
                          {selected ? "Continue" : "Start"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className={s.rightCol}>
          {!studentId ? (
            <div className={s.rightPlaceholder}>
              <p>Sign in as a student to practice session questions.</p>
            </div>
          ) : !activeActivityId ? (
            <div className={s.rightPlaceholder}>
              <BookOpen size={32} className={s.rightPlaceholderIcon} />
              <p className={s.rightPlaceholderTitle}>Practice this session</p>
              <p className={s.rightPlaceholderHint}>
                Choose an activity under the recording and tap Start. Questions use the same experience as live class.
              </p>
            </div>
          ) : (
            <ActivityPanel
              session={sessionStub}
              activity={activity ?? null}
              activityLoading={loadingActivity}
              activityQuestion={activityQuestion ?? null}
              questionsLoading={questionLoading}
              submitted={submitted}
              isCorrect={isCorrect}
              resetKey={resetKey}
              studentId={studentId}
              onAnswer={handleAnswer}
              onTryAgain={handleTryAgain}
              onNext={handleNext}
              submitting={submitting}
              timeLeft={null}
              panelLabel="Session review"
            />
          )}
        </aside>
      </div>
    </div>
  );
}
