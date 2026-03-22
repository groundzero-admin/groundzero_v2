import { BookOpen, Loader2, Radio, Clock } from "lucide-react";
import type { Session, Activity } from "@/api/types";
import type { NextActivityQuestion } from "@/api/hooks/useNextActivityQuestion";
import { Button, Card } from "@/components/ui";
import { QuestionRenderer } from "@gz/question-widgets";
import * as s from "./ActivityPanel.css";

interface ActivityPanelProps {
  session: Session | null;
  activity: Activity | null;
  activityLoading: boolean;
  activityQuestion: NextActivityQuestion | null;
  questionsLoading: boolean;
  submitted: boolean;
  isCorrect: boolean | null;
  resetKey?: number;
  onAnswer: (answer: unknown) => void;
  onTryAgain: () => void;
  onNext: () => void;
  submitting: boolean;
  timeLeft?: number | null;
  totalAnswered?: number;
  correctCount?: number;
  /** Label for the top badge (default: Live Activity). */
  panelLabel?: string;
}

export function ActivityPanel({
  session,
  activity,
  activityLoading,
  activityQuestion,
  questionsLoading,
  submitted,
  isCorrect,
  resetKey,
  onAnswer,
  onTryAgain,
  onNext,
  submitting,
  timeLeft,
  totalAnswered = 0,
  correctCount = 0,
  panelLabel = "Live Activity",
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

  return (
    <Card elevation="low" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className={s.root}>
        {/* Session header */}
        <div className={s.header}>
          <span className={s.moduleBadge}>
            <BookOpen size={12} />
            {panelLabel}
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
                got {correctCount} correct.
                Great effort!
              </div>
            </div>
          </div>
        ) : (
          <div className={s.questionArea}>
            {questionsLoading ? (
              <div className={s.emptyState}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                <div className={s.emptyText}>Loading questions...</div>
              </div>
            ) : !activityQuestion ? (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>
                  <BookOpen size={24} />
                </div>
                <div className={s.emptyTitle}>All caught up!</div>
                <div className={s.emptyText}>
                  No more questions for this skill right now. Great work!
                </div>
              </div>
            ) : (
              <QuestionRenderer
                key={activityQuestion.activity_question_id}
                slug={activityQuestion.template_slug}
                data={activityQuestion.data}
                onAnswer={onAnswer}
                resetKey={resetKey}
              />
            )}

            {/* Hint on wrong answer */}
            {submitted && isCorrect === false && (() => {
              const hint = typeof activityQuestion?.data?.hint === "string" ? activityQuestion.data.hint : null;
              if (!hint) return null;
              return (
                <div style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  background: "rgba(251,191,36,0.1)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.2)",
                  lineHeight: 1.5,
                }}>
                  💡 {hint}
                </div>
              );
            })()}
          </div>
        )}

        {activityQuestion && !timerExpired && submitted && (
          <div className={s.actions}>
            {isCorrect === false && (
              <Button
                variant="secondary"
                size="md"
                onClick={onTryAgain}
                style={{ flex: 1 }}
                disabled={submitting}
              >
                Try Again
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={onNext}
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "Next Question"
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
