import { useState } from "react";
import { BarChart3, AlertTriangle, ArrowLeft, AlertCircle, Clock, GitBranch, List } from "lucide-react";
import type { ClassSummary } from "@/api/hooks/useTeacher";
import { useSkillGraph } from "@/api/hooks/useCompetencies";
import SkillGraph from "./SkillGraph";
import * as s from "./ClassAnalytics.css";

const STAGE_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Emerging",
  3: "Developing",
  4: "Proficient",
  5: "Mastered",
};

function masteryColor(p: number): string {
  if (p >= 0.65) return "#C6F6D5";  // green bg
  if (p >= 0.30) return "#FEFCBF";  // yellow bg
  return "#FED7D7";                   // red bg
}

function masteryText(p: number): string {
  if (p >= 0.65) return "#276749";
  if (p >= 0.30) return "#975A16";
  return "#9B2C2C";
}

function barColor(p: number): string {
  if (p >= 0.65) return "#38A169";
  if (p >= 0.30) return "#D69E2E";
  return "#E53E3E";
}

interface Props {
  data: ClassSummary;
}

export default function ClassAnalytics({ data }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const { data: skillGraph } = useSkillGraph();

  const { students, interventions, competency_ids, competency_names } = data;

  // Shorten competency names for table headers
  function shortName(cid: string): string {
    const name = competency_names[cid] ?? cid;
    return name
      .replace(/\s*—\s*Grade\s*/, " Gr")
      .replace("Number sense", "NumSns")
      .replace("Fractions", "Fract")
      .replace("Decimals", "Decim")
      .replace("Ratios", "Ratios")
      .replace("Algebra", "Algeb")
      .replace("Geometry", "Geom");
  }

  // Student detail view
  if (selectedStudent) {
    const student = students.find((st) => st.student_id === selectedStudent);
    if (!student) return null;

    return (
      <div className={s.root}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className={s.backBtn} onClick={() => setSelectedStudent(null)}>
            <ArrowLeft size={14} /> Back to Class
          </button>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              className={s.viewToggle}
              style={{
                backgroundColor: viewMode === "graph" ? "#EDF2F7" : "transparent",
                fontWeight: viewMode === "graph" ? 700 : 400,
              }}
              onClick={() => setViewMode("graph")}
              title="Graph view"
            >
              <GitBranch size={14} /> Graph
            </button>
            <button
              className={s.viewToggle}
              style={{
                backgroundColor: viewMode === "list" ? "#EDF2F7" : "transparent",
                fontWeight: viewMode === "list" ? 700 : 400,
              }}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={14} /> List
            </button>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.studentDetail}>
            <div className={s.detailHeader}>
              <div>
                <div className={s.detailName}>{student.student_name}</div>
                <div className={s.detailMeta}>
                  Grade {student.grade} · {student.total_evidence} answers · Overall {Math.round(student.overall * 100)}%
                </div>
              </div>
              {student.last_active && (
                <div className={s.detailMeta}>
                  Last active: {new Date(student.last_active).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {viewMode === "graph" && skillGraph ? (
          <SkillGraph
            graph={skillGraph}
            studentStates={student.competencies}
            studentName={student.student_name}
          />
        ) : (
          <div className={s.card}>
            <div className={s.studentDetail}>
              {competency_ids.map((cid) => {
                const comp = student.competencies[cid];
                if (!comp) return null;
                const p = comp.p_learned;

                return (
                  <div key={cid} className={s.compRow}>
                    <div className={s.compName}>{competency_names[cid] ?? cid}</div>
                    <div className={s.compBar}>
                      <div
                        className={s.compBarFill}
                        style={{ width: `${Math.round(p * 100)}%`, backgroundColor: barColor(p) }}
                      />
                    </div>
                    <div className={s.compPct} style={{ color: barColor(p) }}>
                      {Math.round(p * 100)}%
                    </div>
                    <div className={s.compStage}>{STAGE_LABELS[comp.stage] ?? `Stage ${comp.stage}`}</div>
                    {comp.is_stuck && <span className={s.stuckBadge}>STUCK</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Class overview
  return (
    <div className={s.root}>
      {/* Heatmap */}
      <div>
        <div className={s.sectionTitle}>
          <BarChart3 size={18} />
          Class Mastery
        </div>
        <div className={s.card}>
          {students.length === 0 ? (
            <div className={s.empty}>No students in this cohort yet.</div>
          ) : (
            <div className={s.heatmapScroll}>
              <table className={s.heatmapTable}>
                <thead>
                  <tr>
                    <th className={s.heatmapTh}>Student</th>
                    {competency_ids.map((cid) => (
                      <th key={cid} className={s.heatmapThComp} title={competency_names[cid]}>
                        {shortName(cid)}
                      </th>
                    ))}
                    <th className={s.heatmapTh} style={{ textAlign: "center" }}>Overall</th>
                    <th className={s.heatmapTh} style={{ textAlign: "center" }}>Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.student_id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedStudent(student.student_id)}
                    >
                      <td className={s.heatmapTd}>
                        <span className={s.heatmapName}>{student.student_name}</span>
                      </td>
                      {competency_ids.map((cid) => {
                        const comp = student.competencies[cid];
                        if (!comp) {
                          return (
                            <td key={cid} className={s.heatmapTd} style={{ textAlign: "center" }}>
                              <span style={{ color: "#CBD5E0", fontSize: "12px" }}>—</span>
                            </td>
                          );
                        }
                        const p = comp.p_learned;
                        return (
                          <td key={cid} className={s.heatmapTd} style={{ textAlign: "center" }}>
                            <span
                              className={s.heatmapCell}
                              style={{
                                backgroundColor: masteryColor(p),
                                color: masteryText(p),
                              }}
                              title={`${competency_names[cid]}: ${Math.round(p * 100)}% · ${STAGE_LABELS[comp.stage]}${comp.is_stuck ? " · STUCK" : ""}`}
                            >
                              {Math.round(p * 100)}%
                            </span>
                          </td>
                        );
                      })}
                      <td className={s.heatmapTd}>
                        <span className={s.overallCell}>{Math.round(student.overall * 100)}%</span>
                      </td>
                      <td className={s.heatmapTd} style={{ textAlign: "center", color: "#718096" }}>
                        {student.total_evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interventions */}
      <div>
        <div className={s.sectionTitle}>
          <AlertTriangle size={18} />
          Needs Attention
        </div>
        <div className={s.card}>
          {interventions.length === 0 ? (
            <div className={s.empty}>All students on track. No alerts.</div>
          ) : (
            <div className={s.alertList}>
              {interventions.map((alert, i) => (
                <div
                  key={`${alert.student_id}-${alert.alert_type}-${i}`}
                  className={s.alertRow}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedStudent(alert.student_id)}
                >
                  <div
                    className={s.alertIcon}
                    style={{
                      backgroundColor:
                        alert.alert_type === "stuck" ? "#FED7D7"
                          : alert.alert_type === "inactive" ? "#FEFCBF"
                            : "#FED7D7",
                    }}
                  >
                    {alert.alert_type === "stuck" && <AlertCircle size={16} color="#E53E3E" />}
                    {alert.alert_type === "inactive" && <Clock size={16} color="#D69E2E" />}
                    {alert.alert_type === "declining" && <AlertTriangle size={16} color="#E53E3E" />}
                  </div>
                  <div className={s.alertBody}>
                    <div className={s.alertName}>{alert.student_name}</div>
                    <div className={s.alertDetail}>
                      {alert.detail}
                      {alert.competency_name && ` — ${alert.competency_name}`}
                    </div>
                  </div>
                  <span
                    className={s.alertBadge}
                    style={{
                      backgroundColor:
                        alert.severity >= 3 ? "#FED7D7"
                          : alert.severity >= 2 ? "#FEFCBF"
                            : "#E2E8F0",
                      color:
                        alert.severity >= 3 ? "#9B2C2C"
                          : alert.severity >= 2 ? "#975A16"
                            : "#4A5568",
                    }}
                  >
                    {alert.alert_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
