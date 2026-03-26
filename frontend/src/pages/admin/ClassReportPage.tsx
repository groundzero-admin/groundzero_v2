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

/* ── Derived types ── */

interface StudentSummary {
    student_id: string;
    student_name: string;
    total_correct: number;
    total_attempted: number;
    skills_practiced: number;
    is_stuck: boolean;
    tag: "stuck" | "low_engagement" | null;
    worst_topic: string | null;
    best_topic: string | null;
    topics: { name: string; correct: number; total: number }[];
}

interface TopicSummary {
    name: string;
    correct: number;
    total: number;
    pct: number;
    status: "reteach" | "more_practice" | "ready";
}

/* ── Data transforms ── */

function buildStudents(reports: CompetencyClassReport[]): StudentSummary[] {
    const map = new Map<string, StudentSummary>();
    for (const r of reports) {
        for (const st of r.students) {
            if (!map.has(st.student_id)) {
                map.set(st.student_id, {
                    student_id: st.student_id,
                    student_name: st.student_name,
                    total_correct: 0,
                    total_attempted: 0,
                    skills_practiced: 0,
                    is_stuck: false,
                    tag: null,
                    worst_topic: null,
                    best_topic: null,
                    topics: [],
                });
            }
            const entry = map.get(st.student_id)!;
            if (st.session_total > 0) {
                entry.total_correct += st.session_correct;
                entry.total_attempted += st.session_total;
                entry.skills_practiced++;
                entry.topics.push({ name: r.competency_name, correct: st.session_correct, total: st.session_total });
            }
            if (st.is_stuck) entry.is_stuck = true;
        }
    }
    // Compute median attempts for engagement comparison
    const attemptCounts = Array.from(map.values()).filter(st => st.total_attempted > 0).map(st => st.total_attempted);
    const medianAttempts = attemptCounts.length > 0
        ? attemptCounts.sort((a, b) => a - b)[Math.floor(attemptCounts.length / 2)]
        : 0;

    for (const st of map.values()) {
        if (st.total_attempted === 0) continue;
        if (st.is_stuck) st.tag = "stuck";
        else if (st.total_attempted < Math.max(3, medianAttempts * 0.4)) st.tag = "low_engagement";
        // Find worst and best topics
        const sorted = [...st.topics].sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
        if (sorted.length > 0) {
            const worst = sorted[0];
            if (worst.correct / worst.total < 0.5) st.worst_topic = `${worst.name} (${worst.correct}/${worst.total})`;
            const best = sorted[sorted.length - 1];
            if (best.correct / best.total >= 0.7) st.best_topic = `${best.name} ${best.correct}/${best.total}`;
        }
    }
    return Array.from(map.values());
}

function buildTopics(reports: CompetencyClassReport[]): TopicSummary[] {
    return reports
        .filter(r => r.session_attempts_total > 0)
        .map(r => {
            const pct = r.session_correct_total / r.session_attempts_total;
            return {
                name: r.competency_name,
                correct: r.session_correct_total,
                total: r.session_attempts_total,
                pct,
                status: pct >= 0.7 ? "ready" as const : pct >= 0.4 ? "more_practice" as const : "reteach" as const,
            };
        })
        .sort((a, b) => a.pct - b.pct);
}

/* ── Small components ── */

function initials(name: string) {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function ScoreBar({ correct, total }: { correct: number; total: number }) {
    if (total === 0) return null;
    const pct = Math.round((correct / total) * 100);
    const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 48, height: 5, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>{correct}/{total}</span>
        </div>
    );
}

const TAG_CFG: Record<string, { label: string; color: string; bg: string }> = {
    stuck: { label: "Stuck", color: "#dc2626", bg: "#fef2f2" },
    low_engagement: { label: "Low engagement", color: "#d97706", bg: "#fffbeb" },
};

const TOPIC_CFG = {
    reteach: { label: "Needs reteaching", color: "#dc2626", bg: "#fef2f2" },
    more_practice: { label: "More practice needed", color: "#d97706", bg: "#fffbeb" },
    ready: { label: "Ready to move on", color: "#16a34a", bg: "#f0fdf4" },
};

/* ── Main page ── */

export default function ClassReportPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [view, setView] = useState<"students" | "topics">("students");

    const { data: reports, isLoading } = useQuery<CompetencyClassReport[]>({
        queryKey: ["class-report", sessionId],
        queryFn: () => api.get(`/admin/diagnostics/sessions/${sessionId}/class-report`).then(r => r.data),
        enabled: !!sessionId,
        refetchInterval: 15_000,
    });

    const allStudents = reports ? buildStudents(reports) : [];
    const topics = reports ? buildTopics(reports) : [];
    const active = allStudents.filter(st => st.total_attempted > 0);
    const inactive = allStudents.filter(st => st.total_attempted === 0);
    const totalCorrect = active.reduce((sum, st) => sum + st.total_correct, 0);
    const totalAttempted = active.reduce((sum, st) => sum + st.total_attempted, 0);

    const ranked = [...active].sort((a, b) => b.total_correct - a.total_correct);

    return (
        <div className={s.page}>
            {/* Header */}
            <div className={s.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#718096", fontSize: 13 }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 className={s.title}>Class Report</h1>
                        <p className={s.subtitle}>
                            {totalAttempted > 0
                                ? `${active.length} student${active.length !== 1 ? "s" : ""} answered · ${totalCorrect}/${totalAttempted} correct (${Math.round((totalCorrect / totalAttempted) * 100)}%)`
                                : "No answers yet"}
                        </p>
                    </div>
                </div>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}
            {!isLoading && allStudents.length === 0 && (
                <p className={s.emptyState}>No data yet — students need to answer at least one question.</p>
            )}

            {/* View toggle */}
            {!isLoading && allStudents.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 8, padding: 3, width: "fit-content" }}>
                    {(["students", "topics"] as const).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            style={{
                                padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                background: view === v ? "#fff" : "transparent",
                                color: view === v ? "#0f172a" : "#94a3b8",
                                boxShadow: view === v ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                            }}
                        >
                            {v === "students" ? "By Student" : "By Topic"}
                        </button>
                    ))}
                </div>
            )}

            {/* ── BY STUDENT ── */}
            {view === "students" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {ranked.map((st, idx) => <StudentCard key={st.student_id} student={st} rank={idx + 1} isOpen={expandedStudent === st.student_id} onToggle={() => setExpandedStudent(expandedStudent === st.student_id ? null : st.student_id)} />)}

                    {inactive.length > 0 && (
                        <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid #f1f5f9", background: "#fafafa" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Did not answer ({inactive.length})
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {inactive.map(st => (
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
            )}

            {/* ── BY TOPIC ── */}
            {view === "topics" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {topics.map(topic => {
                        const cfg = TOPIC_CFG[topic.status];
                        return (
                            <div key={topic.name} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{topic.name}</div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginTop: 3, padding: "2px 8px", borderRadius: 4, background: cfg.bg, display: "inline-block" }}>
                                        {cfg.label}
                                    </span>
                                </div>
                                <ScoreBar correct={topic.correct} total={topic.total} />
                            </div>
                        );
                    })}
                    {topics.length === 0 && <p className={s.emptyState}>No topics practiced yet.</p>}
                </div>
            )}
        </div>
    );
}

/* ── Sub-components ── */

function StudentCard({ student, rank, isOpen, onToggle }: { student: StudentSummary; rank: number; isOpen: boolean; onToggle: () => void }) {
    const tag = student.tag ? TAG_CFG[student.tag] : null;

    return (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div onClick={onToggle} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: rank <= 3 ? "#f0fdf4" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: rank <= 3 ? "#16a34a" : "#94a3b8" }}>
                    {rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{student.student_name}</span>
                        {tag && <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.bg, padding: "2px 6px", borderRadius: 4 }}>{tag.label}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {student.skills_practiced} topic{student.skills_practiced !== 1 ? "s" : ""}
                        {student.worst_topic && <span> · struggled with {student.worst_topic}</span>}
                        {!student.worst_topic && student.best_topic && <span> · strong on {student.best_topic}</span>}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <ScoreBar correct={student.total_correct} total={student.total_attempted} />
                    <div style={{ color: "#cbd5e1" }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {isOpen && student.topics.length > 0 && (
                <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    {student.topics
                        .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
                        .map((t, idx) => {
                            const pct = t.total > 0 ? t.correct / t.total : 0;
                            const color = pct >= 0.7 ? "#16a34a" : pct >= 0.4 ? "#d97706" : "#dc2626";
                            return (
                                <div key={t.name} style={{ display: "flex", alignItems: "center", padding: "10px 18px 10px 24px", borderTop: idx > 0 ? "1px solid #f1f5f9" : "none", gap: 12 }}>
                                    <div style={{ width: 3, height: 24, borderRadius: 99, background: color, flexShrink: 0 }} />
                                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.name}</div>
                                    <ScoreBar correct={t.correct} total={t.total} />
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
