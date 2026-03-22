import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
    useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity,
    useLinkActivityQuestion, useUnlinkActivityQuestion, useReorderActivityQuestions, useActivityQuestions,
} from "@/api/hooks/useAdmin";
import type { ActivityQuestion } from "@/api/types/admin";
import { Plus, Pencil, Trash2, Search, Clock, Layers, HelpCircle, Link2, Unlink, ExternalLink, Eye, ArrowLeft, ArrowRight } from "lucide-react";
import LivePreview from "./LivePreview";
import * as s from "./admin.css";

// ── Types ──

interface Activity {
    id: string;
    module_id: string;
    name: string;
    type: string;
    mode: string;
    week: number | null;
    session_number: number | null;
    duration_minutes: number | null;
    pillar_id: string | null;
    grade_bands: string[] | null;
    description: string | null;
    learning_outcomes: string[] | null;
    primary_competencies: { competency_id: string; expected_gain?: number }[] | null;
    question_ids: string[] | null;
}

const ACTIVITY_TYPES = ["warmup", "key_topic", "diy", "ai_lab", "artifact"];
const ACTIVITY_MODES = ["default", "timed_mcq", "open_ended", "discussion"];
const PILLARS = [
    { id: "math_logic", name: "Math & Logic" },
    { id: "communication", name: "Communication" },
    { id: "creativity", name: "Creativity" },
    { id: "ai_systems", name: "AI & Systems" },
];

const typeColor: Record<string, string> = {
    warmup: "#f59e0b", key_topic: "#6366f1", diy: "#10b981", ai_lab: "#ec4899", artifact: "#8b5cf6",
};

function extractStatementSnippet(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const candidates = [d.instruction, d.prompt, d.question, d.text, d.sentence, d.stem];
    for (const v of candidates) {
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
}

// ── Component ──

export default function AdminActivitiesPage() {
    const navigate = useNavigate();
    const { data: activities, isLoading } = useActivities();
    const { data: allQuestions } = useActivityQuestions();
    const createActivity = useCreateActivity();
    const updateActivity = useUpdateActivity();
    const deleteActivity = useDeleteActivity();
    const linkQuestion = useLinkActivityQuestion();
    const unlinkQuestion = useUnlinkActivityQuestion();
    const reorderQuestions = useReorderActivityQuestions();

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    // Activity modal
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [formId, setFormId] = useState("");
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState("warmup");
    const [formMode, setFormMode] = useState("default");
    const [formModuleId, setFormModuleId] = useState("level_1");
    const [formDuration, setFormDuration] = useState<number | "">("");
    const [formDescription, setFormDescription] = useState("");
    const [formPillarId, setFormPillarId] = useState("");

    // Question management modal
    const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [linkSearch, setLinkSearch] = useState("");
    const [, setLinkGradeFilter] = useState("");
    const [previewQuestion, setPreviewQuestion] = useState<ActivityQuestion | null>(null);

    function openManageQuestions(a: Activity) {
        setActiveActivity(a);
        setShowQuestionModal(true);
        setPreviewQuestion(null);
        setLinkSearch("");
        setLinkGradeFilter("");
    }

    function openCreateActivity() {
        setEditingActivity(null);
        setFormId(""); setFormName(""); setFormType("warmup"); setFormMode("default");
        setFormModuleId("level_1"); setFormDuration(""); setFormDescription(""); setFormPillarId("");
        setShowActivityModal(true);
    }

    function openEditActivity(a: Activity) {
        setEditingActivity(a);
        setFormId(a.id); setFormName(a.name); setFormType(a.type); setFormMode(a.mode);
        setFormModuleId(a.module_id); setFormDuration(a.duration_minutes ?? ""); setFormDescription(a.description ?? ""); setFormPillarId(a.pillar_id ?? "");
        setShowActivityModal(true);
    }

    async function handleActivitySubmit(e: FormEvent) {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            name: formName, type: formType, mode: formMode, module_id: formModuleId,
            duration_minutes: formDuration !== "" ? Number(formDuration) : null,
            description: formDescription || null,
            pillar_id: formPillarId || null,
        };
        if (editingActivity) {
            await updateActivity.mutateAsync({ id: editingActivity.id, ...payload });
        } else {
            await createActivity.mutateAsync({ id: formId, ...payload });
        }
        setShowActivityModal(false);
    }

    const filtered = ((activities ?? []) as Activity[]).filter((a) => {
        const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || (a.description ?? "").toLowerCase().includes(search.toLowerCase());
        const matchType = !typeFilter || a.type === typeFilter;
        return matchSearch && matchType;
    });

    const questionMap = new Map((allQuestions ?? []).map((q: ActivityQuestion) => [String(q.id), q]));
    const activityPending = editingActivity ? updateActivity.isPending : createActivity.isPending;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Activities</h1>
                    <p className={s.subtitle}>Create activities and link rich questions — add them to templates to build sessions</p>
                </div>
                <button className={s.addBtn} onClick={openCreateActivity}>
                    <Plus size={18} /> New Activity
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                    <input className={s.input} style={{ paddingLeft: 36 }} placeholder="Search by name, id, or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className={s.select} style={{ width: 160 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All types</option>
                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
            </div>

            {isLoading && <p className={s.emptyState}>Loading activities...</p>}
            {!isLoading && !filtered.length && <p className={s.emptyState}>{search || typeFilter ? "No activities match your filters." : "No activities yet. Create one to get started."}</p>}
            {!isLoading && filtered.length > 0 && (
                <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>Showing {filtered.length} of {(activities as Activity[])?.length ?? 0} activities</p>
            )}

            {/* Activity cards grid */}
            <div className={s.grid}>
                {filtered.map((a) => {
                    const linkedQuestions = (a.question_ids ?? []).map((qid) => questionMap.get(qid)).filter(Boolean) as ActivityQuestion[];
                    return (
                        <div
                            key={a.id}
                            className={s.card}
                            onClick={() => { setActiveActivity(a); setShowQuestionModal(true); setPreviewQuestion(null); setLinkSearch(""); }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ minWidth: 0 }}>
                                    <div className={s.cardTitle}>{a.name}</div>
                                    <div className={s.cardMeta}>
                                        <span style={{ fontFamily: "monospace", opacity: 0.6 }}>{a.id}</span>
                                        <span style={{ color: typeColor[a.type], fontWeight: 600 }}>{a.type.replace("_", " ")}</span>
                                        {a.mode !== "default" && (
                                            <span><Layers size={11} style={{ verticalAlign: "middle" }} /> {a.mode.replace("_", " ")}</span>
                                        )}
                                        {a.pillar_id && (
                                            <span style={{ opacity: 0.6 }}>{PILLARS.find((p) => p.id === a.pillar_id)?.name ?? a.pillar_id}</span>
                                        )}
                                    </div>
                                    <div className={s.cardMeta}>
                                        <span>Module: {a.module_id}</span>
                                        {a.duration_minutes && <span><Clock size={11} style={{ verticalAlign: "middle" }} /> {a.duration_minutes}m</span>}
                                        <span><HelpCircle size={11} style={{ verticalAlign: "middle" }} /> {linkedQuestions.length} questions</span>
                                    </div>
                                    {a.description && (
                                        <div className={s.cardDesc}>
                                            {a.description.length > 120 ? `${a.description.slice(0, 120)}…` : a.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={s.cardActions}>
                                <button
                                    className={s.editBtn}
                                    onClick={(e) => { e.stopPropagation(); openEditActivity(a); }}
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                                <button
                                    className={s.editBtn}
                                    onClick={(e) => { e.stopPropagation(); openManageQuestions(a); }}
                                >
                                    Questions
                                </button>
                                <button
                                    className={s.dangerBtn}
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete activity "${a.id}"?`)) deleteActivity.mutate(a.id); }}
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Activity Create/Edit Modal ── */}
            {showActivityModal && (
                <div className={s.overlay} onClick={() => setShowActivityModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editingActivity ? "Edit Activity" : "New Activity"}</h2>
                        <form onSubmit={handleActivitySubmit} className={s.form}>
                            {!editingActivity && (
                                <div>
                                    <label className={s.label}>Activity ID *</label>
                                    <input className={s.input} value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="e.g. L1-W1-S1-warmup" required />
                                    <span style={{ fontSize: 11, opacity: 0.5 }}>Unique identifier — cannot be changed</span>
                                </div>
                            )}
                            <div>
                                <label className={s.label}>Name *</label>
                                <input className={s.input} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Number Sense Warm-up" required />
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Type *</label>
                                    <select className={s.select} value={formType} onChange={(e) => setFormType(e.target.value)}>
                                        {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Mode</label>
                                    <select className={s.select} value={formMode} onChange={(e) => setFormMode(e.target.value)}>
                                        {ACTIVITY_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Module ID</label>
                                    <input className={s.input} value={formModuleId} onChange={(e) => setFormModuleId(e.target.value)} placeholder="e.g. level_1" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Duration (min)</label>
                                    <input className={s.input} type="number" min={1} value={formDuration} onChange={(e) => setFormDuration(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 15" />
                                </div>
                            </div>
                            <div>
                                <label className={s.label}>Pillar (optional)</label>
                                <select className={s.select} value={formPillarId} onChange={(e) => setFormPillarId(e.target.value)}>
                                    <option value="">— None —</option>
                                    {PILLARS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <span style={{ fontSize: 11, opacity: 0.5 }}>Used for ZPD auto-selection when no questions are linked</span>
                            </div>
                            <div>
                                <label className={s.label}>Description</label>
                                <textarea className={s.textarea} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="What students will do..." rows={3} />
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setShowActivityModal(false)}>Cancel</button>
                                <button type="submit" className={s.submitBtn} disabled={activityPending}>
                                    {activityPending ? "Saving..." : editingActivity ? "Save Changes" : "Create Activity"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Manage Questions Modal (large) ── */}
            {showQuestionModal && activeActivity && (() => {
                const linkedIds = new Set((activeActivity.question_ids ?? []).map((id) => String(id)));
                const linked = (activeActivity.question_ids ?? [])
                    .map((id) => questionMap.get(String(id)))
                    .filter(Boolean) as ActivityQuestion[];
                const unlinked = (allQuestions ?? []).filter((q: ActivityQuestion) => !linkedIds.has(String(q.id)));
                const searchFiltered = linkSearch.trim()
                    ? unlinked.filter((q: ActivityQuestion) => {
                        const text = `${q.title} ${q.template_name ?? ""} ${q.template_slug ?? ""}`.toLowerCase();
                        return text.includes(linkSearch.toLowerCase());
                    })
                    : unlinked;
                const showAddList = linkSearch.length >= 0;

                return (
                    <div className={s.overlay} onClick={() => { setShowQuestionModal(false); setActiveActivity(null); setPreviewQuestion(null); }}>
                        <div
                            className={s.modal}
                            style={{ width: "92vw", maxWidth: 1100, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className={s.modalTitle}>Manage Questions — “{activeActivity.name}”</h2>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, flex: 1, minHeight: 0 }}>
                                {/* Left: Linked cards + Add section */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 0, overflow: "hidden" }}>
                                    {/* Linked Questions — small cards */}
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                            <HelpCircle size={16} style={{ flexShrink: 0 }} />
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>Linked Questions ({linked.length})</span>
                                        </div>
                                        {linked.length === 0 ? (
                                            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>No questions linked yet. Add some below.</p>
                                        ) : (
                                            <div className={s.questionsCardGrid}>
                                                {linked.map((q) => {
                                                    const pos = (activeActivity.question_ids ?? []).indexOf(String(q.id));
                                                    const canMoveLeft = pos > 0;
                                                    const canMoveRight = pos >= 0 && pos < (activeActivity.question_ids ?? []).length - 1;
                                                    const statement = extractStatementSnippet(q.data);
                                                    const move = (dir: "left" | "right") => {
                                                        const arr = [...(activeActivity.question_ids ?? [])];
                                                        const i = arr.indexOf(String(q.id));
                                                        if (i === -1) return;
                                                        const j = dir === "left" ? i - 1 : i + 1;
                                                        if (j < 0 || j >= arr.length) return;
                                                        [arr[i], arr[j]] = [arr[j], arr[i]];
                                                        reorderQuestions.mutate(
                                                            { activityId: activeActivity.id, questionIds: arr },
                                                            {
                                                                onSuccess: () => {
                                                                    setActiveActivity((prev) => (prev ? { ...prev, question_ids: arr } : null));
                                                                },
                                                            }
                                                        );
                                                    };
                                                    return (
                                                        <div
                                                            key={q.id}
                                                            className={s.questionMiniCard}
                                                            onClick={() => setPreviewQuestion(q)}
                                                        >
                                                            <div className={s.questionMiniCardHeader}>
                                                                <span className={s.questionMiniCardOrder}>Order {pos + 1}</span>
                                                                <div style={{ display: "flex", gap: 4 }}>
                                                                    <button
                                                                        type="button"
                                                                        className={s.iconBtn}
                                                                        disabled={!canMoveLeft || reorderQuestions.isPending}
                                                                        onClick={(e) => { e.stopPropagation(); move("left"); }}
                                                                        title="Move earlier"
                                                                    >
                                                                        <ArrowLeft size={12} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className={s.iconBtn}
                                                                        disabled={!canMoveRight || reorderQuestions.isPending}
                                                                        onClick={(e) => { e.stopPropagation(); move("right"); }}
                                                                        title="Move later"
                                                                    >
                                                                        <ArrowRight size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className={s.questionMiniCardTitle}>{q.title}</div>
                                                            {statement && (
                                                                <div className={s.questionMiniCardStem}>{statement.slice(0, 120)}{statement.length > 120 ? "…" : ""}</div>
                                                            )}
                                                            <div className={s.questionMiniCardMeta}>
                                                                {q.template_name ?? q.template_slug ?? "—"} · Grade {q.grade_band || "any"} · {q.is_published ? "Published" : "Draft"}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={s.dangerBtn}
                                                                style={{ marginTop: 8, padding: "4px 10px", fontSize: 11 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    unlinkQuestion.mutate(
                                                                        { activityId: activeActivity.id, questionId: q.id },
                                                                        {
                                                                            onSuccess: (updated: Activity) => {
                                                                                setActiveActivity((prev) => (prev && prev.id === updated.id ? { ...prev, question_ids: updated.question_ids ?? [] } : prev));
                                                                            },
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                <Unlink size={10} /> Unlink
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add question: Link Existing (search) + Create New */}
                                    <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 16 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>Add question</span>
                                            <button
                                                type="button"
                                                className={s.addBtn}
                                                style={{ padding: "6px 14px", fontSize: 12 }}
                                                onClick={() => navigate("/admin/create-question")}
                                            >
                                                <ExternalLink size={12} /> Create New
                                            </button>
                                        </div>
                                        <div style={{ position: "relative", marginBottom: 10 }}>
                                            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
                                            <input
                                                className={s.input}
                                                style={{ paddingLeft: 36 }}
                                                placeholder="Search question bank by title or template…"
                                                value={linkSearch}
                                                onChange={(e) => setLinkSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className={s.addQuestionList}>
                                            {showAddList && (linkSearch.trim() ? searchFiltered : unlinked).slice(0, 50).map((q: ActivityQuestion) => (
                                                <div key={q.id} className={s.addQuestionRow}>
                                                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => setPreviewQuestion(q)}>
                                                        <div style={{ fontWeight: 500, fontSize: 13 }}>{q.title}</div>
                                                        {extractStatementSnippet(q.data) && (
                                                            <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                                                                {extractStatementSnippet(q.data)!.slice(0, 80)}…
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                                                            {q.template_name ?? q.template_slug ?? "—"} · Grade {q.grade_band || "any"}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={s.addBtn}
                                                        style={{ padding: "4px 12px", fontSize: 11, flexShrink: 0 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            linkQuestion.mutate(
                                                                { activityId: activeActivity.id, questionId: q.id },
                                                                {
                                                                    onSuccess: (updated: Activity) => {
                                                                        setActiveActivity((prev) => (prev && prev.id === updated.id ? { ...prev, question_ids: updated.question_ids ?? [] } : prev));
                                                                    },
                                                                }
                                                            );
                                                        }}
                                                        disabled={linkQuestion.isPending}
                                                    >
                                                        <Link2 size={10} /> Link
                                                    </button>
                                                </div>
                                            ))}
                                            {!linkSearch.trim() && unlinked.length === 0 && linked.length > 0 && (
                                                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>All questions are already linked.</p>
                                            )}
                                            {linkSearch.trim() && searchFiltered.length === 0 && (
                                                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                                                    No matches. <button type="button" className={s.editBtn} style={{ fontSize: 12 }} onClick={() => navigate("/admin/create-question")}>Create new question →</button>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Preview */}
                                <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderLeft: "1px solid var(--color-border-subtle)", paddingLeft: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "var(--color-text-secondary)", fontWeight: 600, fontSize: 13 }}>
                                        <Eye size={16} /> Question preview
                                    </div>
                                    <div style={{ flex: 1, minHeight: 280, overflow: "auto" }}>
                                        {previewQuestion ? (
                                            previewQuestion.template_slug ? (
                                                <LivePreview slug={previewQuestion.template_slug} data={previewQuestion.data ?? {}} />
                                            ) : (
                                                <div className={s.emptyState}>No preview (missing template).</div>
                                            )
                                        ) : (
                                            <div className={s.emptyState}>Click a question to preview.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={s.formActions} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border-subtle)" }}>
                                <button type="button" className={s.cancelBtn} onClick={() => { setShowQuestionModal(false); setActiveActivity(null); setPreviewQuestion(null); }}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
