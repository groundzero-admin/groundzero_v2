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
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, X } from "lucide-react";
import * as s from "./admin.css";

interface Activity {
    id: string;
    name: string;
    type: string;
    mode: string;
    module_id: string;
    duration_minutes: number | null;
}

export default function TemplateCohortListPage() {
    const { data: templates, isLoading } = useTemplates();
    const create = useCreateTemplate();
    const update = useUpdateTemplate();
    const remove = useDeleteTemplate();

    const { data: allActivities } = useQuery<Activity[]>({
        queryKey: ["activities"],
        queryFn: () => api.get("/activities").then((r) => r.data),
    });

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activitySearch, setActivitySearch] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState<number | "">("");

    function openCreate() {
        setEditing(null);
        setTitle("");
        setDescription("");
        setOrder("");
        setShowModal(true);
    }

    function openEdit(t: Template, e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(t);
        setTitle(t.title);
        setDescription(t.description ?? "");
        setOrder(t.order ?? "");
        setShowModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const payload = {
            title,
            description: description || undefined,
            order: order !== "" ? Number(order) : undefined,
        };
        if (editing) {
            await update.mutateAsync({ id: editing.id, ...payload });
        } else {
            await create.mutateAsync(payload);
        }
        setShowModal(false);
        setEditing(null);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Delete this template?")) return;
        await remove.mutateAsync(id);
    }

    async function addActivity(templateId: string, activityId: string) {
        const template = templates?.find((t) => t.id === templateId);
        if (!template || template.activities.includes(activityId)) return;
        await update.mutateAsync({
            id: templateId,
            activities: [...template.activities, activityId],
        });
    }

    async function removeActivity(templateId: string, activityId: string) {
        const template = templates?.find((t) => t.id === templateId);
        if (!template) return;
        await update.mutateAsync({
            id: templateId,
            activities: template.activities.filter((a) => a !== activityId),
        });
    }

    const isPending = editing ? update.isPending : create.isPending;

    // Build activity lookup
    const activityMap = new Map<string, Activity>();
    allActivities?.forEach((a) => activityMap.set(a.id, a));

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Templates</h1>
                    <p className={s.subtitle}>Lesson plan blueprints — each becomes a session when imported into a cohort</p>
                </div>
                <button className={s.addBtn} onClick={openCreate}>
                    <Plus size={18} /> New Template
                </button>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}

            {!isLoading && !templates?.length && (
                <p className={s.emptyState}>No templates yet. Create one to get started.</p>
            )}

            <div className={s.sessionList}>
                {templates?.map((t) => {
                    const isExpanded = expandedId === t.id;
                    const assignedActivities = t.activities
                        .map((id) => activityMap.get(id))
                        .filter(Boolean) as Activity[];
                    const availableActivities = (allActivities ?? []).filter(
                        (a) => !t.activities.includes(a.id) && (
                            !activitySearch ||
                            a.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
                            a.id.toLowerCase().includes(activitySearch.toLowerCase()) ||
                            a.type.toLowerCase().includes(activitySearch.toLowerCase())
                        )
                    );

                    return (
                        <div key={t.id}>
                            <div className={s.sessionCard} onClick={() => setExpandedId(isExpanded ? null : t.id)} style={{ cursor: "pointer" }}>
                                <div className={s.sessionOrder} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                <div className={s.sessionInfo}>
                                    <div className={s.sessionTitle}>{t.title}</div>
                                    <div className={s.sessionMeta}>
                                        {t.activities.length > 0 && `${t.activities.length} activities`}
                                        {t.activities.length === 0 && " · No activities"}
                                        {t.description && ` — ${t.description}`}
                                    </div>
                                </div>
                                <div className={s.sessionActions}>
                                    <button className={s.editBtn} onClick={(e) => openEdit(t, e)}>
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button className={s.dangerBtn} onClick={(e) => handleDelete(t.id, e)}>
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: "12px 16px 16px 52px", background: "var(--color-surface-2, #f8f9fa)", borderRadius: "0 0 8px 8px", marginTop: -4 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Activities in this template:</div>

                                    {assignedActivities.length === 0 && (
                                        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>No activities assigned yet. Add some below.</p>
                                    )}

                                    {assignedActivities.map((a, idx) => (
                                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                                            <span style={{ fontSize: 12, opacity: 0.5, width: 20 }}>{idx + 1}</span>
                                            <span style={{ flex: 1, fontSize: 13 }}>
                                                <strong>{a.name}</strong>
                                                <span style={{ opacity: 0.6, marginLeft: 8 }}>{a.type} · {a.id}</span>
                                            </span>
                                            <button
                                                className={s.dangerBtn}
                                                style={{ padding: "2px 6px", fontSize: 11 }}
                                                onClick={() => removeActivity(t.id, a.id)}
                                                disabled={update.isPending}
                                            >
                                                <X size={10} /> Remove
                                            </button>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Add activity:</div>
                                        <input
                                            className={s.input}
                                            style={{ marginBottom: 8, fontSize: 13 }}
                                            placeholder="Search by name, id, or type..."
                                            value={activitySearch}
                                            onChange={(e) => setActivitySearch(e.target.value)}
                                        />
                                        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                                            {availableActivities.slice(0, 20).map((a) => (
                                                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 6, background: "var(--color-surface, #fff)" }}>
                                                    <span style={{ flex: 1, fontSize: 13 }}>
                                                        {a.name}
                                                        <span style={{ opacity: 0.5, marginLeft: 8 }}>{a.type} · {a.id}</span>
                                                    </span>
                                                    <button
                                                        className={s.addBtn}
                                                        style={{ padding: "2px 10px", fontSize: 11 }}
                                                        onClick={() => addActivity(t.id, a.id)}
                                                        disabled={update.isPending}
                                                    >
                                                        <Plus size={10} /> Add
                                                    </button>
                                                </div>
                                            ))}
                                            {availableActivities.length > 20 && (
                                                <p style={{ fontSize: 12, opacity: 0.5, textAlign: "center" }}>
                                                    Showing 20 of {availableActivities.length} — search to narrow down
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className={s.overlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>
                            {editing ? "Edit Template" : "New Template"}
                        </h2>
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
                            <div>
                                <label className={s.label}>Order</label>
                                <input
                                    className={s.input}
                                    type="number"
                                    min={0}
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : "")}
                                />
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setShowModal(false)}>
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
        </div>
    );
}
