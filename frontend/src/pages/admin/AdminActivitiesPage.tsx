import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
    useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity,
    useLinkActivityQuestion, useUnlinkActivityQuestion, useActivityQuestions,
} from "@/api/hooks/useAdmin";
import type { ActivityQuestion } from "@/api/types/admin";
import { Plus, Pencil, Trash2, Search, Clock, Layers, ChevronDown, ChevronRight, HelpCircle, Link2, Unlink, ExternalLink } from "lucide-react";
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
    grade_bands: string[] | null;
    description: string | null;
    learning_outcomes: string[] | null;
    primary_competencies: { competency_id: string; expected_gain?: number }[] | null;
    question_ids: string[] | null;
}

const ACTIVITY_TYPES = ["warmup", "key_topic", "diy", "ai_lab", "artifact"];
const ACTIVITY_MODES = ["default", "timed_mcq", "open_ended", "discussion"];

const typeColor: Record<string, string> = {
    warmup: "#f59e0b", key_topic: "#6366f1", diy: "#10b981", ai_lab: "#ec4899", artifact: "#8b5cf6",
};

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

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    // Link question picker
    const [showLinkPicker, setShowLinkPicker] = useState(false);
    const [linkActivityId, setLinkActivityId] = useState<string | null>(null);
    const [linkSearch, setLinkSearch] = useState("");

    function openCreateActivity() {
        setEditingActivity(null);
        setFormId(""); setFormName(""); setFormType("warmup"); setFormMode("default");
        setFormModuleId("level_1"); setFormDuration(""); setFormDescription("");
        setShowActivityModal(true);
    }

    function openEditActivity(a: Activity) {
        setEditingActivity(a);
        setFormId(a.id); setFormName(a.name); setFormType(a.type); setFormMode(a.mode);
        setFormModuleId(a.module_id); setFormDuration(a.duration_minutes ?? ""); setFormDescription(a.description ?? "");
        setShowActivityModal(true);
    }

    async function handleActivitySubmit(e: FormEvent) {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            name: formName, type: formType, mode: formMode, module_id: formModuleId,
            duration_minutes: formDuration !== "" ? Number(formDuration) : null,
            description: formDescription || null,
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

    const questionMap = new Map((allQuestions ?? []).map((q: ActivityQuestion) => [q.id, q]));
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

            {/* Activity list */}
            <div className={s.sessionList}>
                {filtered.map((a) => {
                    const isExpanded = expandedId === a.id;
                    const linkedQuestions = (a.question_ids ?? []).map((qid) => questionMap.get(qid)).filter(Boolean) as ActivityQuestion[];
                    return (
                        <div key={a.id}>
                            <div className={s.sessionCard} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                                <div className={s.sessionOrder} style={{ backgroundColor: typeColor[a.type] ? `${typeColor[a.type]}18` : undefined, color: typeColor[a.type] ?? undefined, fontSize: 10, fontWeight: 700, width: 44, height: 44, textTransform: "uppercase" }}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                <div className={s.sessionInfo}>
                                    <div className={s.sessionTitle}>{a.name}</div>
                                    <div className={s.sessionMeta}>
                                        <span style={{ fontFamily: "monospace", opacity: 0.5 }}>{a.id}</span>
                                        {" · "}
                                        <span style={{ color: typeColor[a.type], fontWeight: 600 }}>{a.type.replace("_", " ")}</span>
                                        {a.mode !== "default" && <>{" · "}<Layers size={11} style={{ verticalAlign: "middle" }} /> {a.mode.replace("_", " ")}</>}
                                        {a.duration_minutes && <>{" · "}<Clock size={11} style={{ verticalAlign: "middle" }} /> {a.duration_minutes}m</>}
                                        {" · "}
                                        <HelpCircle size={11} style={{ verticalAlign: "middle" }} /> {linkedQuestions.length} questions
                                    </div>
                                    {a.description && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{a.description.length > 100 ? a.description.slice(0, 100) + "…" : a.description}</div>}
                                </div>
                                <div className={s.sessionActions}>
                                    <button className={s.editBtn} onClick={(e) => { e.stopPropagation(); openEditActivity(a); }}><Pencil size={12} /> Edit</button>
                                    <button className={s.dangerBtn} onClick={(e) => { e.stopPropagation(); if (confirm(`Delete activity "${a.id}"?`)) deleteActivity.mutate(a.id); }}><Trash2 size={12} /> Delete</button>
                                </div>
                            </div>

                            {/* Expanded: Question Panel */}
                            {isExpanded && (
                                <div style={{ padding: "12px 16px 16px 52px", background: "var(--color-surface-2, #f8f9fa)", borderRadius: "0 0 8px 8px", marginTop: -4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                                            <HelpCircle size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                            Questions ({linkedQuestions.length})
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className={s.importBtn} style={{ padding: "4px 12px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setLinkActivityId(a.id); setLinkSearch(""); setShowLinkPicker(true); }}>
                                                <Link2 size={12} /> Link Existing
                                            </button>
                                            <button className={s.addBtn} style={{ padding: "4px 12px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); navigate("/admin/create-question"); }}>
                                                <ExternalLink size={12} /> Create New
                                            </button>
                                        </div>
                                    </div>

                                    {linkedQuestions.length === 0 && (
                                        <p style={{ fontSize: 12, opacity: 0.6, fontStyle: "italic" }}>No questions linked yet. Link existing ones or create new.</p>
                                    )}

                                    {linkedQuestions.map((q, idx) => (
                                        <div key={q.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                                            <span style={{ fontSize: 11, opacity: 0.4, width: 20, paddingTop: 2 }}>{idx + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{q.title}</div>
                                                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                                                    {q.template_name ?? q.template_slug ?? "—"} · Grade {q.grade_band || "any"} · {q.is_published ? "Published" : "Draft"}
                                                </div>
                                            </div>
                                            <button className={s.dangerBtn} style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => unlinkQuestion.mutate({ activityId: a.id, questionId: q.id })}>
                                                <Unlink size={10} /> Unlink
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* ── Link Existing Question Picker ── */}
            {showLinkPicker && linkActivityId && (
                <div className={s.overlay} onClick={() => setShowLinkPicker(false)}>
                    <div className={s.modal} style={{ maxWidth: 650, maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Link Question to Activity</h2>
                        <div style={{ position: "relative", marginBottom: 12 }}>
                            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                            <input className={s.input} style={{ paddingLeft: 36 }} placeholder="Search by title or template..." value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} />
                        </div>

                        {(() => {
                            const activity = (activities as Activity[])?.find((a) => a.id === linkActivityId);
                            const linkedIds = new Set(activity?.question_ids ?? []);
                            const available = (allQuestions ?? []).filter((q: ActivityQuestion) => {
                                if (linkedIds.has(q.id)) return false;
                                if (!q.is_published) return false;
                                if (!linkSearch) return true;
                                return q.title.toLowerCase().includes(linkSearch.toLowerCase()) || (q.template_name ?? "").toLowerCase().includes(linkSearch.toLowerCase());
                            });
                            if (!available.length) return <p style={{ fontSize: 12, opacity: 0.6 }}>No published questions available. <button className={s.editBtn} style={{ fontSize: 12 }} onClick={() => { setShowLinkPicker(false); navigate("/admin/create-question"); }}>Create one →</button></p>;
                            return available.slice(0, 30).map((q: ActivityQuestion) => (
                                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{q.title}</div>
                                        <div style={{ fontSize: 11, opacity: 0.6 }}>
                                            {q.template_name ?? q.template_slug ?? "—"} · Grade {q.grade_band || "any"}
                                        </div>
                                    </div>
                                    <button
                                        className={s.addBtn}
                                        style={{ padding: "4px 12px", fontSize: 11 }}
                                        onClick={() => linkQuestion.mutate({ activityId: linkActivityId, questionId: q.id })}
                                        disabled={linkQuestion.isPending}
                                    >
                                        <Link2 size={10} /> Link
                                    </button>
                                </div>
                            ));
                        })()}

                        <div className={s.formActions} style={{ marginTop: 12 }}>
                            <button type="button" className={s.cancelBtn} onClick={() => setShowLinkPicker(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
