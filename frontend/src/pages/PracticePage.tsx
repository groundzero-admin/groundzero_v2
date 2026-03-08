import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { useNextQuestion } from "@/api/hooks/useNextQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { useTopic } from "@/api/hooks/useTopics";
import type { BKTUpdate, EvidenceCreate } from "@/api/types";
import { Card, Button } from "@/components/ui";
import { MCQQuestion } from "@/components/live/MCQQuestion";
import { ConfidenceChips } from "@/components/live/ConfidenceChips";
import { BKTUpdateToast } from "@/components/live/BKTUpdateToast";
import { AICompanionShell, type SparkTriggerData } from "@/components/live/AICompanionShell";
import * as s from "./PracticePage.css";

export default function PracticePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topicId = params.get("topic");

  const { studentId } = useStudent();
  const { data: topicDetail, isLoading: topicLoading } = useTopic(topicId);

  // Backend picks the best competency + question for this topic
  const {
    data: nextQ,
    isLoading: questionLoading,
    refetch: refetchQuestion,
  } = useNextQuestion(studentId, null, topicId);

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

  // Reset when question changes
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

      if (!isCorrect || confidence === "lost") {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: !isCorrect ? "wrong_answer" : "low_confidence",
          competencyId: nextQ.competency_id,
          selectedOption: selectedOption,
          confidenceReport: confidence ?? undefined,
        });
      }
    } catch {
      // handled by TanStack Query
    }
  }, [studentId, selectedOption, confidence, question, nextQ, submitEvidence, aiInteraction]);

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

  const dismissToast = useCallback(() => setToastUpdates(null), []);

  // No topic selected
  if (!topicId) {
    return (
      <div className={s.page}>
        <div className={s.loading}>No topic selected.</div>
      </div>
    );
  }

  // Loading topic detail
  if (topicLoading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <button className={s.backLink} onClick={() => navigate("/dashboard")}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {topicDetail && (
        <div className={s.header}>
          <div className={s.title}>
            <BookOpen size={20} style={{ display: "inline", marginRight: "8px" }} />
            {topicDetail.topic.name}
          </div>
          <div className={s.subtitle}>
            {topicDetail.topic.board.toUpperCase()} Class {topicDetail.topic.grade}
            {" \u00B7 "}Chapter {topicDetail.topic.chapter_number}
          </div>
        </div>
      )}

      <Card elevation="low">
        <div style={{ padding: "8px 0" }}>
          {questionLoading ? (
            <div className={s.loading}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : !question ? (
            <div className={s.loading}>
              No questions available yet.
            </div>
          ) : (
            <MCQQuestion
              question={question}
              questionIndex={0}
              totalQuestions={1}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              submitted={submitted}
            />
          )}
        </div>
      </Card>

      {question && selectedOption && !submitted && (
        <ConfidenceChips
          value={confidence}
          onChange={setConfidence}
          variant="light"
        />
      )}

      {question && (
        <div style={{ display: "flex", gap: "8px" }}>
          {!submitted ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              style={{ flex: 1 }}
            >
              {submitting ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "Submit Answer"
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              style={{ flex: 1 }}
            >
              Next Question
            </Button>
          )}
        </div>
      )}

      {(sparkTrigger || submitted) && (
        <AICompanionShell
          triggerData={sparkTrigger}
          onEvidenceSubmitted={() => setAiInteraction("conversation")}
          onConversationEnd={() => {}}
        />
      )}

      {toastUpdates && (
        <BKTUpdateToast updates={toastUpdates} onDone={dismissToast} />
      )}
    </div>
  );
}
