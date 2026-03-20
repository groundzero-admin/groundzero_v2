import { BookOpen, Loader2, Radio, Clock } from "lucide-react";
import type { Question, Session, Activity } from "@/api/types";
import { Button, Card } from "@/components/ui";
import { QuestionRenderer } from "@/components/questions";
import { MCQQuestion } from "../MCQQuestion";
import * as s from "./ActivityPanel.css";

interface ActivityPanelProps {
  session: Session | null;
  activity: Activity | null;
  activityLoading: boolean;
  question: Question | null;
  questionsLoading: boolean;
  questionIndex?: number;
  totalQuestions?: number;
  attemptedResult?: boolean | null;
  allAttempted?: boolean;
  onRestartReview?: () => void;
  selectedOptions: string[];
  onSelectOption: (label: string) => void;
  onWidgetAnswer?: (answer: unknown) => void;
  widgetAnswered?: boolean;
  submitted: boolean;
  onSubmit: () => void;
  onPrev?: () => void;
  onNext: () => void;
  submitting: boolean;
  timeLeft?: number | null;
  totalAnswered?: number;
  correctCount?: number;
}

export function ActivityPanel({
  session,
  activity,
  activityLoading,
  question,
  questionsLoading,
  questionIndex = 0,
  totalQuestions = 1,
  attemptedResult = null,
  allAttempted = false,
  onRestartReview,
  selectedOptions,
  onSelectOption,
  onWidgetAnswer,
  widgetAnswered = false,
  submitted,
  onSubmit,
  onPrev,
  onNext,
  submitting,
  timeLeft,
  totalAnswered = 0,
  correctCount = 0,
}: ActivityPanelProps) {
  const timerExpired = timeLeft !== null && timeLeft !== undefined && timeLeft <= 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const sec = Math.max(0, secs) % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <Card elevation="low" style={{ height: "100%" }}>
        <div className={s.root}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <Radio size={24} />
            </div>
            <div className={s.emptyTitle}>No active session</div>
            <div className={s.emptyText}>
              Waiting for your facilitator to start a live session.
              You'll see questions here once the session begins.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const isWidgetQuestion = !!question?.template_slug && !String(question.template_slug).startsWith("mcq_");
  const allowMultipleMcq =
    !!question &&
    (
      (Array.isArray(question.options) && question.options.filter((o) => o.is_correct).length > 1) ||
      !!(question.data && typeof question.data === "object" && (question.data as Record<string, unknown>).multiple)
    );
  const canGoNext = submitted || attemptedResult !== null;

  return (
    <Card elevation="low" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className={s.root}>
        {/* Session header */}
        <div className={s.header}>
          <span className={s.moduleBadge}>
            <BookOpen size={12} />
            Live Activity
          </span>
          {timeLeft != null ? (
            <span className={s.durationTag} style={timeLeft <= 60 ? { color: "#ef4444", fontWeight: 600 } : undefined}>
              <Clock size={10} />
              {formatTime(timeLeft)}
            </span>
          ) : activity?.duration_minutes ? (
            <span className={s.durationTag}>
              <Clock size={10} />
              {activity.duration_minutes} min
            </span>
          ) : null}
        </div>

        {/* Activity name */}
        {activityLoading ? (
          <div className={s.activityTitle} style={{ opacity: 0.4 }}>
            Loading activity...
          </div>
        ) : activity ? (
          <>
            <div className={s.activityTitle}>{activity.name}</div>
            {activity.description && (
              <div className={s.activityDesc}>{activity.description}</div>
            )}
          </>
        ) : null}

        {totalAnswered > 0 && (
          <div className={s.progressMini} style={{ gap: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>{totalAnswered} answered</span>
            <span>{correctCount} correct</span>
            <span>{Math.round((correctCount / totalAnswered) * 100)}% accuracy</span>
          </div>
        )}

        <div className={s.divider} />

        {/* Time's up */}
        {timerExpired ? (
          <div className={s.questionArea}>
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>
                <Clock size={24} />
              </div>
              <div className={s.emptyTitle}>Time's up!</div>
              <div className={s.emptyText}>
                You answered {totalAnswered} question{totalAnswered !== 1 ? "s" : ""} and
                got {correctCount} correct ({totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%).
                Great effort!
              </div>
            </div>
          </div>
        ) : (
          /* Question area */
          <div className={s.questionArea}>
            {questionsLoading ? (
              <div className={s.emptyState}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                <div className={s.emptyText}>Loading questions...</div>
              </div>
            ) : !question ? (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>
                  <BookOpen size={24} />
                </div>
                <div className={s.emptyTitle}>{allAttempted ? "You attempted all questions" : "All caught up!"}</div>
                <div className={s.emptyText}>
                  {allAttempted
                    ? "Review what you did and re-attempt any question."
                    : "No more questions for this skill right now. Great work!"}
                </div>
                {allAttempted && onRestartReview && (
                  <Button variant="primary" size="md" onClick={onRestartReview} style={{ marginTop: 10 }}>
                    Review From First Question
                  </Button>
                )}
              </div>
            ) : (
              <>
                {attemptedResult !== null && (
                  <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: attemptedResult ? "#059669" : "#dc2626" }}>
                    Previous attempt: {attemptedResult ? "Correct" : "Incorrect"} (you can re-attempt)
                  </div>
                )}
                {isWidgetQuestion ? (
                  <QuestionRenderer
                    slug={String(question.template_slug)}
                    data={question.data ?? {}}
                    onAnswer={onWidgetAnswer}
                  />
                ) : (
                  <MCQQuestion
                    question={question}
                    questionIndex={questionIndex}
                    totalQuestions={Math.max(1, totalQuestions)}
                    selectedOptions={selectedOptions}
                    onSelectOption={onSelectOption}
                    submitted={submitted}
                    allowMultiple={allowMultipleMcq}
                  />
                )}
              </>
            )}
          </div>
        )}

        {question && !timerExpired && (
          <div className={s.actions}>
            <Button
              variant="ghost"
              size="md"
              onClick={onPrev}
              disabled={!onPrev || questionIndex <= 0}
              style={{ flex: 1 }}
            >
              Previous
            </Button>
            {!canGoNext ? (
              isWidgetQuestion ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                  {widgetAnswered ? "Answer saved automatically" : "Complete all inputs to auto-save"}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onSubmit}
                  disabled={selectedOptions.length === 0 || submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              )
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onNext}
                style={{ flex: 1 }}
              >
                Next Question
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
