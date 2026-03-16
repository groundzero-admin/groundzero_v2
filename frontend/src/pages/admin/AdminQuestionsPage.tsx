import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import * as s from "./admin.css";

// ── Types ──

interface QuestionOption {
    label: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    module_id: string;
    competency_id: string;
    text: string;
    type: string;
    options: QuestionOption[] | null;
    correct_answer: string | null;
    difficulty: number;
    grade_band: string;
    topic_id: string | null;
    explanation: string | null;
}

interface Competency {
    id: string;
    name: string;
}

const GRADE_BANDS = ["4-5", "6-7", "8-9"];

// ── Component ──

export default function AdminQuestionsPage() {
    const qc = useQueryClient();
    const { data: questions, isLoading } = useQuery<Question[]>({
        queryKey: ["questions-all"],
        queryFn: () => api.get("/questions", { params: { limit: 200 } }).then((r) => r.data),
    });
    const { data: competencies } = useQuery<Competency[]>({
        queryKey: ["competencies"],
        queryFn: () => api.get("/competencies").then((r) => r.data),
    });

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Question | null>(null);

    // Form state
    const [qText, setQText] = useState("");
    const [qType, setQType] = useState("mcq");
    const [qModuleId, setQModuleId] = useState("level_1");
    const [qCompetencyId, setQCompetencyId] = useState("");
    const [qDifficulty, setQDifficulty] = useState(0.5);
    const [qGradeBand, setQGradeBand] = useState("6-7");
    const [qCorrectAnswer, setQCorrectAnswer] = useState("");
    const [qExplanation, setQExplanation] = useState("");
    const [qOptions, setQOptions] = useState<QuestionOption[]>([
        { label: "A", text: "", isCorrect: true },
        { label: "B", text: "", isCorrect: false },
        { label: "C", text: "", isCorrect: false },
        { label: "D", text: "", isCorrect: false },
    ]);

    const create = useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post("/questions", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions-all"] }),
    });
    const update = useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) => api.put(`/questions/${id}`, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions-all"] }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => api.delete(`/questions/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions-all"] }),
    });

    function openCreate() {
        setEditing(null);
        setQText("");
        setQType("mcq");
        setQModuleId("level_1");
        setQCompetencyId("");
        setQDifficulty(0.5);
        setQGradeBand("6-7");
        setQCorrectAnswer("");
        setQExplanation("");
        setQOptions([
            { label: "A", text: "", isCorrect: true },
            { label: "B", text: "", isCorrect: false },
            { label: "C", text: "", isCorrect: false },
            { label: "D", text: "", isCorrect: false },
        ]);
        setShowModal(true);
    }

    function openEdit(q: Question) {
        setEditing(q);
        setQText(q.text);
        setQType(q.type);
        setQModuleId(q.module_id);
        setQCompetencyId(q.competency_id);
        setQDifficulty(q.difficulty);
        setQGradeBand(q.grade_band);
        setQCorrectAnswer(q.correct_answer ?? "");
        setQExplanation(q.explanation ?? "");
        setQOptions(
            q.options ?? [
                { label: "A", text: "", isCorrect: true },
                { label: "B", text: "", isCorrect: false },
                { label: "C", text: "", isCorrect: false },
                { label: "D", text: "", isCorrect: false },
            ]
        );
        setShowModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            text: qText,
            type: qType,
            module_id: qModuleId,
            competency_id: qCompetencyId,
            difficulty: qDifficulty,
            grade_band: qGradeBand,
            correct_answer: qCorrectAnswer || null,
            explanation: qExplanation || null,
            options: qType === "mcq" ? qOptions : null,
        };
        if (editing) {
            await update.mutateAsync({ id: editing.id, ...payload });
        } else {
            await create.mutateAsync(payload);
        }
        setShowModal(false);
    }

    const compMap = new Map((competencies ?? []).map((c) => [c.id, c.name]));
    const isPending = editing ? update.isPending : create.isPending;

    const filtered = (questions ?? []).filter((q) => {
        const matchSearch =
            !search ||
            q.text.toLowerCase().includes(search.toLowerCase()) ||
            q.competency_id.toLowerCase().includes(search.toLowerCase());
        const matchType = !typeFilter || q.type === typeFilter;
        return matchSearch && matchType;
    });

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Question Bank</h1>
                    <p className={s.subtitle}>Create and manage questions — link them to activities</p>
                </div>
                <button className={s.addBtn} onClick={openCreate}>
                    <Plus size={18} /> New Question
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                    <input className={s.input} style={{ paddingLeft: 36 }} placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className={s.select} style={{ width: 160 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All types</option>
                    <option value="mcq">MCQ</option>
                    <option value="short_answer">Short Answer</option>
                </select>
            </div>

            {isLoading && <p className={s.emptyState}>Loading questions...</p>}
            {!isLoading && !filtered.length && <p className={s.emptyState}>{search || typeFilter ? "No questions match." : "No questions yet."}</p>}
            {!isLoading && filtered.length > 0 && (
                <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>
                    Showing {filtered.length} of {questions?.length ?? 0} questions
                </p>
            )}

            {/* Question list */}
            <div className={s.sessionList}>
                {filtered.map((q, idx) => (
                    <div key={q.id} className={s.sessionCard}>
                        <div className={s.sessionOrder} style={{ fontSize: 11, fontWeight: 700, width: 36, height: 36 }}>
                            {idx + 1}
                        </div>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle} style={{ fontSize: 13 }}>{q.text}</div>
                            <div className={s.sessionMeta}>
                                <span style={{ fontWeight: 600 }}>{q.type.toUpperCase()}</span>
                                {" · "}
                                {compMap.get(q.competency_id) ?? q.competency_id}
                                {" · Diff: "}{q.difficulty}
                                {" · Grade "}{q.grade_band}
                                {q.options && (
                                    <span style={{ marginLeft: 6, opacity: 0.5 }}>
                                        [{q.options.map((o) => `${o.label}${o.isCorrect ? "✓" : ""}`).join(", ")}]
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={s.sessionActions}>
                            <button className={s.editBtn} onClick={() => openEdit(q)}>
                                <Pencil size={12} /> Edit
                            </button>
                            <button className={s.dangerBtn} onClick={() => { if (confirm("Delete this question?")) remove.mutate(q.id); }}>
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div className={s.overlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editing ? "Edit Question" : "New Question"}</h2>
                        <form onSubmit={handleSubmit} className={s.form}>
                            <div>
                                <label className={s.label}>Question Text *</label>
                                <textarea className={s.textarea} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="What is 2 + 2?" rows={2} required />
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Type</label>
                                    <select className={s.select} value={qType} onChange={(e) => setQType(e.target.value)}>
                                        <option value="mcq">MCQ</option>
                                        <option value="short_answer">Short Answer</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Module ID</label>
                                    <input className={s.input} value={qModuleId} onChange={(e) => setQModuleId(e.target.value)} placeholder="level_1" />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Competency *</label>
                                    <select className={s.select} value={qCompetencyId} onChange={(e) => setQCompetencyId(e.target.value)} required>
                                        <option value="">-- Select --</option>
                                        {competencies?.map((c) => (
                                            <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Difficulty (0–1)</label>
                                    <input className={s.input} type="number" step={0.1} min={0} max={1} value={qDifficulty} onChange={(e) => setQDifficulty(Number(e.target.value))} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Grade Band *</label>
                                    <select className={s.select} value={qGradeBand} onChange={(e) => setQGradeBand(e.target.value)}>
                                        {GRADE_BANDS.map((g) => (<option key={g} value={g}>{g}</option>))}
                                    </select>
                                </div>
                            </div>

                            {qType === "mcq" && (
                                <div>
                                    <label className={s.label}>Options</label>
                                    {qOptions.map((opt, i) => (
                                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                                            <span style={{ fontWeight: 700, width: 20, fontSize: 13 }}>{opt.label}</span>
                                            <input className={s.input} style={{ flex: 1 }} value={opt.text} onChange={(e) => { const next = [...qOptions]; next[i] = { ...next[i], text: e.target.value }; setQOptions(next); }} placeholder={`Option ${opt.label}`} />
                                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                                                <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setQOptions(qOptions.map((o, j) => ({ ...o, isCorrect: j === i })))} />
                                                Correct
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {qType === "short_answer" && (
                                <div>
                                    <label className={s.label}>Correct Answer</label>
                                    <input className={s.input} value={qCorrectAnswer} onChange={(e) => setQCorrectAnswer(e.target.value)} placeholder="Expected answer" />
                                </div>
                            )}

                            <div>
                                <label className={s.label}>Explanation (optional)</label>
                                <textarea className={s.textarea} value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Why is this the right answer?" rows={2} />
                            </div>

                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className={s.submitBtn} disabled={isPending}>
                                    {isPending ? "Saving..." : editing ? "Save Changes" : "Create Question"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
