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
            <div style={{ position: "relative", minHeight: "100%" }}>
              <div style={{ opacity: submitting ? 0.55 : 1, transition: "opacity 140ms ease", pointerEvents: submitting ? "none" : "auto" }}>
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

              {submitting && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "all",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 999,
                      padding: "8px 14px",
                      background: "rgba(15,23,42,0.72)",
                      color: "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 700,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    Checking answer
                    <span style={{ display: "inline-flex", gap: 3 }}>
                      <span style={{ width: 4, height: 4, borderRadius: 999, background: "#cbd5e1", animation: `${s.dotsPulse} 800ms infinite` }} />
                      <span style={{ width: 4, height: 4, borderRadius: 999, background: "#cbd5e1", animation: `${s.dotsPulse} 800ms 120ms infinite` }} />
                      <span style={{ width: 4, height: 4, borderRadius: 999, background: "#cbd5e1", animation: `${s.dotsPulse} 800ms 240ms infinite` }} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activityQuestion && !timerExpired && submitted && (
          <>
            <div style={{ minHeight: 48 }}>
            {isCorrect === true && (
              <div
                style={{
                  marginTop: 4,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.08))",
                  color: "#166534",
                  border: "1px solid rgba(34,197,94,0.35)",
                  fontWeight: 700,
                  fontSize: 13,
                  animation: `${s.softAppear} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  willChange: "transform, opacity",
                }}
              >
                Hurray! Great answer.
              </div>
            )}
            {isCorrect === false && (
              <div
                style={{
                  marginTop: 4,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.07))",
                  color: "#991b1b",
                  border: "1px solid rgba(239,68,68,0.35)",
                  fontWeight: 700,
                  fontSize: 13,
                  animation: `${s.softAppear} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  willChange: "transform, opacity",
                }}
              >
                Not quite right. Try again!
              </div>
            )}
            </div>

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
              {isCorrect === false && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onNext}
                  style={{ padding: "6px 10px", fontSize: 12, minWidth: 132, flex: "0 0 auto" }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    "Next Question"
                  )}
                </Button>
              )}
              {isCorrect === true && (
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
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
