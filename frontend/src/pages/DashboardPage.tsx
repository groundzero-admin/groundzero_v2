import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useEvidenceHistory } from "@/api/hooks/useEvidenceHistory";

import { aggregatePillarProgress, computeStreak } from "@/lib/pillar-helpers";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { SelfServePractice } from "@/components/dashboard/SelfServePractice";
import { RecommendedTopics } from "@/components/dashboard/RecommendedTopics";
import { MessageBox } from "@/components/dashboard/MessageBox";
import { NextSessionCard, YourJourneyCard } from "@/components/dashboard/LiveSessionCards";
import { QuickModeCards } from "@/components/dashboard/QuickModeCards";
import { Loader2 } from "lucide-react";
import * as s from "./DashboardPage.css";

export default function DashboardPage() {
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
  const { data: evidence } = useEvidenceHistory({
    student_id: studentId,
    limit: 200,
  });
  const student = studentState?.student ?? null;


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
          <NextSessionCard />
          <QuickModeCards />

          <SelfServePractice
            board={student?.board ?? "cbse"}
            grade={student?.grade ?? 6}
          />
          <MessageBox />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <YourJourneyCard />
          <RecommendedTopics
            studentId={studentId}
            board={student?.board ?? "cbse"}
            grade={student?.grade ?? 6}
          />
        </div>
      </div>
    </div>
  );
}
