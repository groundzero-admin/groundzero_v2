import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/api/client";
import * as s from "./admin.css";

interface StudentMasteryRow {
    student_id: string;
    student_name: string;
    p_learned: number;
    stage: number;
    total_evidence: number;
    consecutive_failures: number;
    is_stuck: boolean;
    avg_response_time_ms: number | null;
    p_learned_before: number | null;
    stage_before: number | null;
    session_correct: number;
    session_total: number;
    dominant_misconception_type: string | null;
    dominant_misconception: string | null;
}

interface CompetencyClassReport {
    competency_id: string;
    competency_name: string;
    students: StudentMasteryRow[];
    attempted_count: number;
    mastered_count: number;
    struggling_count: number;
    not_started_count: number;
    avg_p_learned: number;
    stage_distribution: Record<number, number>;
    session_correct_total: number;
    session_attempts_total: number;
    misconception_breakdown: Record<string, number>;
}

interface StudentCompetencyEntry {
    competency_id: string;
    competency_name: string;
    p_learned: number;
    p_learned_before: number | null;
    session_correct: number;
    session_total: number;
    is_stuck: boolean;
}

interface StudentView {
    student_id: string;
    student_name: string;
    competencies: StudentCompetencyEntry[];
}

function pivotToStudents(reports: CompetencyClassReport[]): StudentView[] {
    const map = new Map<string, StudentView>();
    for (const report of reports) {
        for (const st of report.students) {
            if (!map.has(st.student_id)) {
                map.set(st.student_id, { student_id: st.student_id, student_name: st.student_name, competencies: [] });
            }
            const existing = map.get(st.student_id)!;
            if (!existing.competencies.find(c => c.competency_id === report.competency_id)) {
                existing.competencies.push({
                    competency_id: report.competency_id,
                    competency_name: report.competency_name,
                    p_learned: st.p_learned,
                    p_learned_before: st.p_learned_before,
                    session_correct: st.session_correct,
                    session_total: st.session_total,
                    is_stuck: st.is_stuck,
                });
            }
        }
    }
    return Array.from(map.values());
}

function masteryColor(p: number) {
    if (p >= 0.8) return "#16a34a";
    if (p >= 0.6) return "#2563eb";
    if (p >= 0.4) return "#d97706";
    return "#dc2626";
}

function MasteryPill({ p }: { p: number }) {
    const color = masteryColor(p);
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: color + "12", fontSize: 12, fontWeight: 800, color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
            {Math.round(p * 100)}%
        </span>
    );
}

function DeltaTag({ delta }: { delta: number }) {
    const abs = Math.abs(Math.round(delta * 100));
    if (abs < 1) return <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>→ no change</span>;
    const up = delta > 0;
    return (
        <span style={{ fontSize: 13, fontWeight: 800, color: up ? "#16a34a" : "#dc2626" }}>
            {up ? "↑" : "↓"} {abs}pp
        </span>
    );
}

function initials(name: string) {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ClassReportPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    const { data: reports, isLoading } = useQuery<CompetencyClassReport[]>({
        queryKey: ["class-report", sessionId],
        queryFn: () => api.get(`/admin/diagnostics/sessions/${sessionId}/class-report`).then(r => r.data),
        enabled: !!sessionId,
        refetchInterval: 15_000,
    });

    const allStudents = reports ? pivotToStudents(reports) : [];
    const active = allStudents
        .filter(st => st.competencies.some(c => c.session_total > 0))
        .sort((a, b) => {
            const avgP = (sv: StudentView) => {
                const cs = sv.competencies.filter(c => c.session_total > 0);
                return cs.length ? cs.reduce((sum, c) => sum + c.p_learned, 0) / cs.length : 0;
            };
            return avgP(b) - avgP(a);
        });
    const notStarted = allStudents.filter(st => st.competencies.every(c => c.session_total === 0));

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#718096", fontSize: 13 }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 className={s.title}>Class Report</h1>
                        <p className={s.subtitle}>Student mastery · before → after session</p>
                    </div>
                </div>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}
            {!isLoading && allStudents.length === 0 && (
                <p className={s.emptyState}>No data yet — students need to answer at least one question.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {active.map(student => {
                    const isOpen = expandedStudent === student.student_id;
                    const practiced = student.competencies.filter(c => c.session_total > 0);
                    const isStuck = practiced.some(c => c.is_stuck);
                    const avgP = practiced.reduce((sum, c) => sum + c.p_learned, 0) / (practiced.length || 1);
                    const withDelta = practiced.filter(c => c.p_learned_before != null);
                    const avgDelta = withDelta.length
                        ? withDelta.reduce((sum, c) => sum + (c.p_learned - c.p_learned_before!), 0) / withDelta.length
                        : null;
                    const avatarColor = isStuck ? "#ef4444" : masteryColor(avgP);

                    return (
                        <div key={student.student_id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            {/* Student header */}
                            <div
                                onClick={() => setExpandedStudent(isOpen ? null : student.student_id)}
                                style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: avatarColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: avatarColor }}>
                                    {isStuck ? "⚠" : initials(student.student_name)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{student.student_name}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{practiced.length} skill{practiced.length !== 1 ? "s" : ""} practiced today</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                    <MasteryPill p={avgP} />
                                    {avgDelta !== null && <DeltaTag delta={avgDelta} />}
                                    <div style={{ color: "#cbd5e1" }}>
                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded rows */}
                            {isOpen && (
                                <div style={{ borderTop: "1px solid #f1f5f9" }}>
                                    {practiced.map((c, idx) => {
                                        const delta = c.p_learned_before != null ? c.p_learned - c.p_learned_before : null;
                                        const up = delta != null && delta > 0.005;
                                        const down = delta != null && delta < -0.005;
                                        const rowAccent = up ? "#f0fdf4" : down ? "#fff5f5" : "#fafafa";
                                        const pColor = masteryColor(c.p_learned);

                                        return (
                                            <div key={c.competency_id} style={{ display: "flex", alignItems: "center", padding: "11px 18px 11px 24px", borderTop: idx > 0 ? "1px solid #f1f5f9" : "none", background: rowAccent, gap: 12 }}>
                                                {/* Left accent bar */}
                                                <div style={{ width: 3, height: 32, borderRadius: 99, background: up ? "#22c55e" : down ? "#ef4444" : "#e2e8f0", flexShrink: 0 }} />

                                                {/* Name + sub */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {c.competency_name}
                                                        {c.is_stuck && <span style={{ marginLeft: 6, fontSize: 10, color: "#ef4444", fontWeight: 700 }}>⚠ stuck</span>}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{c.competency_id}</div>
                                                </div>

                                                {/* Labelled stats */}
                                                <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "center" }}>
                                                    {c.session_total > 0 && (
                                                        <div style={{ textAlign: "center" }}>
                                                            <div style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8 }}>
                                                                <span style={{ color: "#16a34a" }}>✓ {c.session_correct}</span>
                                                                <span style={{ color: "#dc2626" }}>✗ {c.session_total - c.session_correct}</span>
                                                            </div>
                                                            <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Today</div>
                                                        </div>
                                                    )}
                                                    <div style={{ textAlign: "center" }}>
                                                        {c.p_learned_before != null ? (
                                                            <>
                                                                <div style={{ fontSize: 14, fontWeight: 800, color: pColor }}>
                                                                    {Math.round(c.p_learned_before * 100)}% → {Math.round(c.p_learned * 100)}%
                                                                </div>
                                                                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mastery</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div style={{ fontSize: 14, fontWeight: 800, color: pColor }}>{Math.round(c.p_learned * 100)}%</div>
                                                                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mastery</div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div style={{ width: 60, textAlign: "right" }}>
                                                        {delta !== null ? <DeltaTag delta={delta} /> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Not started — compact */}
                {notStarted.length > 0 && (
                    <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid #f1f5f9", background: "#fafafa" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Did not answer today ({notStarted.length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {notStarted.filter((st, i, arr) => arr.findIndex(x => x.student_name === st.student_name) === i).map(st => (
                                <span key={st.student_id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: "#f1f5f9", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0", fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                        {initials(st.student_name)}
                                    </span>
                                    {st.student_name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
