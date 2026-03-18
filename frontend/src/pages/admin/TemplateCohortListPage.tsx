import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    useTemplates,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
} from "@/api/hooks/useAdmin";
import { api } from "@/api/client";
import type { Template } from "@/api/types/admin";
import { Plus, Trash2, Pencil, X, LayoutTemplate, Clock, Layers, ArrowLeft, ArrowRight } from "lucide-react";
import * as s from "./admin.css";

interface Activity {
    id: string;
    name: string;
    type: string;
    mode: string;
    module_id: string;
    duration_minutes: number | null;
    description: string | null;
}

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
    warmup: "#f59e0b",
    key_topic: "#6366f1",
    diy: "#10b981",
    ai_lab: "#ec4899",
    artifact: "#8b5cf6",
};

export default function TemplateCohortListPage() {
    const { data: templates, isLoading } = useTemplates();
    const create = useCreateTemplate();
    const update = useUpdateTemplate();
    const remove = useDeleteTemplate();

    const { data: allActivities } = useQuery<Activity[]>({
        queryKey: ["activities"],
        queryFn: () => api.get("/activities").then((r) => r.data),
    });

    const [showCreateEditModal, setShowCreateEditModal] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [activitySearch, setActivitySearch] = useState("");
    const [showLinkActivityPicker, setShowLinkActivityPicker] = useState(false);

    function openCreate(e?: React.MouseEvent) {
        e?.stopPropagation();
        setEditing(null);
        setTitle("");
        setDescription("");
        setShowCreateEditModal(true);
    }

    function openEdit(t: Template, e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(t);
        setTitle(t.title);
        setDescription(t.description ?? "");
        setShowCreateEditModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const payload = { title, description: description || undefined };
        if (editing) {
            await update.mutateAsync({ id: editing.id, ...payload });
        } else {
            await create.mutateAsync(payload);
        }
        setShowCreateEditModal(false);
        setEditing(null);
    }

    function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Delete this template?")) return;
        remove.mutate(id);
        if (selectedTemplate?.id === id) setSelectedTemplate(null);
    }

    function addActivity(templateId: string, activityId: string) {
        const template = templates?.find((t) => t.id === templateId) ?? selectedTemplate;
        if (!template || template.activities.includes(activityId)) return;
        update.mutate(
            { id: templateId, activities: [...template.activities, activityId] },
            {
                onSuccess: (updated) => {
                    if (selectedTemplate?.id === templateId) setSelectedTemplate(updated);
                },
            }
        );
    }

    function removeActivity(templateId: string, activityId: string) {
        const template = templates?.find((t) => t.id === templateId) ?? selectedTemplate;
        if (!template) return;
        update.mutate(
            { id: templateId, activities: template.activities.filter((a) => a !== activityId) },
            {
                onSuccess: (updated) => {
                    if (selectedTemplate?.id === templateId) setSelectedTemplate(updated);
                },
            }
        );
    }

    const isPending = editing ? update.isPending : create.isPending;
    const activityMap = new Map<string, Activity>();
    allActivities?.forEach((a) => activityMap.set(a.id, a));

    const modalTemplate = selectedTemplate;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Templates</h1>
                    <p className={s.subtitle}>Lesson plan blueprints — each becomes a session when imported into a cohort</p>
                </div>
                <button className={s.addBtn} onClick={() => openCreate()}>
                    <Plus size={18} /> New Template
                </button>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}
            {!isLoading && !templates?.length && (
                <p className={s.emptyState}>No templates yet. Create one to get started.</p>
            )}

            {!isLoading && (templates?.length ?? 0) > 0 && (
                <div className={s.grid}>
                    {templates!.map((t) => (
                            <div
                                key={t.id}
                                className={s.card}
                                onClick={() => setSelectedTemplate(t)}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    <div className={s.templateCardIcon}>
                                        <LayoutTemplate size={20} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className={s.cardTitle}>{t.title}</div>
                                        <div className={s.cardMeta}>
                                            <span>ID: {t.id}</span>
                                            <span>{t.activities.length} activities</span>
                                        </div>
                                        {t.description && (
                                            <div className={s.cardDesc}>
                                                {t.description.length > 100 ? `${t.description.slice(0, 100)}…` : t.description}
                                            </div>
                                        )}
                                        <div className={s.cardMeta} style={{ marginTop: 4 }}>
                                            {t.created_at && <span><Clock size={11} style={{ verticalAlign: "middle" }} /> Created {new Date(t.created_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={s.cardActions}>
                                    <button className={s.editBtn} onClick={(e) => openEdit(t, e)}>
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button className={s.dangerBtn} onClick={(e) => handleDelete(t.id, e)}>
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Template modal (no order field) */}
            {showCreateEditModal && (
                <div className={s.overlay} onClick={() => setShowCreateEditModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editing ? "Edit Template" : "New Template"}</h2>
                        <form onSubmit={handleSubmit} className={s.form}>
                            <div>
                                <label className={s.label}>Title *</label>
                                <input
                                    className={s.input}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Creative Thinking & Number Sense"
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.label}>Description</label>
                                <textarea
                                    className={s.textarea}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setShowCreateEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={s.submitBtn} disabled={isPending}>
                                    {isPending ? "Saving..." : editing ? "Save Changes" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template detail modal: linked activities, link new, remove */}
            {modalTemplate && (
                <div className={s.overlay} onClick={() => { setSelectedTemplate(null); setActivitySearch(""); setShowLinkActivityPicker(false); }}>
                    <div
                        className={s.modal}
                        style={{ width: "92vw", maxWidth: 900, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className={s.modalTitle}>“{modalTemplate.title}” — Activities</h2>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: -8, marginBottom: 16 }}>
                            {modalTemplate.description || "No description."}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0, overflow: "hidden" }}>
                            {/* Linked activities */}
                            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Layers size={16} />
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>Linked activities ({modalTemplate.activities.length})</span>
                                    </div>

                                    <button
                                        type="button"
                                        className={s.addBtn}
                                        style={{ padding: "6px 12px", fontSize: 12 }}
                                        onClick={() => { setActivitySearch(""); setShowLinkActivityPicker(true); }}
                                    >
                                        <Plus size={14} /> Link new activity
                                    </button>
                                </div>
                                {modalTemplate.activities.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                                        No activities yet. Click “Link new activity” to add one.
                                    </p>
                                ) : (
                                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                                        <div className={s.templateActivityGrid}>
                                            {modalTemplate.activities.map((id, idx) => {
                                                const a = activityMap.get(id);
                                                if (!a)
                                                    return (
                                                        <div
                                                            key={id}
                                                            style={{ padding: 12, border: "1px solid var(--color-border-subtle)", borderRadius: 8, fontSize: 12, opacity: 0.7 }}
                                                        >
                                                            Activity {id}
                                                        </div>
                                                    );
                                                return (
                                                    <div key={a.id} className={s.templateActivityCard}>
                                                        <div className={s.templateActivityCardHeader}>
                                                            <span className={s.templateActivityCardOrder}>Order {idx + 1}</span>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <button
                                                                    type="button"
                                                                    className={s.iconBtn}
                                                                    disabled={idx === 0 || update.isPending}
                                                                    onClick={async () => {
                                                                        const current = [...(modalTemplate.activities ?? [])];
                                                                        const i = current.indexOf(a.id);
                                                                        const j = i - 1;
                                                                        if (j < 0) return;
                                                                        const next = [...current];
                                                                        [next[i], next[j]] = [next[j], next[i]];
                                                                        const updated = await update.mutateAsync({ id: modalTemplate.id, activities: next });
                                                                        setSelectedTemplate(updated as Template);
                                                                    }}
                                                                    title="Move earlier"
                                                                >
                                                                    <ArrowLeft size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={s.iconBtn}
                                                                    disabled={idx === modalTemplate.activities.length - 1 || update.isPending}
                                                                    onClick={async () => {
                                                                        const current = [...(modalTemplate.activities ?? [])];
                                                                        const i = current.indexOf(a.id);
                                                                        const j = i + 1;
                                                                        if (j >= current.length) return;
                                                                        const next = [...current];
                                                                        [next[i], next[j]] = [next[j], next[i]];
                                                                        const updated = await update.mutateAsync({ id: modalTemplate.id, activities: next });
                                                                        setSelectedTemplate(updated as Template);
                                                                    }}
                                                                    title="Move later"
                                                                >
                                                                    <ArrowRight size={14} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className={s.dangerBtn}
                                                                    style={{ padding: "2px 8px", fontSize: 11 }}
                                                                    onClick={() => removeActivity(modalTemplate.id, a.id)}
                                                                    disabled={update.isPending}
                                                                >
                                                                    <X size={10} /> Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className={s.templateActivityCardTitle}>{a.name}</div>
                                                        <div className={s.templateActivityCardMeta}>
                                                            <span style={{ fontFamily: "monospace", fontSize: 11 }}>{a.id}</span>
                                                            <span style={{ color: ACTIVITY_TYPE_COLOR[a.type] ?? undefined, fontWeight: 600 }}>{a.type}</span>
                                                            {a.mode !== "default" && <span>{a.mode}</span>}
                                                            {a.duration_minutes != null && (
                                                                <span>
                                                                    <Clock size={11} style={{ verticalAlign: "middle" }} /> {a.duration_minutes}m
                                                                </span>
                                                            )}
                                                            <span>Module: {a.module_id}</span>
                                                        </div>
                                                        {a.description && (
                                                            <div className={s.templateActivityCardDesc}>
                                                                {a.description.length > 80 ? `${a.description.slice(0, 80)}…` : a.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Link new activity picker */}
                        {showLinkActivityPicker && (
                            <div
                                className={s.overlay}
                                onClick={() => { setShowLinkActivityPicker(false); setActivitySearch(""); }}
                                style={{ zIndex: 1100 }}
                            >
                                <div
                                    className={s.modal}
                                    style={{ maxWidth: 820, width: "92vw" }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h2 className={s.modalTitle}>Link activities</h2>
                                    <p style={{ marginTop: -10, marginBottom: 12, fontSize: 13, color: "var(--color-text-secondary)" }}>
                                        Pick activities one by one. They’ll be appended to the end, and you can reorder using arrows.
                                    </p>

                                    <div style={{ position: "relative", marginBottom: 12 }}>
                                        <input
                                            className={s.input}
                                            style={{ paddingLeft: 36, fontSize: 13 }}
                                            placeholder="Search by name, id, or type..."
                                            value={activitySearch}
                                            onChange={(e) => setActivitySearch(e.target.value)}
                                        />
                                    </div>

                                    <div className={s.addQuestionList}>
                                        {(allActivities ?? [])
                                            .filter((a) => !modalTemplate.activities.includes(a.id))
                                            .filter(
                                                (a) =>
                                                    !activitySearch.trim() ||
                                                    a.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
                                                    a.id.toLowerCase().includes(activitySearch.toLowerCase()) ||
                                                    a.type.toLowerCase().includes(activitySearch.toLowerCase())
                                            )
                                            .slice(0, 50)
                                            .map((a) => (
                                                <div key={a.id} className={s.addQuestionRow}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 500, fontSize: 13 }}>{a.name}</div>
                                                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                                                            {a.type} · {a.id} · Module {a.module_id}
                                                            {a.duration_minutes != null ? ` · ${a.duration_minutes}m` : ""}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={s.addBtn}
                                                        style={{ padding: "4px 12px", fontSize: 11, flexShrink: 0 }}
                                                        onClick={() => addActivity(modalTemplate.id, a.id)}
                                                        disabled={update.isPending}
                                                    >
                                                        <Plus size={10} /> Link
                                                    </button>
                                                </div>
                                            ))}

                                        {modalTemplate.activities.length > 0 &&
                                            (allActivities ?? []).filter((a) => !modalTemplate.activities.includes(a.id)).length === 0 && (
                                                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                                                    All activities are already linked.
                                                </p>
                                            )}
                                    </div>

                                    <div className={s.formActions} style={{ marginTop: 16 }}>
                                        <button
                                            type="button"
                                            className={s.cancelBtn}
                                            onClick={() => { setShowLinkActivityPicker(false); setActivitySearch(""); }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={s.formActions} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border-subtle)" }}>
                            <button
                                type="button"
                                className={s.cancelBtn}
                                onClick={() => { setSelectedTemplate(null); setActivitySearch(""); setShowLinkActivityPicker(false); }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
