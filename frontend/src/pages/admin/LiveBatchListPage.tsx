import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
    useCohorts,
    useCreateCohort,
    useUpdateCohort,
    useDeleteCohort,
} from "@/api/hooks/useAdmin";
import type { Cohort } from "@/api/types/admin";
import { Plus, Trash2, Pencil } from "lucide-react";
import * as s from "./admin.css";

export default function CohortListPage() {
    const navigate = useNavigate();
    const { data: cohorts, isLoading } = useCohorts();
    const create = useCreateCohort();
    const update = useUpdateCohort();
    const remove = useDeleteCohort();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Cohort | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [gradeBand, setGradeBand] = useState("6-7");
    const [board, setBoard] = useState("cbse");

    function openCreate() {
        setEditing(null);
        setName("");
        setDescription("");
        setGradeBand("6-7");
        setBoard("cbse");
        setShowModal(true);
    }

    function openEdit(c: Cohort, e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(c);
        setName(c.name);
        setDescription(c.description ?? "");
        setGradeBand(c.grade_band);
        setBoard(c.board ?? "cbse");
        setShowModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (editing) {
            await update.mutateAsync({
                id: editing.id,
                name,
                description: description || undefined,
                grade_band: gradeBand,
                board,
            });
        } else {
            await create.mutateAsync({
                name,
                description: description || undefined,
                grade_band: gradeBand,
                board,
            });
        }
        setShowModal(false);
        setEditing(null);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Delete this cohort? All sessions inside will also be deleted.")) return;
        await remove.mutateAsync(id);
    }

    const isPending = editing ? update.isPending : create.isPending;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Cohorts</h1>
                    <p className={s.subtitle}>Create and manage student cohorts</p>
                </div>
                <button className={s.addBtn} onClick={openCreate}>
                    <Plus size={18} /> New Cohort
                </button>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}

            {!isLoading && !cohorts?.length && (
                <p className={s.emptyState}>No cohorts yet. Create one to get started.</p>
            )}

            <div className={s.grid}>
                {cohorts?.map((c) => (
                    <div key={c.id} className={s.card} onClick={() => navigate(`/admin/cohorts/${c.id}`)}>
                        <div className={s.cardTitle}>{c.name}</div>
                        <div className={s.cardMeta}>
                            <span>Grade {c.grade_band}</span>
                            {c.board && <span className={s.badge}>{c.board.toUpperCase()}</span>}
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

            {showModal && (
                <div className={s.overlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>
                            {editing ? "Edit Cohort" : "New Cohort"}
                        </h2>
                        <form onSubmit={handleSubmit} className={s.form}>
                            <div>
                                <label className={s.label}>Cohort Name *</label>
                                <input
                                    className={s.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Weekend Batch March 2026"
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
                                <label className={s.label}>Grade Band</label>
                                <select className={s.select} value={gradeBand} onChange={(e) => setGradeBand(e.target.value)}>
                                    <option value="4-5">4-5</option>
                                    <option value="6-7">6-7</option>
                                    <option value="8-9">8-9</option>
                                </select>
                            </div>
                            <div>
                                <label className={s.label}>Board</label>
                                <select className={s.select} value={board} onChange={(e) => setBoard(e.target.value)}>
                                    <option value="cbse">CBSE</option>
                                    <option value="icse">ICSE</option>
                                    <option value="ib">IB</option>
                                </select>
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
