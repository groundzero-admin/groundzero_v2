import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
    useTemplateCohorts,
    useCreateTemplateCohort,
    useUpdateTemplateCohort,
    useDeleteTemplateCohort,
} from "@/api/hooks/useAdmin";
import type { TemplateCohort } from "@/api/types/admin";
import { Plus, Trash2, Pencil } from "lucide-react";
import * as s from "./admin.css";

export default function TemplateCohortListPage() {
    const navigate = useNavigate();
    const { data: cohorts, isLoading } = useTemplateCohorts();
    const create = useCreateTemplateCohort();
    const update = useUpdateTemplateCohort();
    const remove = useDeleteTemplateCohort();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TemplateCohort | null>(null);

    // Form state (shared for create and edit)
    const [name, setName] = useState("");
    const [level, setLevel] = useState(1);
    const [mode, setMode] = useState<"online" | "offline">("online");
    const [description, setDescription] = useState("");

    function openCreate() {
        setEditing(null);
        setName("");
        setLevel(1);
        setMode("online");
        setDescription("");
        setShowModal(true);
    }

    function openEdit(c: TemplateCohort, e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(c);
        setName(c.name);
        setLevel(c.level);
        setMode(c.mode as "online" | "offline");
        setDescription(c.description ?? "");
        setShowModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (editing) {
            await update.mutateAsync({
                id: editing.id,
                name,
                level,
                mode,
                description: description || undefined,
            });
        } else {
            await create.mutateAsync({ name, level, mode, description: description || undefined });
        }
        setShowModal(false);
        setEditing(null);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Delete this template cohort? All sessions inside will also be deleted.")) return;
        await remove.mutateAsync(id);
    }

    const isPending = editing ? update.isPending : create.isPending;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Template Cohorts</h1>
                    <p className={s.subtitle}>Create reusable cohort blueprints with sessions</p>
                </div>
                <button className={s.addBtn} onClick={openCreate}>
                    <Plus size={18} /> New Template
                </button>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}

            {!isLoading && !cohorts?.length && (
                <p className={s.emptyState}>No template cohorts yet. Create one to get started.</p>
            )}

            <div className={s.grid}>
                {cohorts?.map((c) => (
                    <div key={c.id} className={s.card} onClick={() => navigate(`/admin/templates/${c.id}`)}>
                        <div className={s.cardTitle}>{c.name}</div>
                        <div className={s.cardMeta}>
                            <span>Level {c.level}</span>
                            <span className={`${s.badge} ${c.mode === "online" ? s.badgeSuccess : s.badgeWarning}`}>
                                {c.mode}
                            </span>
                        </div>
                        {c.description && <div className={s.cardDesc}>{c.description}</div>}
                        <div className={s.cardActions}>
                            <button className={s.editBtn} onClick={(e) => openEdit(c, e)}>
                                <Pencil size={12} /> Edit
                            </button>
                            <button className={s.dangerBtn} onClick={(e) => handleDelete(c.id, e)}>
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className={s.overlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>
                            {editing ? "Edit Template Cohort" : "New Template Cohort"}
                        </h2>
                        <form onSubmit={handleSubmit} className={s.form}>
                            <div>
                                <label className={s.label}>Name *</label>
                                <input
                                    className={s.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Level 1 — Weekend Batch"
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.label}>Level</label>
                                <input
                                    className={s.input}
                                    type="number"
                                    min={1}
                                    value={level}
                                    onChange={(e) => setLevel(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className={s.label}>Mode</label>
                                <select className={s.select} value={mode} onChange={(e) => setMode(e.target.value as "online" | "offline")}>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                </select>
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
