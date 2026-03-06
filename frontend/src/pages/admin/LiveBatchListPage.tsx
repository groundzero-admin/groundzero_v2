import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
    useLiveBatches,
    useCreateLiveBatch,
    useUpdateLiveBatch,
    useDeleteLiveBatch,
} from "@/api/hooks/useAdmin";
import type { LiveBatch } from "@/api/types/admin";
import { Plus, Trash2, Pencil } from "lucide-react";
import * as s from "./admin.css";

export default function LiveBatchListPage() {
    const navigate = useNavigate();
    const { data: batches, isLoading } = useLiveBatches();
    const create = useCreateLiveBatch();
    const update = useUpdateLiveBatch();
    const remove = useDeleteLiveBatch();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<LiveBatch | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("12:00");

    function openCreate() {
        setEditing(null);
        setName("");
        setDescription("");
        setStartDate("");
        setStartTime("10:00");
        setEndTime("12:00");
        setShowModal(true);
    }

    function openEdit(b: LiveBatch, e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(b);
        setName(b.name);
        setDescription(b.description ?? "");
        setStartDate(b.start_date);
        // Parse "10:00-12:00" → start/end
        const parts = b.daily_timing.split("-");
        setStartTime(parts[0]?.trim() ?? "10:00");
        setEndTime(parts[1]?.trim() ?? "12:00");
        setShowModal(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const daily_timing = `${startTime}-${endTime}`;
        if (editing) {
            await update.mutateAsync({
                id: editing.id,
                name,
                description: description || undefined,
                start_date: startDate,
                daily_timing,
            });
        } else {
            await create.mutateAsync({
                name,
                description: description || undefined,
                start_date: startDate,
                daily_timing,
            });
        }
        setShowModal(false);
        setEditing(null);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Delete this batch? All sessions inside will also be deleted.")) return;
        await remove.mutateAsync(id);
    }

    const isPending = editing ? update.isPending : create.isPending;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Launch Batches</h1>
                    <p className={s.subtitle}>Create and manage live cohort batches</p>
                </div>
                <button className={s.addBtn} onClick={openCreate}>
                    <Plus size={18} /> New Batch
                </button>
            </div>

            {isLoading && <p className={s.emptyState}>Loading...</p>}

            {!isLoading && !batches?.length && (
                <p className={s.emptyState}>No batches yet. Create one to get started.</p>
            )}

            <div className={s.grid}>
                {batches?.map((b) => (
                    <div key={b.id} className={s.card} onClick={() => navigate(`/admin/batches/${b.id}`)}>
                        <div className={s.cardTitle}>{b.name}</div>
                        <div className={s.cardMeta}>
                            <span>Starts {new Date(b.start_date).toLocaleDateString()}</span>
                            <span className={s.badge}>🕐 {b.daily_timing}</span>
                        </div>
                        {b.description && <div className={s.cardDesc}>{b.description}</div>}
                        <div className={s.cardActions}>
                            <button className={s.editBtn} onClick={(e) => openEdit(b, e)}>
                                <Pencil size={12} /> Edit
                            </button>
                            <button className={s.dangerBtn} onClick={(e) => handleDelete(b.id, e)}>
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
                            {editing ? "Edit Live Batch" : "New Live Batch"}
                        </h2>
                        <form onSubmit={handleSubmit} className={s.form}>
                            <div>
                                <label className={s.label}>Batch Name *</label>
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
                                <label className={s.label}>Start Date *</label>
                                <input
                                    className={s.input}
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.label}>Daily Timing *</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        className={s.input}
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                    <span style={{ fontWeight: 500, opacity: 0.5 }}>to</span>
                                    <input
                                        className={s.input}
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
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
