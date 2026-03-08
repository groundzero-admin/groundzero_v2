import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import { useActivity } from "@/api/hooks/useActivities";
import { useSessionActivities } from "@/api/hooks/useTeacher";
import { useSessionScore } from "@/api/hooks/useSessionScore";
import { useNextQuestion } from "@/api/hooks/useNextQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import type { BKTUpdate, EvidenceCreate } from "@/api/types";
import type { SparkTriggerData } from "@/components/live/AICompanionShell";
import { AICompanionShell } from "@/components/live/AICompanionShell";
import { VideoArea } from "@/components/live/VideoArea";
import { ActivityPanel } from "@/components/live/ActivityPanel";
import { BKTUpdateToast } from "@/components/live/BKTUpdateToast";
import * as s from "./LivePage.css";

export default function LivePage() {
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
  const student = studentState?.student ?? null;

  // Session-driven flow: find active session for student's cohort
  const { data: session, isLoading: loadingSession } = useActiveSession(student?.cohort_id);
  const { data: activity, isLoading: loadingActivity } = useActivity(session?.current_activity_id);
  const { data: sessionActivities } = useSessionActivities(session?.id);

  const isTimedMcq = activity?.mode === "timed_mcq";

  // Find the active SessionActivity to get server-side launched_at
  const activeSessionActivity = useMemo(
    () => sessionActivities?.find((sa) => sa.activity_id === session?.current_activity_id && sa.status === "active"),
    [sessionActivities, session?.current_activity_id],
  );

  // Backend picks the best competency + question for this activity
  const {
    data: nextQ,
    isLoading: questionLoading,
    refetch: refetchQuestion,
  } = useNextQuestion(studentId, activity?.id ?? null);

  const question = nextQ?.question ?? null;

  // Answer state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"got_it" | "kinda" | "lost" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const questionShownAt = useRef<number>(Date.now());

  // BKT toast
  const [toastUpdates, setToastUpdates] = useState<BKTUpdate[] | null>(null);

  // SPARK AI Companion
  const [sparkTrigger, setSparkTrigger] = useState<SparkTriggerData | null>(null);
  const [aiInteraction, setAiInteraction] = useState<"none" | "hint" | "conversation">("none");
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stateful countdown timer — derived from server launched_at ──
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate time remaining from server's launched_at + duration
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isTimedMcq || !activity?.duration_minutes || !activeSessionActivity?.launched_at) {
      setTimeLeft(null);
      return;
    }

    const raw = activeSessionActivity.launched_at;
    const launchedAt = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
    const durationMs = activity.duration_minutes * 60 * 1000;
    const endTime = launchedAt + durationMs;

    const calcRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    setTimeLeft(calcRemaining());

    timerRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimedMcq, activity?.duration_minutes, activeSessionActivity?.launched_at]);

  // ── Stateful score tracking — seeded from server, incremented locally ──
  const { data: serverScore } = useSessionScore(studentId, session?.id);
  const [localScoreDelta, setLocalScoreDelta] = useState({ total: 0, correct: 0 });
  const lastActivityRef = useRef<string | null>(null);

  // Reset local delta when activity changes
  useEffect(() => {
    if (activity?.id && activity.id !== lastActivityRef.current) {
      setLocalScoreDelta({ total: 0, correct: 0 });
      lastActivityRef.current = activity.id;
    }
  }, [activity?.id]);

  const totalAnswered = (serverScore?.total ?? 0) + localScoreDelta.total;
  const correctCount = (serverScore?.correct ?? 0) + localScoreDelta.correct;

  // Trigger SPARK when student selects "Lost" (before submitting)
  useEffect(() => {
    if (confidence !== "lost" || submitted || !studentId || !nextQ) return;
    if (!question || sparkTrigger) return;

    setSparkTrigger({
      studentId,
      questionId: question.id,
      trigger: "low_confidence",
      competencyId: nextQ.competency_id,
      selectedOption: selectedOption ?? undefined,
      confidenceReport: "lost",
    });
  }, [confidence, submitted, studentId, nextQ, question, selectedOption, sparkTrigger]);

  // Trigger SPARK after 30s of no answer
  useEffect(() => {
    if (submitted || !studentId || !nextQ || !question) return;

    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);

    stuckTimerRef.current = setTimeout(() => {
      if (!sparkTrigger) {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: "hint_request",
          competencyId: nextQ.competency_id,
          selectedOption: selectedOption ?? undefined,
        });
      }
    }, 30_000);

    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [studentId, nextQ, question, submitted, sparkTrigger, selectedOption]);

  // Submit mutation
  const { mutateAsync: submitEvidence, isPending: submitting } =
    useSubmitEvidence(studentId);

  // Reset question state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    questionShownAt.current = Date.now();
  }, [nextQ?.question?.id]);

  const handleSubmit = useCallback(async () => {
    if (!studentId || !selectedOption || !question || !nextQ) return;

    const correctLabel =
      question.options?.find((o) => o.is_correct)?.label ?? null;
    const isCorrect = selectedOption === correctLabel;
    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: nextQ.competency_id,
      outcome: isCorrect ? 1.0 : 0.0,
      source: "mcq",
      question_id: question.id,
      module_id: question.module_id,
      session_id: session?.id,
      response_time_ms: responseTimeMs,
      confidence_report: confidence ?? undefined,
      ai_interaction: aiInteraction,
    };

    try {
      const result = await submitEvidence(evidence);
      setSubmitted(true);
      setLocalScoreDelta((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      }));
      if (result.updates.length > 0) {
        setToastUpdates(result.updates);
      }

      // Trigger SPARK on wrong answer or low confidence
      if (!isCorrect || confidence === "lost") {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: !isCorrect ? "wrong_answer" : "low_confidence",
          competencyId: nextQ.competency_id,
          selectedOption,
          confidenceReport: confidence ?? undefined,
        });
      }
    } catch {
      // Mutation error handled by TanStack Query
    }
  }, [studentId, selectedOption, question, nextQ, confidence, session?.id, submitEvidence, aiInteraction]);

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

  const dismissToast = useCallback(() => setToastUpdates(null), []);

  // Loading state
  if (loadingState || loadingSession) {
    return (
      <div className={s.page} style={{ justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--text-tertiary)" }} />
      </div>
    );
  }

  return (
    <>
      <div className={s.page}>
        <div className={s.leftCol}>
          <VideoArea
            facilitatorName={undefined}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            questionActive={!!question && !submitted}
          />
        </div>

        <div className={s.rightCol}>
          <ActivityPanel
            session={session ?? null}
            activity={activity ?? null}
            activityLoading={loadingActivity}
            question={question}
            questionsLoading={questionLoading}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            submitted={submitted}
            onSubmit={handleSubmit}
            onNext={handleNext}
            submitting={submitting}
            timeLeft={isTimedMcq ? timeLeft : undefined}
            totalAnswered={totalAnswered}
            correctCount={correctCount}
          />
        </div>
      </div>

      <AICompanionShell
        triggerData={sparkTrigger}
        onEvidenceSubmitted={() => setAiInteraction("conversation")}
        onConversationEnd={() => {}}
      />

      {toastUpdates && (
        <BKTUpdateToast updates={toastUpdates} onDone={dismissToast} />
      )}
    </>
  );
}
