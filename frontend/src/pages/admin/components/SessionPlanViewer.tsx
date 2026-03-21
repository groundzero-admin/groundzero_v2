import { Eye, Layers } from "lucide-react";
import type { SessionViewOut, SessionViewQuestion } from "@/api/types/admin";
import * as s from "../admin.css";
import LivePreview from "../LivePreview";

export function extractStatementSnippet(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const candidates = [d.instruction, d.prompt, d.question, d.text, d.sentence, d.stem];
    for (const v of candidates) {
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
}

interface SessionPlanViewerProps {
    sessionView: SessionViewOut;
    activeActivityId: string | null;
    onSelectActivity: (activityId: string) => void;
    previewQuestion: SessionViewQuestion | null;
    onSelectQuestion: (q: SessionViewQuestion) => void;
}

export default function SessionPlanViewer({
    sessionView,
    activeActivityId,
    onSelectActivity,
    previewQuestion,
    onSelectQuestion,
}: SessionPlanViewerProps) {
    const activeActivity =
        sessionView.activities.find((a) => a.activity_id === activeActivityId) ??
        sessionView.activities[0];
    const questions = activeActivity?.questions ?? [];

    return (
        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 16, marginTop: 16 }}>
            {/* Activities */}
            <div style={{ width: 320, flexShrink: 0, minHeight: 0, overflowY: "auto" }}>
                <div
                    style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <Layers size={16} /> Activities ({sessionView.activities.length})
                </div>
                {sessionView.activities.map((a, idx) => {
                    const selected = a.activity_id === activeActivity?.activity_id;
                    return (
                        <button
                            key={a.session_activity_id}
                            type="button"
                            onClick={() => onSelectActivity(a.activity_id)}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                padding: 12,
                                borderRadius: 12,
                                border: selected
                                    ? "1px solid var(--color-primary, #6366f1)"
                                    : "1px solid var(--color-border-subtle, #e5e7eb)",
                                backgroundColor: selected
                                    ? "var(--color-surface-2, rgba(99,102,241,0.06))"
                                    : "var(--color-surface, #fff)",
                                cursor: "pointer",
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                                    Order {idx + 1}
                                </span>
                                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                                    {a.questions.length} questions
                                </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{a.name}</div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--color-text-secondary)",
                                    marginTop: 4,
                                }}
                            >
                                {a.type} · {a.module_id}{" "}
                                {a.duration_minutes != null ? `· ${a.duration_minutes}m` : ""}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Questions */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    Questions ({questions.length})
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 12,
                    }}
                >
                    {questions.map((q, qi) => {
                        const selected = previewQuestion?.id === q.id;
                        const snippet = extractStatementSnippet(q.data);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => onSelectQuestion(q)}
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderRadius: 14,
                                    border: selected
                                        ? "1px solid var(--color-primary, #6366f1)"
                                        : "1px solid var(--color-border-subtle, #e5e7eb)",
                                    backgroundColor: selected
                                        ? "var(--color-surface-2, rgba(99,102,241,0.06))"
                                        : "var(--color-surface, #fff)",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}
                                    >
                                        #{qi + 1}
                                    </span>
                                    <span
                                        style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
                                    >
                                        {q.is_published ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 13, marginTop: 6 }}>
                                    {q.title}
                                </div>
                                {snippet && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            fontSize: 12,
                                            color: "#059669",
                                            lineHeight: 1.35,
                                        }}
                                    >
                                        {snippet.slice(0, 160)}
                                        {snippet.length > 160 ? "…" : ""}
                                    </div>
                                )}
                                <div
                                    style={{
                                        marginTop: 8,
                                        fontSize: 11,
                                        color: "var(--color-text-secondary)",
                                    }}
                                >
                                    {q.template_name ?? q.template_slug ?? "—"} · Grade{" "}
                                    {q.grade_band || "any"} · Difficulty {q.difficulty}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Preview */}
            <div style={{ width: 400, flexShrink: 0, minHeight: 0, overflowY: "auto" }}>
                <div
                    style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <Eye size={16} /> Student Preview
                </div>
                {previewQuestion?.template_slug ? (
                    <LivePreview
                        slug={previewQuestion.template_slug}
                        data={previewQuestion.data ?? {}}
                    />
                ) : (
                    <div className={s.emptyState}>Click a question card to preview.</div>
                )}
            </div>
        </div>
    );
}
