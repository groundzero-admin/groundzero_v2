import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import { useActivity } from "@/api/hooks/useActivities";
import { useNextQuestions } from "@/api/hooks/useNextQuestions";
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
  const states = studentState?.states ?? [];

  // Session-driven flow: find active session for student's cohort
  const { data: session, isLoading: loadingSession } = useActiveSession(student?.cohort_id);
  const { data: activity, isLoading: loadingActivity } = useActivity(session?.current_activity_id);

  // Derive competency IDs from the session's activity
  const sessionCompetencyIds = (activity?.primary_competencies ?? []).map(
    (pc) => pc.competency_id
  );
  const [activeCompIdx, setActiveCompIdx] = useState(0);
  const competencyId = sessionCompetencyIds[activeCompIdx] ?? null;
  const competencyState = states.find((st) => st.competency_id === competencyId) ?? null;

  // Reset competency index when activity changes
  useEffect(() => {
    setActiveCompIdx(0);
  }, [activity?.id]);

  // Questions for current competency
  const {
    data: questions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useNextQuestions(studentId, competencyId, { count: 5 });

  // Answer state
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Trigger SPARK when student selects "Lost" (before submitting)
  useEffect(() => {
    if (confidence !== "lost" || submitted || !studentId || !competencyId) return;
    const question = questions[currentIndex];
    if (!question || sparkTrigger) return;

    setSparkTrigger({
      studentId,
      questionId: question.id,
      trigger: "low_confidence",
      competencyId,
      selectedOption: selectedOption ?? undefined,
      confidenceReport: "lost",
    });
  }, [confidence, submitted, studentId, competencyId, questions, currentIndex, selectedOption, sparkTrigger]);

  // Trigger SPARK after 30s of no answer
  useEffect(() => {
    if (submitted || !studentId || !competencyId) return;
    const question = questions[currentIndex];
    if (!question) return;

    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);

    stuckTimerRef.current = setTimeout(() => {
      if (!sparkTrigger) {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: "hint_request",
          competencyId,
          selectedOption: selectedOption ?? undefined,
        });
      }
    }, 30_000);

    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [studentId, competencyId, questions, currentIndex, submitted, sparkTrigger, selectedOption]);

  // Submit mutation
  const { mutateAsync: submitEvidence, isPending: submitting } =
    useSubmitEvidence(studentId);

  // Reset question state when competency changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    questionShownAt.current = Date.now();
  }, [competencyId]);

  const handleSubmit = useCallback(async () => {
    if (!studentId || !competencyId || !selectedOption) return;

    const question = questions[currentIndex];
    if (!question) return;

    const correctLabel =
      question.options?.find((o) => o.is_correct)?.label ?? null;
    const isCorrect = selectedOption === correctLabel;
    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: competencyId,
      outcome: isCorrect ? 1.0 : 0.0,
      source: "mcq",
      module_id: question.module_id,
      session_id: session?.id,
      response_time_ms: responseTimeMs,
      confidence_report: confidence ?? undefined,
      ai_interaction: aiInteraction,
    };

    try {
      const result = await submitEvidence(evidence);
      setSubmitted(true);
      if (result.updates.length > 0) {
        setToastUpdates(result.updates);
      }

      // Trigger SPARK on wrong answer or low confidence
      if (!isCorrect || confidence === "lost") {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: !isCorrect ? "wrong_answer" : "low_confidence",
          competencyId,
          selectedOption,
          confidenceReport: confidence ?? undefined,
        });
      }
    } catch {
      // Mutation error handled by TanStack Query
    }
  }, [
    studentId,
    competencyId,
    selectedOption,
    questions,
    currentIndex,
    confidence,
    session?.id,
    submitEvidence,
    aiInteraction,
  ]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      refetchQuestions();
      setCurrentIndex(0);
    }
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    questionShownAt.current = Date.now();
  }, [currentIndex, questions.length, refetchQuestions]);

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
            questionActive={!!questions[currentIndex] && !submitted}
          />
        </div>

        <div className={s.rightCol}>
          <ActivityPanel
            session={session ?? null}
            activity={activity ?? null}
            activityLoading={loadingActivity}
            competencyIds={sessionCompetencyIds}
            activeCompIdx={activeCompIdx}
            onCompetencySwitch={setActiveCompIdx}
            competencyState={competencyState}
            questions={questions}
            questionsLoading={questionsLoading}
            currentIndex={currentIndex}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            submitted={submitted}
            onSubmit={handleSubmit}
            onNext={handleNext}
            submitting={submitting}
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
