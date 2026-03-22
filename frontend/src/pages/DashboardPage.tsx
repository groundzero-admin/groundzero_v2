import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { aggregatePillarProgress } from "@/lib/pillar-helpers";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { MessageBox } from "@/components/dashboard/MessageBox";
import { DashboardFeatureCards } from "@/components/dashboard/DashboardFeatureCards";
import { NextSessionCard, YourJourneyCard } from "@/components/dashboard/LiveSessionCards";
import { Loader2 } from "lucide-react";
import * as s from "./DashboardPage.css";

export default function DashboardPage() {
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
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

  return (
    <div className={s.page}>
      <WelcomeCard
        student={student!}
        states={states}
        pillarProgress={pillarProgress}
      />

      <div className={s.columns}>
        <div className={s.mainCol}>
          <NextSessionCard />
          <DashboardFeatureCards />
          <MessageBox />
        </div>

        <div className={s.sideCol}>
          <YourJourneyCard />
        </div>
      </div>
    </div>
  );
}
