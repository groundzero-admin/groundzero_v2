/** Admin page — Activity detail with question bank management. */
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
    useActivity,
    useQuestions,
    useCreateQuestion,
    useUpdateQuestion,
    useDeleteQuestion,
    useCompetencies,
} from "@/api/hooks/useAdmin";
import type { Question } from "@/api/types/admin";

const DIFF_LABELS = ["Easy", "Medium", "Hard"];
function diffLabel(d: number) { return d < 0.4 ? DIFF_LABELS[0] : d < 0.7 ? DIFF_LABELS[1] : DIFF_LABELS[2]; }
function diffColor(d: number) { return d < 0.4 ? "#10b981" : d < 0.7 ? "#f59e0b" : "#ef4444"; }

export default function AdminActivityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: activity, isLoading: loadingActivity } = useActivity(id);
    const { data: competencies = [] } = useCompetencies();

    // Get competency IDs from activity
    const compIds = useMemo(() => (activity?.primary_competencies || []).map((c) => c.competency_id), [activity]);

    // Fetch questions for activity's competencies (get all, filter client-side)
    const { data: allQuestions = [], isLoading: loadingQ } = useQuestions();
    const questions = useMemo(() => allQuestions.filter((q) => compIds.includes(q.competency_id)), [allQuestions, compIds]);

    const createQ = useCreateQuestion();
    const updateQ = useUpdateQuestion();
    const deleteQ = useDeleteQuestion();

    const compMap = Object.fromEntries(competencies.map((c) => [c.id, c]));

    // Question form
    const [showQForm, setShowQForm] = useState(false);
    const [editQId, setEditQId] = useState<string | null>(null);
    const [qForm, setQForm] = useState({
        competency_id: "",
        text: "",
        type: "mcq" as Question["type"],
        options: [
            { label: "A", text: "", isCorrect: true },
            { label: "B", text: "", isCorrect: false },
            { label: "C", text: "", isCorrect: false },
            { label: "D", text: "", isCorrect: false },
        ] as { label: string; text: string; isCorrect: boolean }[],
        correct_answer: "",
        difficulty: 0.5,
        grade_band: "4-5" as string,
        module_id: activity?.module_id || "level_1",
        explanation: "",
    });

    function resetQForm() {
        setQForm({
            competency_id: compIds[0] || "",
            text: "",
            type: "mcq",
            options: [
                { label: "A", text: "", isCorrect: true },
                { label: "B", text: "", isCorrect: false },
                { label: "C", text: "", isCorrect: false },
                { label: "D", text: "", isCorrect: false },
            ],
            correct_answer: "",
            difficulty: 0.5,
            grade_band: "4-5",
            module_id: activity?.module_id || "level_1",
            explanation: "",
        });
    }

    function openEditQ(q: Question) {
        setEditQId(q.id);
        setQForm({
            competency_id: q.competency_id,
            text: q.text,
            type: q.type,
            options: q.options || [{ label: "A", text: "", isCorrect: true }, { label: "B", text: "", isCorrect: false }, { label: "C", text: "", isCorrect: false }, { label: "D", text: "", isCorrect: false }],
            correct_answer: q.correct_answer || "",
            difficulty: q.difficulty,
            grade_band: q.grade_band,
            module_id: q.module_id,
            explanation: q.explanation || "",
        });
        setShowQForm(true);
    }

    async function handleSaveQ() {
        const payload = {
            ...qForm,
            options: qForm.type === "mcq" ? qForm.options : null,
            correct_answer: qForm.type === "short_answer" ? qForm.correct_answer : null,
            explanation: qForm.explanation || null,
        };
        if (editQId) {
            await updateQ.mutateAsync({ id: editQId, ...payload } as any);
        } else {
            await createQ.mutateAsync(payload as any);
        }
        setShowQForm(false);
        setEditQId(null);
        resetQForm();
    }

    if (loadingActivity) {
        return <div style={{ padding: 32, textAlign: "center", color: "#888" }}>Loading…</div>;
    }
    if (!activity) {
        return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>Activity not found</div>;
    }

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12, display: "flex", gap: 4, alignItems: "center" }}>
                <span onClick={() => navigate("/admin/activities")} style={{ cursor: "pointer", color: "#6366f1" }}>Activities</span>
                <span>›</span>
                <span>{activity.name}</span>
            </div>

            {/* Activity Info Card */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, background: "#fff", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{activity.name}</h1>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                            ID: {activity.id} · Module: {activity.module_id} · Type: <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{activity.type.replace("_", " ")}</span>
                            {activity.duration_minutes && ` · ${activity.duration_minutes} min`}
                        </div>
                    </div>
                </div>
                {activity.description && (
                    <p style={{ fontSize: 13, color: "#555", margin: "8px 0 0", lineHeight: 1.5 }}>{activity.description}</p>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {(activity.primary_competencies || []).map((pc) => (
                        <span key={pc.competency_id} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#ede9fe", color: "#6366f1", fontWeight: 500 }}>
                            {pc.competency_id} — {compMap[pc.competency_id]?.name || ""}
                        </span>
                    ))}
                </div>
            </div>

            {/* Question Bank Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    🎯 Question Bank <span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}>({questions.length} questions for this activity's competencies)</span>
                </h2>
                <button
                    onClick={() => { resetQForm(); setEditQId(null); setShowQForm(true); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                >
                    + Add Question
                </button>
            </div>

            {loadingQ ? (
                <div style={{ padding: 20, textAlign: "center", color: "#888" }}>Loading questions…</div>
            ) : questions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#aaa", border: "1px dashed #ddd", borderRadius: 10 }}>
                    No questions yet for this activity's competencies. Add your first!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {questions.map((q) => (
                        <div key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1, marginRight: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{q.text}</div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: `${diffColor(q.difficulty)}18`, color: diffColor(q.difficulty), fontWeight: 600 }}>
                                            {diffLabel(q.difficulty)} ({(q.difficulty * 100).toFixed(0)}%)
                                        </span>
                                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f3f4f6", color: "#666" }}>
                                            {q.competency_id}
                                        </span>
                                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f3f4f6", color: "#666" }}>
                                            {q.type.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f3f4f6", color: "#666" }}>
                                            Grade {q.grade_band}
                                        </span>
                                    </div>
                                    {q.type === "mcq" && q.options && (
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                            {q.options.map((o) => (
                                                <span key={o.label} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: o.isCorrect ? "#d1fae5" : "#f3f4f6", color: o.isCorrect ? "#059669" : "#666", fontWeight: o.isCorrect ? 600 : 400 }}>
                                                    {o.label}: {o.text.slice(0, 40)}{o.text.length > 40 ? "…" : ""}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                    <button onClick={() => openEditQ(q)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Edit</button>
                                    <button onClick={() => { if (confirm("Delete this question?")) deleteQ.mutate(q.id); }} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Del</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Question Form Modal */}
            {showQForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 560, maxHeight: "85vh", overflow: "auto" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>{editQId ? "Edit Question" : "Add Question"}</h2>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Competency *</label>
                            <select value={qForm.competency_id} onChange={(e) => setQForm({ ...qForm, competency_id: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                                <option value="">Select competency…</option>
                                {compIds.map((cid) => <option key={cid} value={cid}>{cid} — {compMap[cid]?.name || ""}</option>)}
                                <option disabled>───── All ─────</option>
                                {competencies.filter((c) => !compIds.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Question Text *</label>
                            <textarea value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                                <select value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value as Question["type"] })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                                    <option value="mcq">MCQ</option>
                                    <option value="short_answer">Short Answer</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Grade Band</label>
                                <select value={qForm.grade_band} onChange={(e) => setQForm({ ...qForm, grade_band: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                                    <option value="4-5">4-5</option>
                                    <option value="6-7">6-7</option>
                                    <option value="8-9">8-9</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Difficulty ({(qForm.difficulty * 100).toFixed(0)}%)</label>
                                <input type="range" min={0} max={1} step={0.05} value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: +e.target.value })} style={{ width: "100%" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
                                    <span>Easy</span><span>Hard</span>
                                </div>
                            </div>
                        </div>

                        {qForm.type === "mcq" && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Options (click radio for correct)</label>
                                {qForm.options.map((opt, i) => (
                                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                        <input
                                            type="radio"
                                            name="correct"
                                            checked={opt.isCorrect}
                                            onChange={() => setQForm({ ...qForm, options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i })) })}
                                        />
                                        <span style={{ fontWeight: 600, fontSize: 12, width: 16 }}>{opt.label}</span>
                                        <input
                                            value={opt.text}
                                            onChange={(e) => setQForm({ ...qForm, options: qForm.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o) })}
                                            placeholder={`Option ${opt.label}`}
                                            style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {qForm.type === "short_answer" && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Correct Answer</label>
                                <input value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                        )}

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Explanation (shown after answer)</label>
                            <textarea value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                            <button onClick={() => { setShowQForm(false); setEditQId(null); resetQForm(); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                            <button
                                onClick={handleSaveQ}
                                disabled={!qForm.text || !qForm.competency_id}
                                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: (!qForm.text || !qForm.competency_id) ? 0.5 : 1 }}
                            >
                                {editQId ? "Save Changes" : "Add Question"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
