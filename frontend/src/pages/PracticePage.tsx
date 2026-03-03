import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useNextQuestions } from "@/api/hooks/useNextQuestions";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { useCompetencies, type CompetencyInfo } from "@/api/hooks/useCompetencies";
import { useTopic } from "@/api/hooks/useTopics";
import type { BKTUpdate, EvidenceCreate } from "@/api/types";
import { Card, Button, ProgressBar, Badge } from "@/components/ui";
import { MCQQuestion } from "@/components/live/MCQQuestion";
import { ConfidenceChips } from "@/components/live/ConfidenceChips";
import { BKTUpdateToast } from "@/components/live/BKTUpdateToast";
import { AICompanionShell, type SparkTriggerData } from "@/components/live/AICompanionShell";
import { competencyToPillarId } from "@/lib/pillar-helpers";
import { PILLAR_COLORS } from "@/lib/constants";
import * as s from "./PracticePage.css";

export default function PracticePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const competencyId = params.get("competency");
  const topicId = params.get("topic");

  const { studentId } = useStudent();
  const { data: studentState } = useStudentState(studentId);
  const { data: allCompetencies } = useCompetencies();
  const { data: topicDetail, isLoading: topicLoading } = useTopic(topicId);
  const states = studentState?.states ?? [];

  // In topic mode, cycle through mapped competencies
  const topicCompetencies = useMemo(() => {
    if (!topicDetail) return [];
    return topicDetail.competencies
      .sort((a, b) => b.relevance - a.relevance)
      .map((tc) => tc.competency_id);
  }, [topicDetail]);

  const [topicCompIdx, setTopicCompIdx] = useState(0);

  // The active competency: either from query param or from topic rotation
  const activeCompetencyId = topicId
    ? topicCompetencies[topicCompIdx % topicCompetencies.length] ?? null
    : competencyId;

  const compState = states.find((st) => st.competency_id === activeCompetencyId) ?? null;
  const compInfo = allCompetencies?.find((c: CompetencyInfo) => c.id === activeCompetencyId) ?? null;
  const pillarId = activeCompetencyId ? competencyToPillarId(activeCompetencyId) : null;
  const pillarColor = pillarId ? PILLAR_COLORS[pillarId] ?? "#805AD5" : "#805AD5";

  // Questions
  const {
    data: questions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useNextQuestions(studentId, activeCompetencyId, { count: 5 });

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
    if (confidence !== "lost" || submitted || !studentId || !activeCompetencyId) return;
    const question = questions[currentIndex];
    if (!question || sparkTrigger) return;

    setSparkTrigger({
      studentId,
      questionId: question.id,
      trigger: "low_confidence",
      competencyId: activeCompetencyId,
      selectedOption: selectedOption ?? undefined,
      confidenceReport: "lost",
    });
  }, [confidence, submitted, studentId, activeCompetencyId, questions, currentIndex, selectedOption, sparkTrigger]);

  // Trigger SPARK after 30s of no answer
  useEffect(() => {
    if (submitted || !studentId || !activeCompetencyId) return;
    const question = questions[currentIndex];
    if (!question) return;

    // Clear any existing timer
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);

    stuckTimerRef.current = setTimeout(() => {
      if (!sparkTrigger) {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: "hint_request",
          competencyId: activeCompetencyId,
          selectedOption: selectedOption ?? undefined,
        });
      }
    }, 30_000);

    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [studentId, activeCompetencyId, questions, currentIndex, submitted, sparkTrigger, selectedOption]);

  // Submit mutation
  const { mutateAsync: submitEvidence, isPending: submitting } =
    useSubmitEvidence(studentId);

  // Reset when competency changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    questionShownAt.current = Date.now();
  }, [activeCompetencyId]);

  const handleSubmit = useCallback(async () => {
    if (!studentId || !activeCompetencyId || !selectedOption) return;

    const question = questions[currentIndex];
    if (!question) return;

    const correctLabel =
      question.options?.find((o) => o.is_correct)?.label ?? null;
    const isCorrect = selectedOption === correctLabel;
    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: activeCompetencyId,
      outcome: isCorrect ? 1.0 : 0.0,
      source: "mcq",
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

      // Trigger SPARK on wrong answer or low confidence
      if (!isCorrect || confidence === "lost") {
        setSparkTrigger({
          studentId,
          questionId: question.id,
          trigger: !isCorrect ? "wrong_answer" : "low_confidence",
          competencyId: activeCompetencyId,
          selectedOption: selectedOption,
          confidenceReport: confidence ?? undefined,
        });
      }
    } catch {
      // handled by TanStack Query
    }
  }, [studentId, activeCompetencyId, selectedOption, confidence, questions, currentIndex, submitEvidence, aiInteraction]);

  const resetForNextQuestion = useCallback(() => {
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    questionShownAt.current = Date.now();
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetForNextQuestion();
    } else if (topicId && topicCompetencies.length > 1) {
      // In topic mode, rotate to next competency
      setTopicCompIdx((i) => i + 1);
    } else {
      refetchQuestions();
      setCurrentIndex(0);
      resetForNextQuestion();
    }
  }, [currentIndex, questions.length, refetchQuestions, topicId, topicCompetencies.length, resetForNextQuestion]);

  const dismissToast = useCallback(() => setToastUpdates(null), []);

  // No mode selected
  if (!competencyId && !topicId) {
    return (
      <div className={s.page}>
        <div className={s.loading}>No competency or topic selected.</div>
      </div>
    );
  }

  // Loading topic detail
  if (topicId && topicLoading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  // Topic loaded but no competencies mapped
  if (topicId && topicCompetencies.length === 0) {
    return (
      <div className={s.page}>
        <button className={s.backLink} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className={s.loading}>
          No competencies mapped to this topic yet.
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex] ?? null;
  const hasMore = currentIndex < questions.length - 1;

  return (
    <div className={s.page}>
      <button className={s.backLink} onClick={() => navigate("/dashboard")}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className={s.header}>
        {topicDetail ? (
          <>
            <div className={s.title}>
              <BookOpen size={20} style={{ display: "inline", marginRight: "8px" }} />
              {topicDetail.topic.name}
            </div>
            <div className={s.subtitle}>
              {topicDetail.topic.board.toUpperCase()} Class {topicDetail.topic.grade}
              {" \u00B7 "}Chapter {topicDetail.topic.chapter_number}
            </div>
          </>
        ) : (
          <>
            <div className={s.title}>
              {compInfo?.name ?? activeCompetencyId}
            </div>
            {compInfo && (
              <div className={s.subtitle}>{compInfo.description}</div>
            )}
          </>
        )}
      </div>

      {compState && (
        <div className={s.progressRow}>
          {topicId && compInfo && (
            <Badge pillarColor={pillarColor} size="sm">
              {compInfo.name}
            </Badge>
          )}
          <span>{Math.round(compState.p_learned * 100)}%</span>
          <div style={{ flex: 1, maxWidth: "200px" }}>
            <ProgressBar
              value={Math.round(compState.p_learned * 100)}
              color={pillarColor}
              height="sm"
            />
          </div>
        </div>
      )}

      <Card elevation="low">
        <div style={{ padding: "8px 0" }}>
          {questionsLoading ? (
            <div className={s.loading}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : !currentQuestion ? (
            <div className={s.loading}>
              No questions available yet.
            </div>
          ) : (
            <MCQQuestion
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              submitted={submitted}
            />
          )}
        </div>
      </Card>

      {currentQuestion && selectedOption && !submitted && (
        <ConfidenceChips
          value={confidence}
          onChange={setConfidence}
          variant="light"
        />
      )}

      {currentQuestion && (
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
              {hasMore
                ? "Next Question"
                : topicId && topicCompetencies.length > 1
                  ? "Next Skill"
                  : "Load More"}
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
