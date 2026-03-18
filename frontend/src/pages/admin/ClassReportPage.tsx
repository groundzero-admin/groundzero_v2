import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/api/client";
import * as s from "./admin.css";

// ── Types ──

interface StudentMasteryRow {
    student_id: string;
    student_name: string;
    p_learned: number;
    stage: number;
    total_evidence: number;
    is_stuck: boolean;
    dominant_misconception_type: "conceptual" | "procedural" | "careless" | "guessing" | null;
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
    misconception_breakdown: Record<string, number>;
}

// ── Helpers ──

const MISC_COLORS: Record<string, string> = {
    conceptual: "#e53e3e",
    procedural: "#ed8936",
    careless: "#d69e2e",
    guessing: "#718096",
};

function masteryColor(p: number): string {
    if (p >= 0.8) return "#38a169";
    if (p >= 0.6) return "#68d391";
    if (p >= 0.3) return "#ed8936";
    if (p > 0) return "#e53e3e";
    return "#e2e8f0";
}

function MasteryBar({ p, evidence }: { p: number; evidence: number }) {
    if (evidence === 0) return <span style={{ fontSize: 11, color: "#a0aec0", fontStyle: "italic" }}>Not started</span>;
    const pct = Math.round(p * 100);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: masteryColor(p), borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: masteryColor(p) }}>{pct}%</span>
        </div>
    );
}

function MiscBadge({ type }: { type: string | null }) {
    if (!type) return <span style={{ fontSize: 10, color: "#a0aec0" }}>—</span>;
    return (
        <span style={{
            display: "inline-block",
            padding: "1px 8px",
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            backgroundColor: (MISC_COLORS[type] ?? "#718096") + "20",
            color: MISC_COLORS[type] ?? "#718096",
        }}>
            {type}
        </span>
    );
}

// ── Main component ──

export default function ClassReportPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [expandedComp, setExpandedComp] = useState<string | null>(null);

    const { data: reports, isLoading } = useQuery<CompetencyClassReport[]>({
        queryKey: ["class-report", sessionId],
        queryFn: () => api.get(`/admin/diagnostics/sessions/${sessionId}/class-report`).then(r => r.data),
        enabled: !!sessionId,
    });

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#718096", fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 className={s.title}>Class Report</h1>
                        <p className={s.subtitle}>Misconception analysis by competency</p>
                    </div>
                </div>
            </div>

            {isLoading && <p className={s.emptyState}>Loading class report...</p>}
            {!isLoading && (!reports || reports.length === 0) && (
                <p className={s.emptyState}>No data yet. Session may not have an active activity, or no students have answered.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reports?.map((report) => (
                    <div key={report.competency_id} style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        overflow: "hidden",
                    }}>
                        {/* Competency header */}
                        <div
                            style={{ padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            onClick={() => setExpandedComp(expandedComp === report.competency_id ? null : report.competency_id)}
                        >
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{report.competency_name}</div>
                                <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{report.competency_id}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                {/* Stats */}
                                <div style={{ display: "flex", gap: 12 }}>
                                    <StatPill label="Mastered" count={report.mastered_count} color="#38a169" />
                                    <StatPill label="Struggling" count={report.struggling_count} color="#e53e3e" />
                                    <StatPill label="Not started" count={report.not_started_count} color="#a0aec0" />
                                </div>
                                {expandedComp === report.competency_id ? <ChevronDown size={16} color="#718096" /> : <ChevronRight size={16} color="#718096" />}
                            </div>
                        </div>

                        {/* Misconception breakdown bar */}
                        {Object.keys(report.misconception_breakdown).length > 0 && (
                            <div style={{ padding: "0 20px 12px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "#718096", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Misconception Breakdown
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {Object.entries(report.misconception_breakdown).map(([type, count]) => (
                                        <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: (MISC_COLORS[type] ?? "#718096") + "12" }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: MISC_COLORS[type] ?? "#718096", display: "inline-block" }} />
                                            <span style={{ fontSize: 12, fontWeight: 600, color: MISC_COLORS[type] ?? "#718096" }}>{count} {type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expanded student table */}
                        {expandedComp === report.competency_id && (
                            <div style={{ borderTop: "1px solid #f7fafc" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f7fafc" }}>
                                            <th style={TH}>Student</th>
                                            <th style={TH}>Mastery</th>
                                            <th style={TH}>Attempts</th>
                                            <th style={TH}>Stage</th>
                                            <th style={TH}>Misconception type</th>
                                            <th style={TH}>Misconception</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.students.map((st) => (
                                            <tr key={st.student_id} style={{ borderTop: "1px solid #f0f4f8" }}>
                                                <td style={TD}>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{st.student_name}</div>
                                                    {st.is_stuck && <div style={{ fontSize: 10, color: "#c05621", fontWeight: 600 }}>⚠ Stuck</div>}
                                                </td>
                                                <td style={TD}><MasteryBar p={st.p_learned} evidence={st.total_evidence} /></td>
                                                <td style={TD}><span style={{ fontSize: 12, color: "#4a5568" }}>{st.total_evidence}</span></td>
                                                <td style={TD}><span style={{ fontSize: 12, color: "#4a5568" }}>{st.stage}</span></td>
                                                <td style={TD}><MiscBadge type={st.dominant_misconception_type} /></td>
                                                <td style={TD}>
                                                    <span style={{ fontSize: 11, color: "#4a5568" }}>
                                                        {st.dominant_misconception ?? "—"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const TH: React.CSSProperties = {
    padding: "8px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
};

const TD: React.CSSProperties = {
    padding: "10px 16px",
    verticalAlign: "middle",
};

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color }}>{count}</span>
            <span style={{ fontSize: 9, color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        </div>
    );
}
