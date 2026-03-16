import { useEffect } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import { useCohorts } from "@/api/hooks/useTeacher";
import * as s from "./TeacherSidebar.css";

export default function TeacherSidebar() {
  const { selectedCohortId, selectCohort } = useTeacherContext();
  const { data: cohorts } = useCohorts();
  // Auto-select first cohort
  useEffect(() => {
    if (!selectedCohortId && cohorts?.length) {
      selectCohort(cohorts[0].id);
    }
  }, [cohorts, selectedCohortId, selectCohort]);

  return (
    <aside className={s.sidebar}>
      {/* Cohorts */}
      <div className={s.section}>
        <div className={s.sectionTitle}>My Cohorts</div>
        <div className={s.cohortList}>
          {cohorts?.map((c) => (
            <button
              key={c.id}
              className={`${s.cohortCard} ${c.id === selectedCohortId ? s.cohortCardActive : ""}`}
              onClick={() => selectCohort(c.id)}
            >
              <div className={s.cohortName}>{c.name}</div>
              <div className={s.cohortMeta}>
                {c.grade_band}{c.board ? ` · ${c.board}` : ""}
              </div>
            </button>
          ))}
          {!cohorts?.length && <p className={s.empty}>No cohorts yet</p>}
        </div>
      </div>

    </aside>
  );
}
