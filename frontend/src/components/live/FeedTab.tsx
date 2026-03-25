import { useEffect, useState } from "react";
import type { SessionActivity, LivePulseEvent, StudentActivityScores } from "@/api/types";
import type { Student } from "@/api/types";
import type { ConfidenceMood } from "./StudentConfidenceBar/StudentConfidenceBar";

const MOOD_EMOJI: Record<ConfidenceMood, string> = {
  got_it: "🟢",
  confused: "🟣",
  kinda: "🟡",
  lost: "🔴",
};
const MOOD_LABEL: Record<ConfidenceMood, string> = {
  got_it: "Got it!",
  confused: "Confused",
  kinda: "Kinda…",
  lost: "Lost",
};
const MOOD_COLOR: Record<ConfidenceMood, string> = {
  got_it: "#22c55e",
  confused: "#a855f7",
  kinda: "#f59e0b",
  lost: "#ef4444",
};

type StudentRow = { student_id: string; student_name: string; correct: number; total: number };

export function FeedTab({ sessionActivities, activityScores, cohortStudents, pulseEvents, messages, feedActivityId, setFeedActivityId, activityInfoById }: {
    sessionActivities: SessionActivity[] | undefined;
    activityScores: StudentActivityScores[] | undefined;
    cohortStudents: Student[] | undefined;
    pulseEvents: LivePulseEvent[] | undefined;
    messages: any[];
    feedActivityId: string | null;
    setFeedActivityId: (id: string | null) => void;
    activityInfoById: Map<string, { description?: string | null; questionCount?: number }>;
}) {
    const [showStudentResponses, setShowStudentResponses] = useState(false);

    // Confidence pulse messages
    const confidenceMsgs = messages
        .filter((m: any) => {
            try {
                return JSON.parse(m.message)?.type === "confidence_pulse";
            } catch {
                return false;
            }
        })
        .map((m: any) => {
            const d = JSON.parse(m.message);
            return {
                id: m.id as string,
                studentName: String(d.studentName ?? "?"),
                value: String(d.value ?? ""),
                time: m.time as number,
            };
        })
        .reverse();

    // Trail per student (session-wide)
    const trailByStudent: Record<string, number[]> = {};
    for (const e of (pulseEvents ?? [])) {
        (trailByStudent[e.student_id] ??= []).push(e.outcome);
    }

    // Scores per activity
    const scoresByActivity: Record<string, StudentRow[]> = {};
    for (const student of (activityScores ?? [])) {
        for (const as of student.activity_scores) {
            (scoresByActivity[as.activity_id] ??= []).push({ student_id: student.student_id, student_name: student.student_name, correct: as.correct, total: as.total });
        }
    }

    const ordered = [...(sessionActivities ?? [])].sort((a, b) => a.order - b.order);
    const liveActivity = ordered.find(a => a.status === "active") ?? ordered.filter(a => a.status !== "pending").at(-1) ?? ordered[0];
    const selectedId = feedActivityId ?? liveActivity?.activity_id ?? null;

    // Keep default selection on the launched/live activity when Feed opens.
    useEffect(() => {
        if (ordered.length === 0) return;
        const exists = !!feedActivityId && ordered.some(a => a.activity_id === feedActivityId);
        if (!exists && liveActivity?.activity_id) {
            setFeedActivityId(liveActivity.activity_id);
        }
    }, [ordered, liveActivity, feedActivityId, setFeedActivityId]);

    const attempted = (scoresByActivity[selectedId ?? ""] ?? []).sort((a, b) => (b.correct / (b.total || 1)) - (a.correct / (a.total || 1)));
    const attemptedIds = new Set(attempted.map(s => s.student_id));
    const notAttempted: StudentRow[] = (cohortStudents ?? []).filter(s => !attemptedIds.has(s.id)).map(s => ({ student_id: s.id, student_name: s.name, correct: 0, total: 0 }));
    const students = [...attempted, ...notAttempted];

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
            {/* Activity selector */}
            {ordered.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "8px 10px" }}>
                    <select
                        value={selectedId ?? ""}
                        onChange={(e) => setFeedActivityId(e.target.value || null)}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "7px 10px",
                            borderRadius: 10,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#334155",
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        {ordered.map((a) => (
                            <option key={a.id} value={a.activity_id}>
                                {a.order}. {a.activity_name ?? a.activity_id}
                                {a.status === "active" ? " (live)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ flexShrink: 0, padding: "8px 10px 0", borderBottom: showStudentResponses ? "1px solid #e2e8f0" : "none", background: "#fafafa" }}>
                <button
                    type="button"
                    onClick={() => setShowStudentResponses((v) => !v)}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#334155",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "center",
                    }}
                >
                    {showStudentResponses ? "Hide all students responses" : "Show all students responses"}
                </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
                {/* Student list — activity-wise correct/incorrect (hidden by default) */}
                {showStudentResponses && students.length > 0 && (
                    <div
                        style={{
                            flexShrink: 0,
                            maxHeight: "min(42vh, 380px)",
                            overflowY: "auto",
                            background: "#fff",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            overflowX: "hidden",
                        }}
                    >
                        {(() => {
                            const totalQs = activityInfoById.get(selectedId ?? "")?.questionCount ?? 0;
                            return students.map((st, idx) => {
                            const hasAttempted = st.total > 0;
                            const accuracy = hasAttempted ? st.correct / st.total : null;
                            const recentTrail = (trailByStudent[st.student_id] ?? []).slice(-3);
                            const isStuck = hasAttempted && recentTrail.length === 3 && recentTrail.every(o => o < 0.5);
                            const initials = st.student_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                            const avatarBg = !hasAttempted ? "#e2e8f0" : isStuck ? "#ef4444" : accuracy! >= 0.7 ? "#22c55e" : accuracy! >= 0.4 ? "#f59e0b" : "#ef4444";

                            const denom = Math.max(totalQs, st.total, 1);
                            const correctPct = (st.correct / denom) * 100;
                            const wrongPct   = ((st.total - st.correct) / denom) * 100;
                            const remainPct  = Math.max(0, ((denom - st.total) / denom) * 100);

                            const statusLabel = !hasAttempted ? null
                                : isStuck          ? { text: "struggling",      color: "#ef4444" }
                                : accuracy! >= 0.7 ? { text: "doing well",      color: "#15803d" }
                                : accuracy! >= 0.4 ? { text: "needs practice",  color: "#a16207" }
                                :                    { text: "needs help",       color: "#b91c1c" };

                            return (
                                <div key={st.student_id} style={{ padding: "9px 12px", borderTop: idx > 0 ? "1px solid #f1f5f9" : "none", background: isStuck ? "#fff5f5" : "transparent", opacity: hasAttempted ? 1 : 0.4 }}>
                                    {/* Row 1: avatar + name + counts */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: avatarBg, color: hasAttempted ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>
                                            {isStuck ? "⚠" : initials}
                                        </div>
                                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.student_name}</span>
                                        {hasAttempted && (
                                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>✓{st.correct}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c" }}>✗{st.total - st.correct}</span>
                                            </div>
                                        )}
                                        {!hasAttempted && <span style={{ fontSize: 10, color: "#cbd5e1", flexShrink: 0 }}>not started</span>}
                                    </div>
                                    {/* Row 2: stacked bar + status label */}
                                    {hasAttempted && (
                                        <div style={{ marginTop: 6, paddingLeft: 36 }}>
                                            <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", display: "flex" }}>
                                                <div style={{ width: `${correctPct}%`, background: "#22c55e", transition: "width 0.3s" }} />
                                                <div style={{ width: `${wrongPct}%`,   background: "#ef4444", transition: "width 0.3s" }} />
                                                <div style={{ width: `${remainPct}%`,  background: "#e2e8f0", transition: "width 0.3s" }} />
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                                                {statusLabel && <span style={{ fontSize: 9, fontWeight: 700, color: statusLabel.color }}>{statusLabel.text}</span>}
                                                <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: "auto" }}>
                                                    {st.total}/{denom} attempted
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                        })()}
                    </div>
                )}

                {/* How Students Feel — uses remaining vertical space when responses are hidden */}
                <div style={{ flex: showStudentResponses ? undefined : 1, minHeight: showStudentResponses ? undefined : 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: "#0f172a" }}>💬 How Students Feel</div>
                    {confidenceMsgs.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {confidenceMsgs.slice(0, 8).map(msg => (
                                <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                                    <span>{MOOD_EMOJI[msg.value as ConfidenceMood] ?? "💬"}</span>
                                    <span style={{ fontWeight: 600, color: "#334155" }}>{msg.studentName}</span>
                                    <span style={{ color: MOOD_COLOR[msg.value as ConfidenceMood] ?? "#64748b" }}>{MOOD_LABEL[msg.value as ConfidenceMood] ?? msg.value}</span>
                                    <span style={{ marginLeft: "auto", opacity: 0.4, fontSize: 9 }}>{new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: "#94a3b8", fontSize: 10 }}>No responses yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}
