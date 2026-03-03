import { useEffect } from "react";
import { useTeacherContext } from "@/context/TeacherContext";
import {
  useCohorts,
  useCohortStudents,
} from "@/api/hooks/useTeacher";
import * as s from "./TeacherSidebar.css";

// Stable avatar colors
const AVATAR_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#14B8A6",
  "#A855F7", "#3B82F6", "#E11D48", "#22C55E", "#D946EF",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .replace(/[^a-zA-Z\s]/g, "") // strip parentheses, numbers, symbols
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeacherSidebar() {
  const { selectedCohortId, selectCohort } = useTeacherContext();
  const { data: cohorts } = useCohorts();
  const { data: students } = useCohortStudents(selectedCohortId);
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
                Level {c.level}{c.schedule ? ` · ${c.schedule}` : ""}
              </div>
            </button>
          ))}
          {!cohorts?.length && <p className={s.empty}>No cohorts yet</p>}
        </div>
      </div>

      {/* Students */}
      {selectedCohortId && (
        <div className={s.section}>
          <div className={s.sectionTitle}>
            Students ({students?.length ?? 0})
          </div>
          {students?.length ? (
            <div className={s.studentGrid}>
              {students.map((st, i) => (
                <div
                  key={st.id}
                  className={s.avatarCircle}
                  style={{ backgroundColor: getAvatarColor(i) }}
                  title={st.name}
                >
                  {initials(st.name)}
                </div>
              ))}
            </div>
          ) : (
            <p className={s.empty}>No students in this cohort</p>
          )}
        </div>
      )}

    </aside>
  );
}
