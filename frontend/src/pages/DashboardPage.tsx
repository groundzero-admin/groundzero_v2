import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import { useActivity, useActivities } from "@/api/hooks/useActivities";
import { useEvidenceHistory } from "@/api/hooks/useEvidenceHistory";
import { useCohortSessions } from "@/api/hooks/useCohortSessions";
import { usePillars } from "@/api/hooks/usePillars";
import { useCompetencies } from "@/api/hooks/useCompetencies";
import { aggregatePillarProgress, computeStreak } from "@/lib/pillar-helpers";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { SessionsCard } from "@/components/dashboard/SessionsCard";
import { SelfServePractice } from "@/components/dashboard/SelfServePractice";
import { RecommendedTopics } from "@/components/dashboard/RecommendedTopics";
import { JourneyTimeline } from "@/components/dashboard/JourneyTimeline";
import { MessageBox } from "@/components/dashboard/MessageBox";
import { Card } from "@/components/ui";
import { Loader2 } from "lucide-react";
import * as s from "./DashboardPage.css";

export default function DashboardPage() {
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
  const { data: evidence } = useEvidenceHistory({
    student_id: studentId,
    limit: 200,
  });
  const { data: pillars = [] } = usePillars();
  const { data: competencies = [] } = useCompetencies();
  const { data: allActivities = [] } = useActivities();

  // Session awareness
  const student = studentState?.student ?? null;
  const { data: session, isLoading: loadingSession } = useActiveSession(student?.cohort_id);
  const { data: sessionActivity } = useActivity(session?.current_activity_id);
  const { data: cohortSessions = [] } = useCohortSessions(student?.cohort_id);

  if (loadingState) {
    return (
      <div className={s.loading}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!studentState) {
    return (
      <div className={s.loading}>
        No student data found. Complete a diagnostic first.
      </div>
    );
  }

  const { states } = studentState;
  const pillarProgress = aggregatePillarProgress(states);
  const streak = computeStreak(
    (evidence ?? []).map((e) => e.created_at)
  );

  return (
    <div className={s.page}>
      <WelcomeCard
        student={student!}
        states={states}
        pillarProgress={pillarProgress}
        streak={streak}
      />

      <div className={s.columns}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <RecommendedTopics
            studentId={studentId}
            board={student?.board ?? "cbse"}
            grade={student?.grade ?? 6}
          />
          <Card elevation="flat">
            <JourneyTimeline
              sessions={cohortSessions}
              activities={allActivities}
              evidence={evidence ?? []}
            />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <SessionsCard
            session={session ?? null}
            activity={sessionActivity ?? null}
            loading={loadingSession}
          />
          <SelfServePractice
            pillars={pillars}
            competencies={competencies}
            states={states}
            board={student?.board ?? "cbse"}
            grade={student?.grade ?? 6}
          />
          <MessageBox />
        </div>
      </div>
    </div>
  );
}
