import { BookOpen, Loader2, Radio, Clock } from "lucide-react";
import type { Question, CompetencyState, Session, Activity } from "@/api/types";
import { Button, Card, ProgressBar } from "@/components/ui";
import { MCQQuestion } from "../MCQQuestion";
import * as s from "./ActivityPanel.css";

interface ActivityPanelProps {
  session: Session | null;
  activity: Activity | null;
  activityLoading: boolean;
  competencyIds: string[];
  activeCompIdx: number;
  onCompetencySwitch: (idx: number) => void;
  competencyState: CompetencyState | null;
  questions: Question[];
  questionsLoading: boolean;
  currentIndex: number;
  selectedOption: string | null;
  onSelectOption: (label: string) => void;
  submitted: boolean;
  onSubmit: () => void;
  onNext: () => void;
  submitting: boolean;
}

export function ActivityPanel({
  session,
  activity,
  activityLoading,
  competencyIds,
  activeCompIdx,
  onCompetencySwitch,
  competencyState,
  questions,
  questionsLoading,
  currentIndex,
  selectedOption,
  onSelectOption,
  submitted,
  onSubmit,
  onNext,
  submitting,
}: ActivityPanelProps) {
  const currentQuestion = questions[currentIndex] ?? null;
  const hasMore = currentIndex < questions.length - 1;

  // No active session — waiting state
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
            Live Activity
          </span>
          {activity?.duration_minutes && (
            <span className={s.durationTag}>
              <Clock size={10} />
              {activity.duration_minutes} min
            </span>
          )}
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

        {/* Competency tabs (if activity has multiple) */}
        {competencyIds.length > 1 && (
          <div className={s.compTabs}>
            {competencyIds.map((cId, idx) => (
              <button
                key={cId}
                className={`${s.compTab} ${idx === activeCompIdx ? s.compTabActive : ""}`}
                onClick={() => onCompetencySwitch(idx)}
              >
                {cId}
              </button>
            ))}
          </div>
        )}

        {/* Current competency progress */}
        {competencyState && (
          <div className={s.progressMini}>
            <span>{Math.round(competencyState.p_learned * 100)}%</span>
            <div style={{ flex: 1 }}>
              <ProgressBar
                value={Math.round(competencyState.p_learned * 100)}
                color="#4facfe"
                height="sm"
              />
            </div>
          </div>
        )}

        <div className={s.divider} />

        {/* Question area */}
        <div className={s.questionArea}>
          {questionsLoading ? (
            <div className={s.emptyState}>
              <Loader2
                size={28}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <div className={s.emptyText}>Loading questions...</div>
            </div>
          ) : !currentQuestion ? (
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
            <MCQQuestion
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              selectedOption={selectedOption}
              onSelectOption={onSelectOption}
              submitted={submitted}
            />
          )}
        </div>

        {currentQuestion && (
          <div className={s.actions}>
            {!submitted ? (
              <Button
                variant="primary"
                size="md"
                onClick={onSubmit}
                disabled={!selectedOption || submitting}
                style={{ flex: 1 }}
              >
                {submitting ? (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  "Submit Answer"
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onNext}
                style={{ flex: 1 }}
              >
                {hasMore ? "Next Question" : "Load More"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
