import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Calendar, Clock, Play, BookOpen } from "lucide-react";
import { useSessionReview, useStudentSessionView } from "@/api/hooks/useSessionReview";
import { useActivity } from "@/api/hooks/useActivities";
import { useNextActivityQuestion } from "@/api/hooks/useNextActivityQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { useSessionScore } from "@/api/hooks/useSessionScore";
import { useStudent } from "@/context/StudentContext";
import { RecordingPlayer } from "@/components/dashboard/RecordingPlayer";
import { ActivityPanel } from "@/components/live/ActivityPanel";
import type { Session } from "@/api/types";
import type { EvidenceCreate } from "@/api/types";
import * as s from "./SessionReviewPage.css";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString(undefined, { timeStyle: "short" })}`;
}

export default function SessionReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { studentId, isLoading: loadingStudent } = useStudent();

  const { data, isLoading: loadingReview, error } = useSessionReview(sessionId);
  const { data: sessionView, isLoading: loadingView, error: viewError } = useStudentSessionView(sessionId);

  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
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

  const { data: serverScore } = useSessionScore(studentId, sessionId);
  const [localScoreDelta, setLocalScoreDelta] = useState({ total: 0, correct: 0 });
  const lastActivityRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeActivityId && activeActivityId !== lastActivityRef.current) {
      setLocalScoreDelta({ total: 0, correct: 0 });
      lastActivityRef.current = activeActivityId;
    }
  }, [activeActivityId]);

  const totalAnswered = (serverScore?.total ?? 0) + localScoreDelta.total;
  const correctCount = (serverScore?.correct ?? 0) + localScoreDelta.correct;

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
      if (!studentId || !activityQuestion || submitted || !sessionId) return;

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
        setLocalScoreDelta((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (correct ? 1 : 0),
        }));
        queryClient.invalidateQueries({ queryKey: ["session-score", studentId, sessionId] });
      } catch {
        /* TanStack Query surfaces errors */
      }
    },
    [studentId, activityQuestion, submitted, sessionId, submitEvidence, queryClient],
  );

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

  const handleTryAgain = useCallback(() => {
    setSubmitted(false);
    setIsCorrect(null);
    setAttemptKey((k) => k + 1);
  }, []);

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
  const hasRecording = !!data.recording_playback_url;
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
          </div>
        </div>
      </header>

      <div className={s.mainGrid}>
        <div className={s.leftCol}>
          <div className={s.playerWrap}>
            {hasRecording ? (
              <RecordingPlayer src={data.recording_playback_url!} className={s.video} />
            ) : (
              <div className={s.noVideo}>
                <p className={s.noVideoTitle}>Recording not available</p>
                <p className={s.noVideoHint}>
                  {data.recording_status === "error"
                    ? "We couldn’t load the recording right now. Try again later."
                    : "There is no recording for this session yet."}
                </p>
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
              onAnswer={handleAnswer}
              onTryAgain={handleTryAgain}
              onNext={handleNext}
              submitting={submitting}
              timeLeft={null}
              totalAnswered={totalAnswered}
              correctCount={correctCount}
              panelLabel="Session review"
            />
          )}
        </aside>
      </div>
    </div>
  );
}
