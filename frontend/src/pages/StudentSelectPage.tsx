import { useStudents } from "@/api/hooks/useStudents";
import { useStudent } from "@/context/StudentContext";
import { useNavigate } from "react-router";
import { User, Loader2 } from "lucide-react";
import * as s from "./StudentSelectPage.css";

export default function StudentSelectPage() {
  const { data: students, isLoading } = useStudents();
  const { setStudentId } = useStudent();
  const navigate = useNavigate();

  function handleSelect(id: string) {
    setStudentId(id);
    navigate("/home");
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <h1 className={s.title}>Ground Zero</h1>
        <p className={s.subtitle}>Select your profile to continue</p>

        {isLoading ? (
          <div className={s.spinner}>
            <Loader2 size={32} className={s.spinner} />
          </div>
        ) : !students?.length ? (
          <p className={s.empty}>
            No students found. Create one via the API first.
          </p>
        ) : (
          <div className={s.list}>
            {students.map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelect(st.id)}
                className={s.studentBtn}
              >
                <div className={s.avatarWrap}>
                  <User size={20} />
                </div>
                <div>
                  <div className={s.name}>{st.name}</div>
                  <div className={s.meta}>
                    Grade {st.grade} &middot; Band {st.grade_band}
                    {st.diagnostic_completed && " \u2713 Diagnostic done"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
